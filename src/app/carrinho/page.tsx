"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart";
import { formatCurrency } from "@/helpers/format-currency";
import { useAuth } from "@/hooks/useAuth";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";

const SHIPPING_COST = 0;
const SERVICE_FEE = 0;

const getSecondaryInfo = (description: string) => {
  const normalizedDescription = description.trim();

  if (!normalizedDescription) {
    return "Premium gaming gear";
  }

  if (normalizedDescription.length <= 56) {
    return normalizedDescription;
  }

  return `${normalizedDescription.slice(0, 56).trimEnd()}...`;
};

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    products,
    total,
    totalQuantity,
    isLoading,
    error,
    increaseProductQuantity,
    decreaseProductQuantity,
    removeProductFromCart,
    clearCart,
    loading: cartMutationLoading,
  } = useCart();

  const subtotal = total;
  const orderTotal = subtotal + SHIPPING_COST + SERVICE_FEE;

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f8f4ec] dark:bg-[#11100d]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d8cfbf] border-t-[#59627a] dark:border-[#b8ad9f]/20 dark:border-t-[#916130]"></div>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      const callbackPath = "/carrinho";
      router.push(
        buildAccessFeedbackPath({
          reason: "auth-required",
          callbackUrl: callbackPath,
          fromPath: callbackPath,
        }),
      );
      return;
    }

    router.push("/checkout");
  };

  return (
    <section className="min-h-screen w-full bg-[#f8f4ec] text-[#11100d] dark:bg-[#11100d] dark:text-[#f2eee8]">
      <div className="mx-auto w-full max-w-[1587px] px-4 pt-12 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-7 w-7 text-[#916130]" />
            <h1 className="[font-family:var(--font-space-grotesk)] text-3xl leading-none font-bold sm:text-[36px]">
              Your Cart ({totalQuantity})
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="[font-family:var(--font-arimo)] text-sm text-[#4f463c] transition-colors hover:text-[#11100d] dark:text-[#b8ad9f] dark:hover:text-[#f2eee8]"
            >
              Continue Shopping
            </Link>

            {products.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={clearCart}
                disabled={cartMutationLoading}
                className="h-10 rounded-xl border border-[#d8cfbf] bg-white px-4 text-[#4f463c] hover:bg-[#f8f4ec] hover:text-[#11100d] dark:border-white/10 dark:bg-[#17140f] dark:text-[#b8ad9f] dark:hover:bg-[#221d17] dark:hover:text-[#f2eee8]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3">
            <p className="[font-family:var(--font-arimo)] text-sm text-red-200">
              {error}
            </p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[#d8cfbf] bg-white p-12 text-center dark:border-white/[0.06] dark:bg-[#1b1712]">
            <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-[#655a4e] dark:text-[#9f9383]" />
            <h2 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#11100d] dark:text-[#f2eee8]">
              Your cart is empty
            </h2>
            <p className="mx-auto mt-3 max-w-md [font-family:var(--font-arimo)] text-sm text-[#4f463c] dark:text-[#b8ad9f]">
              Add some products to continue. Your selected items will appear
              here automatically.
            </p>
            <Link href="/products">
              <Button className="mt-8 h-12 rounded-xl bg-[#59627a] px-8 text-sm text-[#f2eee8] hover:bg-[#737d93]">
                Browse products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_384px]">
            <div className="space-y-6">
              {products.map((product) => {
                const imageSrc = normalizeProductImageSrc(product.images[0]);

                return (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-[#d8cfbf] bg-white p-5 sm:p-6 dark:border-white/[0.06] dark:bg-[#1b1712]"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-[#f1f5ff] dark:bg-[#17140f]">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          fill
                          sizes="128px"
                          unoptimized={shouldUseUnoptimizedImage(imageSrc)}
                          className="object-cover"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/product/${product.id}`}
                            className="[font-family:var(--font-space-grotesk)] text-xl font-bold text-[#11100d] transition-colors hover:text-[#916130] dark:text-[#f2eee8]"
                          >
                            {product.name}
                          </Link>

                          <p className="mt-1 [font-family:var(--font-arimo)] text-sm text-[#655a4e] dark:text-[#9f9383]">
                            {getSecondaryInfo(product.description)}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <span className="[font-family:var(--font-arimo)] text-lg font-bold text-[#916130]">
                              {formatCurrency(product.price)}
                            </span>
                            {product.originalPrice &&
                              product.originalPrice > product.price && (
                                <span className="[font-family:var(--font-arimo)] text-sm text-[#94a3b8] line-through dark:text-[#9f9383]">
                                  {formatCurrency(product.originalPrice)}
                                </span>
                              )}
                          </div>

                          <p className="mt-2 [font-family:var(--font-arimo)] text-sm text-[#4f463c] dark:text-[#b8ad9f]">
                            Subtotal:{" "}
                            <span className="font-semibold text-[#11100d] dark:text-[#f2eee8]">
                              {formatCurrency(product.price * product.quantity)}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex h-11 items-center rounded-xl border border-[#d8cfbf] bg-[#f8f4ec] px-1 dark:border-white/[0.06] dark:bg-[#17140f]">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                decreaseProductQuantity(product.id)
                              }
                              disabled={cartMutationLoading}
                              className="h-8 w-8 rounded-lg text-[#655a4e] hover:bg-[#f4efe5] hover:text-[#11100d] dark:text-[#b8ad9f] dark:hover:bg-[#221d17] dark:hover:text-[#f2eee8]"
                              aria-label={`Diminuir quantidade de ${product.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <span className="w-10 text-center [font-family:var(--font-arimo)] text-base text-[#11100d] dark:text-[#f2eee8]">
                              {product.quantity}
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                increaseProductQuantity(product.id)
                              }
                              disabled={cartMutationLoading}
                              className="h-8 w-8 rounded-lg text-[#655a4e] hover:bg-[#f4efe5] hover:text-[#11100d] dark:text-[#b8ad9f] dark:hover:bg-[#221d17] dark:hover:text-[#f2eee8]"
                              aria-label={`Aumentar quantidade de ${product.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProductFromCart(product.id)}
                            disabled={cartMutationLoading}
                            className="h-11 w-11 rounded-2xl border border-[#d8cfbf] bg-[#f8f4ec] text-[#655a4e] hover:bg-[#ffeef2] hover:text-[#d72657] dark:border-white/[0.06] dark:bg-[#17140f] dark:text-[#b8ad9f] dark:hover:bg-[#24181f] dark:hover:text-[#916130]"
                            aria-label={`Remover ${product.name} do carrinho`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="h-fit rounded-2xl border border-[#d8cfbf] bg-white p-6 xl:sticky xl:top-28 dark:border-white/[0.06] dark:bg-[#1b1712]">
              <h2 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#11100d] dark:text-[#f2eee8]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 [font-family:var(--font-arimo)]">
                <div className="flex items-center justify-between text-base text-[#4f463c] dark:text-[#b8ad9f]">
                  <span>Subtotal</span>
                  <span className="text-[#11100d] dark:text-[#f2eee8]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-base text-[#4f463c] dark:text-[#b8ad9f]">
                  <span>Shipping</span>
                  <span className="text-[#11100d] dark:text-[#f2eee8]">
                    {formatCurrency(SHIPPING_COST)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-base text-[#4f463c] dark:text-[#b8ad9f]">
                  <span>Service Fee</span>
                  <span className="text-[#11100d] dark:text-[#f2eee8]">
                    {formatCurrency(SERVICE_FEE)}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-[#d8cfbf] pt-5 dark:border-white/10">
                <div className="flex items-center justify-between [font-family:var(--font-space-grotesk)] text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-[#916130]">
                    {formatCurrency(orderTotal)}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleCheckout}
                disabled={cartMutationLoading}
                className="mt-8 h-14 w-full rounded-2xl bg-[#59627a] text-base font-semibold text-[#f2eee8] hover:bg-[#737d93]"
              >
                {!isAuthenticated ? "Login to Checkout" : "Proceed to Checkout"}
              </Button>

              {!isAuthenticated && (
                <p className="mt-3 text-center [font-family:var(--font-arimo)] text-xs text-[#655a4e] dark:text-[#9f9383]">
                  Sign in to continue with payment.
                </p>
              )}

              <div className="mt-4 flex items-center justify-center gap-2 [font-family:var(--font-arimo)] text-xs text-[#4f463c] dark:text-[#b8ad9f]">
                <ShieldCheck className="h-4 w-4 text-[#00c950]" />
                Secure checkout with encrypted payment
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
