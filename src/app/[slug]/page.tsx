import { notFound } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import Image from "next/image";

const prisma = new PrismaClient();

interface StorePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  // Buscar a loja pelo slug
  const store = await prisma.store.findUnique({
    where: {
      slug: slug,
    },
    include: {
      products: {
        where: {
          isActive: true,
        },
        include: {
          brand: true,
          category: true,
        },
        take: 8, // Limitar a 8 produtos na página inicial
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!store || !store.isActive) {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header da Loja */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={"/logo.png"}
                alt={store.name}
                className="h-16 w-auto rounded-lg"
                width={100}
                height={100}
              />
              <div>
                <h1 className="text-2xl font-bold">{store.name}</h1>
                <p className="text-muted-foreground">{store.description}</p>
                <div className="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
                  <span>⭐ {store.rating}/5</span>
                  <span>📦 {store.totalSales} vendas</span>
                  <span>🚚 Frete grátis acima de R$ {store.freeShipping}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${slug}/menu`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 font-medium transition-colors"
              >
                Ver Cardápio
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Banner da Loja */}
      <section className="relative h-64 overflow-hidden">
        <Image
          src={"/banner.png"}
          alt={`Banner ${store.name}`}
          className="h-full w-full object-cover"
          width={100}
          height={100}
        />
        <div className="absolute inset-0 bg-black/20" />
      </section>

      {/* Produtos em Destaque */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
          <Link
            href={`/${slug}/menu`}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Ver todos →
          </Link>
        </div>

        {store.products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {store.products.map((product) => (
              <div
                key={product.id}
                className="bg-card overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
              >
                <Image
                  src={product.images[0] || "/placeholder-product.jpg"}
                  alt={product.name}
                  className="h-48 w-full rounded-t-lg object-cover"
                  width={100}
                  height={100}
                />
                <div className="p-4">
                  <div className="mb-2">
                    <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs">
                      {product.brand.name}
                    </span>
                    <span className="bg-muted text-muted-foreground ml-2 rounded-full px-2 py-1 text-xs">
                      {product.category.name}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold">{product.name}</h3>
                  <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                    {product.shortDesc || product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="text-muted-foreground text-sm line-through">
                            R$ {product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      <span className="text-lg font-bold">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span>⭐</span>
                      <span>{product.rating}/5</span>
                      <span className="text-muted-foreground">
                        ({product.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-12 text-center">
            <p>Nenhum produto disponível no momento.</p>
          </div>
        )}
      </section>

      {/* Informações da Loja */}
      <section className="bg-muted/50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <h3 className="mb-2 font-semibold">📞 Contato</h3>
              <p className="text-muted-foreground text-sm">{store.phone}</p>
              <p className="text-muted-foreground text-sm">{store.email}</p>
            </div>
            <div className="text-center">
              <h3 className="mb-2 font-semibold">🚚 Entrega</h3>
              <p className="text-muted-foreground text-sm">
                Processamento em {store.processingTime} dias úteis
              </p>
              <p className="text-muted-foreground text-sm">
                Frete: R$ {store.shippingFee} (grátis acima de R${" "}
                {store.freeShipping})
              </p>
            </div>
            <div className="text-center">
              <h3 className="mb-2 font-semibold">🌐 Website</h3>
              {store.website && (
                <a
                  href={store.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  {store.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
    },
    select: {
      slug: true,
    },
  });

  return stores.map((store) => ({
    slug: store.slug,
  }));
}
