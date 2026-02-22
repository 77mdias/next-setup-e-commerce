import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";
import { resolveStoreBySlugOrActive } from "@/lib/store";

type ProductFacetCategory = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

type ProductFacets = {
  categories: ProductFacetCategory[];
  priceRange: {
    min: number;
    max: number;
  };
};

const FACETS_CACHE_TTL_MS = 5 * 60 * 1000;

const productFacetsCache = new Map<
  string,
  {
    value: ProductFacets;
    expiresAt: number;
  }
>();

function parseNumberParam(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCachedFacets(storeId: string): ProductFacets | null {
  const cached = productFacetsCache.get(storeId);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    productFacetsCache.delete(storeId);
    return null;
  }

  return cached.value;
}

function setCachedFacets(
  storeId: string,
  facets: ProductFacets,
): ProductFacets {
  productFacetsCache.set(storeId, {
    value: facets,
    expiresAt: Date.now() + FACETS_CACHE_TTL_MS,
  });

  return facets;
}

async function buildStoreFacets(storeId: string): Promise<ProductFacets> {
  const [countByCategory, priceRange] = await Promise.all([
    db.product.groupBy({
      by: ["categoryId"],
      where: {
        isActive: true,
        storeId,
      },
      _count: {
        _all: true,
      },
    }),
    db.product.aggregate({
      where: {
        isActive: true,
        storeId,
      },
      _min: {
        price: true,
      },
      _max: {
        price: true,
      },
    }),
  ]);

  const countsByCategoryId = new Map<string, number>(
    countByCategory.map((entry) => [entry.categoryId, entry._count._all]),
  );

  const activeCategories =
    countsByCategoryId.size === 0
      ? []
      : await db.category.findMany({
          where: {
            isActive: true,
            id: {
              in: [...countsByCategoryId.keys()],
            },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            sortOrder: true,
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });

  return {
    categories: activeCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: countsByCategoryId.get(category.id) ?? 0,
    })),
    priceRange: {
      min: priceRange._min.price ?? 0,
      max: priceRange._max.price ?? 0,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");
    const categorySlug = searchParams.get("category");
    const sort = searchParams.get("sort") ?? "newest";
    const minPrice = parseNumberParam(searchParams.get("minPrice"));
    const maxPrice = parseNumberParam(searchParams.get("maxPrice"));
    const includeFacets = searchParams.get("includeFacets") !== "0";

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const limit = Math.min(
      60,
      Math.max(1, Number.parseInt(searchParams.get("limit") ?? "24", 10) || 24),
    );
    const skip = (page - 1) * limit;

    const store = await resolveStoreBySlugOrActive(storeSlug);

    if (!store) {
      return NextResponse.json(
        {
          error: storeSlug
            ? "Loja não encontrada"
            : "Nenhuma loja ativa encontrada",
        },
        { status: 404 },
      );
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      storeId: store.id,
    };

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
        isActive: true,
      };
    }

    if (minPrice !== null || maxPrice !== null) {
      const priceFilter: Prisma.FloatFilter<"Product"> = {};

      if (minPrice !== null) {
        priceFilter.gte = minPrice;
      }

      if (maxPrice !== null) {
        priceFilter.lte = maxPrice;
      }

      where.price = priceFilter;
    }

    const orderByMap: Record<
      string,
      | Prisma.ProductOrderByWithRelationInput
      | Prisma.ProductOrderByWithRelationInput[]
    > = {
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      "name-asc": { name: "asc" },
      "name-desc": { name: "desc" },
      "price-asc": { price: "asc" },
      "price-desc": { price: "desc" },
      rating: [
        { rating: "desc" },
        { reviewCount: "desc" },
        { createdAt: "desc" },
      ],
      "best-selling": [{ soldCount: "desc" }, { rating: "desc" }],
    };

    const cachedFacets = getCachedFacets(store.id);
    const facetsPromise = includeFacets
      ? cachedFacets
        ? Promise.resolve(cachedFacets)
        : buildStoreFacets(store.id).then((facets) =>
            setCachedFacets(store.id, facets),
          )
      : Promise.resolve(cachedFacets);

    const [products, total, facets] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          originalPrice: true,
          rating: true,
          images: true,
          isOnSale: true,
          isFeatured: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: orderByMap[sort] ?? orderByMap.newest,
        skip,
        take: limit,
      }),
      db.product.count({
        where,
      }),
      facetsPromise,
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      store,
      products,
      total,
      page,
      limit,
      totalPages,
      filters: {
        category: categorySlug,
        minPrice,
        maxPrice,
        sort,
      },
      facets,
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
