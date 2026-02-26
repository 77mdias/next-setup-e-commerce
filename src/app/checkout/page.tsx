"use client";

import type { FormEvent } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, User } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import ButtonBack from "@/components/ui/ButtonBack";
import { useCart } from "@/context/cart";
import { formatCurrency } from "@/helpers/format-currency";
import { useAuth } from "@/hooks/useAuth";
import { useCheckout } from "@/hooks/useCheckout";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";

export default function CheckoutPage() {
  const router = useRouter();
  const { products, total, totalQuantity, isLoading: cartLoading } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { createCheckoutSession, isLoading, error } = useCheckout();

  useEffect(() => {
    if (authLoading || cartLoading) {
      return;
    }

    if (!isAuthenticated) {
      const callbackPath = "/checkout";
      router.replace(
        buildAccessFeedbackPath({
          reason: "auth-required",
          callbackUrl: callbackPath,
          fromPath: callbackPath,
        }),
      );
      return;
    }

    if (products.length === 0) {
      router.replace("/carrinho");
    }
  }, [authLoading, cartLoading, isAuthenticated, products.length, router]);

  if (authLoading || cartLoading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  if (!isAuthenticated || products.length === 0) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await createCheckoutSession();
  };

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <ButtonBack />
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[var(--text-price)]" />
            <h1 className="text-2xl font-bold text-white">Finalizar Compra</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                <User className="h-5 w-5" />
                Dados da Conta
              </h2>

              <div className="space-y-4">
                <div className="rounded-lg bg-gray-800/50 p-4">
                  <p className="text-sm text-gray-400">Nome</p>
                  <p className="font-medium text-white">
                    {user?.name?.trim() || "Não informado"}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-800/50 p-4">
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="font-medium text-white">
                    {user?.email?.trim() || "Não informado"}
                  </p>
                </div>

                <p className="text-sm text-gray-400">
                  Nome, telefone e CPF poderão ser confirmados durante o
                  pagamento seguro no Stripe.
                </p>

                <form onSubmit={handleSubmit} className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Processando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Finalizar Compra
                      </div>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <CreditCard className="h-5 w-5" />
                Pagamento Seguro
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>✓ Pagamento processado pelo Stripe</p>
                <p>✓ Dados criptografados e seguros</p>
                <p>✓ Aceitamos todos os principais cartões</p>
                <p>✓ Compra 100% protegida</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Resumo do Pedido
              </h2>

              <div className="mb-6 space-y-4">
                {products.map((product) => {
                  const imageSrc = normalizeProductImageSrc(product.images[0]);

                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 rounded-lg bg-gray-800/50 p-3"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-700">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          fill
                          sizes="64px"
                          unoptimized={shouldUseUnoptimizedImage(imageSrc)}
                          className="object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium text-white">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Qtd: {product.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-[var(--text-price)]">
                          {formatCurrency(product.price * product.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-gray-600 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Subtotal ({totalQuantity} itens)
                  </span>
                  <span className="text-white">{formatCurrency(total)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Frete</span>
                  <span className="text-green-400">Grátis</span>
                </div>

                <div className="flex justify-between border-t border-gray-600 pt-3 text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-[var(--text-price)]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Informações Importantes
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  • Seu pedido será processado após a confirmação do pagamento
                </p>
                <p>• Você receberá um email com os detalhes do pedido</p>
                <p>• O prazo de entrega será informado após a confirmação</p>
                <p>• Em caso de dúvidas, entre em contato conosco</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
