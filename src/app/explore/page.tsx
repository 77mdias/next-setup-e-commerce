import { notFound } from "next/navigation";

import {
  ExplorePageContent,
  type ExploreProductCardData,
  type ExploreSectionData,
} from "@/components/explore/explore-page-content";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ExploreDbProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  images: string[];
  isOnSale: boolean;
  isFeatured: boolean;
  rating: number;
  soldCount: number;
  viewCount: number;
  createdAt: Date;
  category: {
    name: string;
  } | null;
};

type BaseSection = Omit<ExploreSectionData, "products" | "ctaHref"> & {
  productCount: number;
};

const sectionBlueprints: BaseSection[] = [
  {
    id: "cyber-warfare",
    intro:
      "Precision instruments for the digital battlefield. Dominate with zero latency.",
    heading: "CYBER WARFARE",
    subheading: "ELITE COMPETITIVE GEAR",
    accent: "pink",
    backgroundSrc: "/images/explore/explore-cyber-warfare-bg.png",
    mediaOnLeft: true,
    productCount: 3,
  },
  {
    id: "stealth-ops",
    intro:
      "Silence is golden. Performance is mandatory. The clean aesthetic for the modern shadow.",
    heading: "STEALTH OPS",
    subheading: "MINIMALIST SETUPS",
    accent: "blue",
    backgroundSrc: "/images/explore/explore-stealth-ops-bg.png",
    mediaOnLeft: false,
    productCount: 2,
  },
  {
    id: "neon-city",
    intro:
      "Drench your senses in light and sound. The ultimate atmosphere for deep dive gaming.",
    heading: "NEON CITY",
    subheading: "IMMERSIVE ENVIRONMENTS",
    accent: "pink",
    backgroundSrc: "/images/explore/explore-neon-city-bg.png",
    mediaOnLeft: true,
    productCount: 1,
  },
  {
    id: "future-tech",
    intro:
      "Experimental technology for the forward thinker. Stay ahead of the curve.",
    heading: "FUTURE TECH",
    subheading: "NEXT GEN HARDWARE",
    accent: "blue",
    backgroundSrc: "/images/explore/explore-future-tech-bg.png",
    mediaOnLeft: false,
    productCount: 3,
  },
];

function byCreatedAtDesc(a: ExploreDbProduct, b: ExploreDbProduct) {
  return b.createdAt.getTime() - a.createdAt.getTime();
}

function byRatingDesc(a: ExploreDbProduct, b: ExploreDbProduct) {
  return (
    b.rating - a.rating || b.soldCount - a.soldCount || byCreatedAtDesc(a, b)
  );
}

function byFeaturedDesc(a: ExploreDbProduct, b: ExploreDbProduct) {
  return (
    Number(b.isFeatured) - Number(a.isFeatured) ||
    b.soldCount - a.soldCount ||
    byRatingDesc(a, b)
  );
}

function byViewCountDesc(a: ExploreDbProduct, b: ExploreDbProduct) {
  return b.viewCount - a.viewCount || b.price - a.price || byRatingDesc(a, b);
}

function discountValue(product: ExploreDbProduct) {
  if (!product.originalPrice || product.originalPrice <= product.price) {
    return 0;
  }

  return product.originalPrice - product.price;
}

function byDiscountDesc(a: ExploreDbProduct, b: ExploreDbProduct) {
  return discountValue(b) - discountValue(a) || byRatingDesc(a, b);
}

function normalizeCategoryName(product: ExploreDbProduct) {
  return (product.category?.name ?? "Gear").toLowerCase();
}

function includesKeyword(product: ExploreDbProduct, keywords: string[]) {
  const categoryName = normalizeCategoryName(product);
  return keywords.some((keyword) => categoryName.includes(keyword));
}

function pickProducts(
  count: number,
  usedIds: Set<string>,
  ...pools: ExploreDbProduct[][]
): ExploreDbProduct[] {
  const selected: ExploreDbProduct[] = [];

  for (const pool of pools) {
    for (const product of pool) {
      if (selected.length >= count) {
        return selected;
      }

      if (usedIds.has(product.id)) {
        continue;
      }

      usedIds.add(product.id);
      selected.push(product);
    }
  }

  return selected;
}

function mapToCardProduct(product: ExploreDbProduct): ExploreProductCardData {
  return {
    id: product.id,
    name: product.name,
    categoryName: product.category?.name ?? "Gear",
    price: product.price,
    originalPrice: product.originalPrice,
    imageUrl: product.images[0] ?? null,
    href: `/product/${product.id}`,
  };
}

function buildExploreSections(
  products: ExploreDbProduct[],
): ExploreSectionData[] {
  const byRecent = [...products].sort(byCreatedAtDesc);
  const byFeatured = [...products].sort(byFeaturedDesc);
  const byRating = [...products].sort(byRatingDesc);
  const byViews = [...products].sort(byViewCountDesc);
  const byDiscount = [...products].sort(byDiscountDesc);

  const stealthKeywordPool = products
    .filter((product) =>
      includesKeyword(product, ["audio", "headset", "monitor", "teclad"]),
    )
    .sort(byRatingDesc);

  const neonKeywordPool = products
    .filter((product) =>
      includesKeyword(product, [
        "monitor",
        "headset",
        "audio",
        "mobile",
        "smart",
      ]),
    )
    .sort(byViewCountDesc);

  const futureKeywordPool = products
    .filter((product) =>
      includesKeyword(product, [
        "process",
        "placa",
        "smart",
        "mobile",
        "notebook",
      ]),
    )
    .sort(byCreatedAtDesc);

  const usedIds = new Set<string>();

  return sectionBlueprints.map((section) => {
    let selected: ExploreDbProduct[] = [];

    if (section.id === "cyber-warfare") {
      selected = pickProducts(
        section.productCount,
        usedIds,
        byFeatured,
        byRating,
        byRecent,
      );
    }

    if (section.id === "stealth-ops") {
      selected = pickProducts(
        section.productCount,
        usedIds,
        stealthKeywordPool,
        byRating,
        byRecent,
      );
    }

    if (section.id === "neon-city") {
      selected = pickProducts(
        section.productCount,
        usedIds,
        neonKeywordPool,
        byViews,
        byDiscount,
        byRecent,
      );
    }

    if (section.id === "future-tech") {
      selected = pickProducts(
        section.productCount,
        usedIds,
        futureKeywordPool,
        byDiscount,
        byRecent,
      );
    }

    return {
      ...section,
      ctaHref: "/products",
      products: selected.map((product) => mapToCardProduct(product)),
    };
  });
}

export default async function ExplorePage() {
  let products: ExploreDbProduct[] = [];

  try {
    const store = await db.store.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        products: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            images: true,
            isOnSale: true,
            isFeatured: true,
            rating: true,
            soldCount: true,
            viewCount: true,
            createdAt: true,
            category: {
              select: {
                name: true,
              },
            },
          },
          take: 60,
        },
      },
    });

    if (!store) {
      notFound();
    }

    products = store.products;
  } catch (error) {
    console.error("Erro ao carregar colecoes da Explore:", error);
  }

  const sections = buildExploreSections(products);

  return (
    <ExplorePageContent
      sections={sections}
      hasProducts={products.length > 0}
      productListHref="/products"
      categoriesHref="/products"
    />
  );
}
