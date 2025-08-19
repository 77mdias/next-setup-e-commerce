import { Product } from "@prisma/client";
import { formatCurrency } from "@/helpers/format-currency";
import Image from "next/image";
import styles from "@/app/[slug]/scss/page.module.scss";
import { Button } from "./button";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";

const CardProducts = ({
  product,
  wishlistItems,
  loadingWishlist,
  handleAddToWishlist,
  handleAddToCart,
  loadingCart,
  slug,
}: {
  product: Product;
  wishlistItems: Set<string>;
  loadingWishlist: string | null;
  handleAddToWishlist: (product: Product) => void;
  handleAddToCart: (product: Product) => void;
  loadingCart: string | null;
  slug: string;
}) => {
  return (
    <>
      <div className="flex items-center justify-between gap-10">
        {/* DETALHES DO PRODUTO*/}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-white">{product.name}</h3>
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
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => handleAddToWishlist(product)}
            disabled={loadingWishlist === product.id}
            className="p-2"
          >
            {loadingWishlist === product.id ? (
              "..."
            ) : (
              <Heart
                className={`transition-colors duration-200 ${
                  wishlistItems.has(product.id)
                    ? "fill-red-500 text-red-500"
                    : "text-[var(--text-primary)] hover:text-red-400"
                }`}
              />
            )}
          </Button>
          <Button
            onClick={() => handleAddToCart(product)}
            disabled={loadingCart === product.id}
            className="p-2"
          >
            {loadingCart === product.id ? "..." : <ShoppingCart />}
          </Button>
        </div>

        <Button
          variant="default"
          className="min-w-[8rem] bg-[var(--button-primary)]"
        >
          <Link href={`/${slug}/product/${product.id}`}>VIEW</Link>
        </Button>
      </div>
    </>
  );
};

export default CardProducts;
