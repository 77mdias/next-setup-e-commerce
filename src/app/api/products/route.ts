import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";
import { resolveActiveStore } from "@/lib/store";

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

type ResolvedStore = NonNullable<
  Awaited<ReturnType<typeof resolveActiveStore>>
>;

type ProductsApiResponse = {
  success: true;
  store: ResolvedStore;
  products: {
    id: string;
    name: string;
    price: number;
    originalPrice: number | null;
    rating: number;
    images: string[];
    isOnSale: boolean;
    isFeatured: boolean;
    category: {
      name: string;
    } | null;
  }[];
  total: number | null;
  page: number;
  limit: number;
  totalPages: number | null;
  hasMore: boolean;
  filters: {
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    sort: string;
  };
  facets: ProductFacets | null;
};

const FACETS_CACHE_TTL_MS = 5 * 60 * 1000;
const PRODUCTS_CACHE_TTL_MS = 30 * 1000;
const CATEGORY_LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000;
const PRODUCTS_CACHE_CONTROL = "public, max-age=20, stale-while-revalidate=60";
const FACETS_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=180";

const productFacetsCache = new Map<
  string,
  {
    value: ProductFacets;
    expiresAt: number;
  }
>();
const productFacetsInFlight = new Map<string, Promise<ProductFacets | null>>();
const productsResponseCache = new Map<
  string,
  {
    value: ProductsApiResponse;
    expiresAt: number;
  }
>();
const productsResponseInFlight = new Map<
  string,
  Promise<ProductsApiResponse>
>();
const categoryIdBySlugCache = new Map<
  string,
  {
    value: string | null;
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

function getStaleCachedFacets(storeId: string): ProductFacets | null {
  return productFacetsCache.get(storeId)?.value ?? null;
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

function normalizeNumberKey(value: number | null): string {
  return value === null ? "null" : value.toString();
}

function buildProductsCacheKey(input: {
  storeId: string;
  categorySlug: string | null;
  sort: string;
  minPrice: number | null;
  maxPrice: number | null;
  page: number;
  limit: number;
  includeFacets: boolean;
  includeTotal: boolean;
}): string {
  return [
    input.storeId,
    input.categorySlug ?? "all",
    input.sort,
    normalizeNumberKey(input.minPrice),
    normalizeNumberKey(input.maxPrice),
    input.page.toString(),
    input.limit.toString(),
    input.includeFacets ? "facets" : "nofacets",
    input.includeTotal ? "total" : "nototal",
  ].join("|");
}

function getCachedProductsResponse(
  cacheKey: string,
): ProductsApiResponse | null {
  const cached = productsResponseCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    productsResponseCache.delete(cacheKey);
    return null;
  }

  return cached.value;
}

function getStaleCachedProductsResponse(
  cacheKey: string,
): ProductsApiResponse | null {
  return productsResponseCache.get(cacheKey)?.value ?? null;
}

function setCachedProductsResponse(
  cacheKey: string,
  payload: ProductsApiResponse,
): ProductsApiResponse {
  productsResponseCache.set(cacheKey, {
    value: payload,
    expiresAt: Date.now() + PRODUCTS_CACHE_TTL_MS,
  });

  return payload;
}

async function resolveProductsResponse(
  cacheKey: string,
  builder: () => Promise<ProductsApiResponse>,
): Promise<ProductsApiResponse> {
  const cached = getCachedProductsResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const inFlight = productsResponseInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const responsePromise = (async () => {
    try {
      const payload = await builder();
      return setCachedProductsResponse(cacheKey, payload);
    } finally {
      productsResponseInFlight.delete(cacheKey);
    }
  })();

  productsResponseInFlight.set(cacheKey, responsePromise);
  return responsePromise;
}

async function resolveCategoryIdBySlug(
  categorySlug: string,
): Promise<string | null> {
  const cached = categoryIdBySlugCache.get(categorySlug);

  if (cached && cached.expiresAt >= Date.now()) {
    return cached.value;
  }

  const category = await db.category.findFirst({
    where: {
      slug: categorySlug,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const categoryId = category?.id ?? null;
  categoryIdBySlugCache.set(categorySlug, {
    value: categoryId,
    expiresAt: Date.now() + CATEGORY_LOOKUP_CACHE_TTL_MS,
  });

  return categoryId;
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

function isPoolTimeoutError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2024"
  );
}

async function resolveStoreFacets(
  storeId: string,
  shouldIncludeFacets: boolean,
): Promise<ProductFacets | null> {
  if (!shouldIncludeFacets) {
    return getCachedFacets(storeId);
  }

  const cachedFacets = getCachedFacets(storeId);
  if (cachedFacets) {
    return cachedFacets;
  }

  const inFlight = productFacetsInFlight.get(storeId);
  if (inFlight) {
    return inFlight;
  }

  const facetsPromise = (async () => {
    try {
      const builtFacets = await buildStoreFacets(storeId);
      return setCachedFacets(storeId, builtFacets);
    } catch (error) {
      if (isPoolTimeoutError(error)) {
        console.warn(
          "Pool esgotado ao montar facets; retornando cache stale/null.",
          { storeId },
        );
        return getStaleCachedFacets(storeId);
      }

      throw error;
    } finally {
      productFacetsInFlight.delete(storeId);
    }
  })();

  productFacetsInFlight.set(storeId, facetsPromise);
  return facetsPromise;
}

export async function GET(request: NextRequest) {
  let productsCacheKey: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const sort = searchParams.get("sort") ?? "newest";
    const minPrice = parseNumberParam(searchParams.get("minPrice"));
    const maxPrice = parseNumberParam(searchParams.get("maxPrice"));
    const includeFacets = searchParams.get("includeFacets") !== "0";
    const includeTotal = searchParams.get("includeTotal") === "1";
    const facetsOnly = searchParams.get("facetsOnly") === "1";

    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const limit = Math.min(
      60,
      Math.max(1, Number.parseInt(searchParams.get("limit") ?? "24", 10) || 24),
    );
    const skip = (page - 1) * limit;

    const store = await resolveActiveStore();

    if (!store) {
      return NextResponse.json(
        { error: "Nenhuma loja ativa encontrada" },
        { status: 404 },
      );
    }

    if (facetsOnly) {
      const facets = await resolveStoreFacets(store.id, true);
      return NextResponse.json(
        {
          success: true,
          store,
          facets,
        },
        {
          headers: {
            "Cache-Control": FACETS_CACHE_CONTROL,
          },
        },
      );
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      storeId: store.id,
    };

    if (categorySlug) {
      const categoryId = await resolveCategoryIdBySlug(categorySlug);

      if (!categoryId) {
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 },
        );
      }

      where.categoryId = categoryId;
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

    productsCacheKey = buildProductsCacheKey({
      storeId: store.id,
      categorySlug,
      sort,
      minPrice,
      maxPrice,
      page,
      limit,
      includeFacets,
      includeTotal,
    });

    const productSelect = {
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
    } satisfies Prisma.ProductSelect;

    const responsePayload = await resolveProductsResponse(
      productsCacheKey,
      async () => {
        let products: Prisma.ProductGetPayload<{
          select: typeof productSelect;
        }>[] = [];
        let total: number | null = null;
        let totalPages: number | null = null;
        let hasMore = false;

        if (includeTotal) {
          const [productsResult, totalResult] = await db.$transaction([
            db.product.findMany({
              where,
              select: productSelect,
              orderBy: orderByMap[sort] ?? orderByMap.newest,
              skip,
              take: limit,
            }),
            db.product.count({
              where,
            }),
          ]);

          products = productsResult;
          total = totalResult;
          totalPages = Math.max(1, Math.ceil(totalResult / limit));
          hasMore = page < totalPages;
        } else {
          const productsWithProbe = await db.product.findMany({
            where,
            select: productSelect,
            orderBy: orderByMap[sort] ?? orderByMap.newest,
            skip,
            take: limit + 1,
          });

          hasMore = productsWithProbe.length > limit;
          products = hasMore
            ? productsWithProbe.slice(0, limit)
            : productsWithProbe;
        }

        const facets = await resolveStoreFacets(store.id, includeFacets);

        return {
          success: true,
          store,
          products,
          total,
          page,
          limit,
          totalPages,
          hasMore,
          filters: {
            category: categorySlug,
            minPrice,
            maxPrice,
            sort,
          },
          facets,
        };
      },
    );

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": PRODUCTS_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);

    if (isPoolTimeoutError(error)) {
      if (productsCacheKey) {
        const staleResponse = getStaleCachedProductsResponse(productsCacheKey);

        if (staleResponse) {
          return NextResponse.json(staleResponse, {
            headers: {
              "Cache-Control": PRODUCTS_CACHE_CONTROL,
              Warning: '110 - "Response is stale"',
            },
          });
        }
      }

      return NextResponse.json(
        { error: "Serviço temporariamente sobrecarregado. Tente novamente." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
