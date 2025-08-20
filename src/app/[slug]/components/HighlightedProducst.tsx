"use client";
import Link from "next/link";
import { Store, Product } from "@prisma/client";
import CardProducts from "@/components/ui/card-products";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useRouter } from "next/navigation";

const HighlightedProducst = ({
  slug,
  store,
}: {
  slug: string;
  store: Store & { products: Product[] };
}) => {
  const { wishlistItems, loadingWishlist, handleAddToWishlist } =
    useWishlist(slug);
  const { loadingCart, handleAddToCart } = useAddToCart(slug);
  const router = useRouter();

  const buttonCardProduct = (product: Product) => {
    router.push(`/${slug}/product/${product.id}`);
  };

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
              <CardProducts
                product={product}
                wishlistItems={wishlistItems}
                loadingWishlist={loadingWishlist}
                handleAddToWishlist={handleAddToWishlist}
                handleAddToCart={handleAddToCart}
                loadingCart={loadingCart}
                slug={slug}
                buttonCardProduct={() => buttonCardProduct(product)}
                buttonCardProductName="Ver"
                displayButtonCart="flex"
              />
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
