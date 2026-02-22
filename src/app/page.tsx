import { HomePageContent } from "@/components/home/home-page-content";
import type { HomeFeaturedProductInput } from "@/components/home/types";
import { formatCurrency } from "@/helpers/format-currency";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await db.store.findFirst({
    where: {
      isActive: true,
    },
    include: {
      products: {
        where: {
          isActive: true,
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          {
            isFeatured: "desc",
          },
          {
            isOnSale: "desc",
          },
          {
            rating: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 4,
      },
    },
  });

  if (!store) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0d10] text-white">
        Loja não encontrada
      </main>
    );
  }

  const featuredProducts: HomeFeaturedProductInput[] = store.products.map(
    (product) => ({
      id: product.id,
      category: product.category?.name ?? "Gear",
      name: product.name,
      price: formatCurrency(product.price),
      previousPrice:
        product.originalPrice && product.originalPrice > product.price
          ? formatCurrency(product.originalPrice)
          : undefined,
      rating: product.rating > 0 ? product.rating.toFixed(1) : "4.8",
      imageSrc: product.images[0] ?? "/images/home/card-razer-node.png",
      imageAlt: `Imagem do produto ${product.name}`,
      href: `/product/${product.id}`,
      isOnSale: product.isOnSale,
      isFeatured: product.isFeatured,
    }),
  );

  return (
    <HomePageContent
      storeSlug={store.slug}
      featuredProducts={featuredProducts}
    />
  );
}
