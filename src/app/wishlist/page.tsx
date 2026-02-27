"use client";

import { Product } from "@prisma/client";
import { ArrowRight, Heart, ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";

type WishlistProduct = Product & {
  category?: {
    name: string;
  } | null;
};

type WishlistItem = {
  id: string;
  productId: string;
  product: WishlistProduct | null;
  createdAt: string;
};

type WishlistResponse = {
  wishlist?: WishlistItem[];
  message?: string;
};

const fontVariablesStyle = {
  "--font-arimo": '"Arimo", "Segoe UI", Arial, sans-serif',
  "--font-space-grotesk": '"Space Grotesk", "Arial Black", sans-serif',
} as CSSProperties;

export default function WishlistPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [wishlistData, setWishlistData] = useState<WishlistItem[]>([]);
  const [isWishlistDataLoading, setIsWishlistDataLoading] = useState(true);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const { wishlistItems, loadingWishlist, handleAddToWishlist } =
    useWishlist("/wishlist");
  const { loadingCart, handleAddToCart } = useAddToCart("/carrinho");

  const loadWishlistData = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistData([]);
      setWishlistError(null);
      setIsWishlistDataLoading(false);
      return;
    }

    setWishlistError(null);
    setIsWishlistDataLoading(true);

    try {
      const response = await fetch("/api/wishlist");
      const data = (await response.json()) as WishlistResponse;

      if (!response.ok) {
        throw new Error(data.message || "Erro ao carregar wishlist");
      }

      const validItems = (data.wishlist ?? []).filter(
        (item) => item?.product && item?.productId,
      );
      setWishlistData(validItems);
    } catch (error) {
      console.error("Erro ao carregar wishlist:", error);
      setWishlistData([]);
      setWishlistError(
        "Não foi possível carregar seus favoritos. Tente novamente em instantes.",
      );
    } finally {
      setIsWishlistDataLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadWishlistData();
  }, [loadWishlistData]);

  const handleWishlistToggle = async (product: WishlistProduct) => {
    const action = await handleAddToWishlist(product);

    if (action === "removed") {
      setWishlistData((current) =>
        current.filter((item) => item.productId !== product.id),
      );
      return;
    }

    if (action === "added") {
      void loadWishlistData();
    }
  };

  if (isLoading || isWishlistDataLoading) {
    return (
      <main
        style={fontVariablesStyle}
        className="flex min-h-screen items-center justify-center bg-[#f6f8ff] dark:bg-[#0b0d10]"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#5c7cfa] border-t-transparent" />
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    const callbackPath = "/wishlist";
    const loginPath = buildAccessFeedbackPath({
      reason: "auth-required",
      callbackUrl: callbackPath,
      fromPath: callbackPath,
    });

    return (
      <main
        style={fontVariablesStyle}
        className="relative min-h-screen overflow-hidden bg-[#f6f8ff] px-4 py-14 text-[#0f172a] sm:px-6 lg:px-8 dark:bg-[#0b0d10] dark:text-[#f1f3f5]"
      >
        <div className="relative mx-auto flex w-full max-w-[760px] flex-col items-center rounded-3xl border border-[#dbe4ff] bg-[#f8fbff] px-7 py-12 text-center shadow-[0_18px_40px_rgba(99,122,186,0.15)] dark:border-white/10 dark:bg-[#171a21] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff2e63] text-white">
            <Heart className="h-6 w-6" />
          </div>

          <h1 className="[font-family:var(--font-space-grotesk)] text-3xl font-bold text-[#0f172a] dark:text-[#f1f3f5]">
            Login Required
          </h1>

          <p className="mt-3 max-w-[500px] [font-family:var(--font-arimo)] text-sm leading-relaxed text-[#64748b] dark:text-[#99a1af]">
            Faça login para acessar sua wishlist e salvar os produtos que você
            quer acompanhar.
          </p>

          <Link href={loginPath} className="mt-7">
            <Button className="h-11 rounded-xl bg-[#ff2e63] px-6 [font-family:var(--font-arimo)] text-sm font-semibold text-white hover:bg-[#ff4a77]">
              Ir para login
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={fontVariablesStyle}
      className="relative min-h-screen overflow-hidden bg-[#f6f8ff] px-4 py-10 text-[#0f172a] sm:px-6 sm:py-12 lg:px-8 dark:bg-[#0b0d10] dark:text-[#f1f3f5]"
    >
      <div className="relative mx-auto flex w-full max-w-[1587px] flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="[font-family:var(--font-space-grotesk)] text-4xl font-bold tracking-tight text-[#0f172a] dark:text-[#f1f3f5]">
              My Wishlist
            </h1>
            <p className="[font-family:var(--font-arimo)] text-sm text-[#64748b] dark:text-[#99a1af]">
              {wishlistData.length} item{wishlistData.length === 1 ? "" : "s"}{" "}
              salvos para acompanhar.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-2xl border border-[#c7d4fb] bg-[#f8fbff] px-5 [font-family:var(--font-arimo)] text-sm font-semibold text-[#0f172a] transition-colors hover:border-[#b8c8fa] hover:bg-[#edf2ff] dark:border-white/10 dark:bg-[#171a21] dark:text-[#f1f3f5] dark:hover:border-white/20 dark:hover:bg-[#202532]"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        {wishlistError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 [font-family:var(--font-arimo)] text-sm text-red-500 dark:text-red-300">
            {wishlistError}
          </div>
        )}

        {wishlistData.length === 0 ? (
          <div className="rounded-3xl border border-[#dbe4ff] bg-[#f8fbff] px-7 py-14 text-center shadow-[0_18px_40px_rgba(99,122,186,0.15)] dark:border-white/10 dark:bg-[#171a21] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff2e63] text-white">
              <Heart className="h-7 w-7" />
            </div>

            <h2 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#0f172a] dark:text-[#f1f3f5]">
              Sua wishlist está vazia
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] [font-family:var(--font-arimo)] text-sm text-[#64748b] dark:text-[#99a1af]">
              Adicione produtos aos favoritos para acompanhar preço, promoções e
              voltar aqui quando quiser.
            </p>

            <Link href="/products" className="mt-8 inline-flex">
              <Button className="h-11 rounded-xl bg-[#5c7cfa] px-6 [font-family:var(--font-arimo)] text-sm font-semibold text-white hover:bg-[#4a6ff0]">
                Explorar produtos
              </Button>
            </Link>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {wishlistData.map((item) => {
              const product = item.product;

              if (!product) {
                return null;
              }

              const imageSrc = normalizeProductImageSrc(
                Array.isArray(product.images) ? product.images[0] : undefined,
              );
              const showSaleBadge = Boolean(
                product.originalPrice && product.originalPrice > product.price,
              );
              const categoryName = product.category?.name ?? "Gear";

              return (
                <article
                  key={item.id || item.productId}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#cfdcfb] bg-[#f8fbff] shadow-[0_14px_34px_rgba(99,122,186,0.16)] transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-[#171a21] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                >
                  <button
                    type="button"
                    onClick={() => void handleWishlistToggle(product)}
                    disabled={loadingWishlist === product.id}
                    className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f172a]/8 text-[#ff2e63] transition-colors hover:bg-[#0f172a]/14 disabled:cursor-not-allowed dark:bg-white/10 dark:hover:bg-white/20"
                    aria-label="Remover da wishlist"
                  >
                    {loadingWishlist === product.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#ff2e63] border-t-transparent" />
                    ) : (
                      <Heart
                        className={`h-[18px] w-[18px] ${
                          wishlistItems.has(product.id)
                            ? "fill-[#ff2e63] text-[#ff2e63]"
                            : "text-[#ff2e63]"
                        }`}
                      />
                    )}
                  </button>

                  {showSaleBadge ? (
                    <span className="absolute top-4 left-4 z-10 rounded-[10px] bg-[#ff2e63] px-3 py-1 [font-family:var(--font-arimo)] text-xs font-bold tracking-[0.05em] text-white uppercase">
                      Sale
                    </span>
                  ) : (
                    <span className="absolute top-4 left-4 z-10 rounded-[10px] bg-[#5c7cfa] px-3 py-1 [font-family:var(--font-arimo)] text-xs font-bold tracking-[0.05em] text-white uppercase">
                      New
                    </span>
                  )}

                  <Link
                    href={`/product/${product.id}`}
                    className="relative block h-[260px] overflow-hidden bg-[#dde6ff] sm:h-[315px] dark:bg-[#12151a]"
                  >
                    <Image
                      src={imageSrc}
                      alt={product.name}
                      fill
                      unoptimized={shouldUseUnoptimizedImage(imageSrc)}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(min-width: 1536px) 30vw, (min-width: 1024px) 48vw, 95vw"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center justify-between [font-family:var(--font-arimo)] text-xs tracking-[0.05em] text-[#64748b] uppercase dark:text-[#99a1af]">
                      <span>{categoryName}</span>
                      <span className="inline-flex items-center gap-1 text-[#4b5563] dark:text-[#d1d5dc]">
                        <Star className="h-3.5 w-3.5 fill-[#f0b100] text-[#f0b100]" />
                        <strong>{product.rating.toFixed(1)}</strong>
                      </span>
                    </div>

                    <h2 className="line-clamp-2 [font-family:var(--font-space-grotesk)] text-2xl leading-tight font-bold text-[#0f172a] dark:text-[#f1f3f5]">
                      {product.name}
                    </h2>

                    <div className="mt-auto flex min-h-8 items-end gap-2">
                      {showSaleBadge && product.originalPrice ? (
                        <span className="[font-family:var(--font-arimo)] text-sm text-[#64748b] line-through dark:text-[#99a1af]">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      ) : null}
                      <span className="[font-family:var(--font-arimo)] text-2xl font-bold text-[#0f172a] dark:text-[#f1f3f5]">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => void handleAddToCart(product)}
                        disabled={loadingCart === product.id}
                        className="h-10 rounded-xl bg-[#5c7cfa] px-4 [font-family:var(--font-arimo)] text-sm font-semibold text-white hover:bg-[#4a6ff0]"
                      >
                        {loadingCart === product.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                        Add to cart
                      </Button>

                      <Link
                        href={`/product/${product.id}`}
                        className="inline-flex h-10 items-center rounded-xl px-3 [font-family:var(--font-arimo)] text-sm font-medium text-[#4a6ff0] transition-colors hover:text-[#2f58eb] dark:text-[#8fa3ff] dark:hover:text-[#aab9ff]"
                      >
                        View product
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
