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
    <article className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]">
      {/* Badge de promoção */}
      {product.originalPrice && product.originalPrice > product.price && (
        <div className="absolute top-2 left-2 z-10 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
          {Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) *
              100,
          )}
          % OFF
        </div>
      )}

      {/* Imagem do produto */}
      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg sm:aspect-[4/3] md:aspect-square">
        <Image
          src={product.images[0] || "/placeholder-product.jpg"}
          alt={`Imagem do produto ${product.name}`}
          fill
          className="object-contain transition-transform duration-300 group-hover:scale-102"
          sizes="(max-width: 640px) 80vw, (max-width: 768px) 60vw, (max-width: 1200px) 40vw, 25vw"
        />
      </div>

      {/* Informações do produto */}
      <div className="space-y-2">
        <header>
          <h3 className="line-clamp-2 text-sm font-semibold text-white md:text-base">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400 opacity-75">SKU: {product.sku}</p>
        </header>

        {/* Preços */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`${styles.price} text-lg font-bold text-[var(--text-price)] md:text-xl`}
            >
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Rating e vendas (se disponível) */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>⭐ {product.rating.toFixed(1)}</span>
              {product.soldCount > 0 && (
                <span>• {product.soldCount} vendidos</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <footer className="mt-4 space-y-3">
        {/* Botões de ação principais */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {/* Botão Wishlist */}
            <Button
              onClick={() => handleAddToWishlist(product)}
              disabled={loadingWishlist === product.id}
              className="flex h-10 w-10 items-center justify-center rounded-full p-0 transition-colors hover:bg-red-50"
              variant="outline"
              aria-label={
                wishlistItems.has(product.id)
                  ? "Remover dos favoritos"
                  : "Adicionar aos favoritos"
              }
            >
              {loadingWishlist === product.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              ) : (
                <Heart
                  className={`h-5 w-5 transition-colors duration-200 ${
                    wishlistItems.has(product.id)
                      ? "fill-red-500 text-red-500"
                      : "text-gray-400 hover:text-red-400"
                  }`}
                />
              )}
            </Button>

            {/* Botão Carrinho */}
            <Button
              onClick={() => handleAddToCart(product)}
              disabled={loadingCart === product.id}
              className="flex h-10 w-10 items-center justify-center rounded-full p-0"
              variant="outline"
              aria-label="Adicionar ao carrinho"
            >
              {loadingCart === product.id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              ) : (
                <ShoppingCart className="h-5 w-5 text-gray-400 hover:text-blue-400" />
              )}
            </Button>
          </div>

          {/* Botão Ver Produto */}
          <Button
            asChild
            className="flex-1 bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)] md:min-w-[100px] md:flex-none"
          >
            <Link href={`/${slug}/product/${product.id}`}>
              <span className="hidden md:inline">Ver Produto</span>
              <span className="md:hidden">Ver</span>
            </Link>
          </Button>
        </div>

        {/* Informações extras (responsivo) */}
        <div className="hidden text-xs text-gray-500 sm:block">
          {product.isOnSale && (
            <span className="rounded bg-green-100 px-2 py-1 text-green-700">
              Em promoção
            </span>
          )}
          {product.isFeatured && (
            <span className="ml-2 rounded bg-blue-100 px-2 py-1 text-blue-700">
              Destaque
            </span>
          )}
        </div>
      </footer>
    </article>
  );
};

export default CardProducts;
