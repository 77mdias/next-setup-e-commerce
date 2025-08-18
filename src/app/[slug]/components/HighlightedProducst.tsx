import { formatCurrency } from "@/helpers/format-currency";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Store, Product } from "@prisma/client";
import styles from "../scss/page.module.scss";

const HighlightedProducst = ({
  slug,
  store,
}: {
  slug: string;
  store: Store & { products: Product[] };
}) => {
  return (
    <section className="container mx-auto px-4 py-8 text-white">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Produtos em Destaque</h2>
        <Link
          href={`/${slug}/menu`}
          className="text-primary hover:text-primary/80 font-medium"
        >
          Ver todos →
        </Link>
      </div>

      {store.products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {store.products.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-2 rounded-xl bg-[var(--card-product)] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-10">
                {/* DETALHES DO PRODUTO*/}
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-white">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 text-xs font-extralight opacity-50">
                    {product.sku}
                  </p>
                  <p
                    className={`${styles.price} text-muted-foreground text-sm font-bold tracking-tighter text-[var(--text-price)]`}
                  >
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-muted-foreground text-xs font-extralight line-through opacity-50">
                    {formatCurrency(product.originalPrice || 0)}
                  </p>
                </div>
                {/* IMAGEM DO PRODUTO*/}
                <div className="relative min-h-[82px] min-w-[120px]">
                  <Image
                    src={product.images[0] || ""}
                    alt={product.name}
                    fill
                    className="rounded-lg object-contain"
                  />
                </div>
              </div>
              {/* BOTÕES DE AÇÃO*/}
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button>
                    <Heart />
                  </Button>
                  <Button>
                    <ShoppingCart />
                  </Button>
                </div>

                <Button
                  variant="default"
                  className="min-w-[8rem] bg-[var(--button-primary)]"
                >
                  <Link href={`/${slug}/product/${product.id}`}>VIEW</Link>
                </Button>
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
  );
};

export default HighlightedProducst;
