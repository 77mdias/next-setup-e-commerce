import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import HighlightedProducst from "./components/HighlightedProducst";
import OffersForYou from "./components/OffersForYou";

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
        take: 15, // Limitar a 15 produtos para o carousel
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
    <div className="min-h-screen w-screen">
      {/* Produtos em Destaque */}
      <HighlightedProducst slug={slug} store={store} />

      {/* Ofertas para você */}
      <OffersForYou slug={slug} store={store.products} />

      {/* Informações da Loja */}
      <section className="bg-muted/50 py-8 text-white">
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
