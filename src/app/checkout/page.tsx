"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  CreditCard,
  MapPin,
  Package,
  Shield,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";

import { useCart } from "@/context/cart";
import { formatCurrency } from "@/helpers/format-currency";
import { useAuth } from "@/hooks/useAuth";
import { useCheckout } from "@/hooks/useCheckout";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";

const PAYMENT_METHODS = [
  { id: "visa", label: "visa", lastDigits: "4242" },
  { id: "mastercard", label: "mastercard", lastDigits: "8888" },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export default function CheckoutPage() {
  const router = useRouter();
  const { products, total, totalQuantity, isLoading: cartLoading } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    createCheckoutSession,
    isLoading,
    error,
    addresses,
    selectedAddressId,
    selectAddress,
    isLoadingAddresses,
    addressError,
    refreshAddresses,
  } = useCheckout();
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    useState<PaymentMethodId>(PAYMENT_METHODS[0].id);

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
    await createCheckoutSession({
      addressId: selectedAddressId ?? undefined,
    });
  };

  const isSubmitDisabled =
    isLoading ||
    isLoadingAddresses ||
    (addresses.length > 0 && !selectedAddressId);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#11100d]">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-[1248px] flex-col gap-8 px-4 pt-8 pb-16 sm:px-6 lg:px-8 xl:px-0"
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#9CA3AF] transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <ShoppingBag className="h-7 w-7 text-[#916130]" />
            <h1 className="[font-family:var(--font-space-grotesk)] text-3xl leading-10 font-bold text-[#f2eee8]">
              Finalizar Compra
            </h1>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-300" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_394px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-[#1b1712] p-6 sm:p-7">
              <h2 className="mb-6 flex items-center gap-3 [font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#f2eee8]">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-[#59627a] to-[#916130]">
                  <MapPin className="h-5 w-5 text-white" />
                </span>
                Endereço de Entrega
              </h2>

              {isLoadingAddresses ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#17140f] p-4 text-sm text-[#9CA3AF]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#9CA3AF] border-t-transparent"></div>
                  Carregando seus endereços...
                </div>
              ) : null}

              {!isLoadingAddresses && addressError ? (
                <div className="space-y-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
                  <p className="text-sm text-red-200">{addressError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void refreshAddresses();
                    }}
                    className="rounded-xl border border-red-500/30 px-3 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-500/10"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : null}

              {!isLoadingAddresses &&
              !addressError &&
              addresses.length === 0 ? (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#17140f] p-4">
                  <p className="text-sm text-[#9CA3AF]">
                    Você ainda não possui um endereço salvo.
                  </p>
                  <Link
                    href="/perfil"
                    className="inline-flex text-sm font-medium text-[#59627a] hover:underline"
                  >
                    Ir para meu perfil e cadastrar endereço
                  </Link>
                </div>
              ) : null}

              {!isLoadingAddresses && addresses.length > 0 ? (
                <div className="space-y-3.5">
                  {addresses.map((address) => {
                    const isSelected = selectedAddressId === address.id;

                    return (
                      <label
                        key={address.id}
                        className={`block cursor-pointer rounded-2xl border-2 p-[18px] transition-colors ${
                          isSelected
                            ? "border-[#916130] bg-[rgba(255,46,99,0.05)]"
                            : "border-white/10 bg-transparent hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery-address"
                          value={address.id}
                          checked={isSelected}
                          onChange={() => selectAddress(address.id)}
                          className="sr-only"
                        />

                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="[font-family:var(--font-space-grotesk)] text-base font-bold text-[#f2eee8]">
                                {address.label}
                              </p>
                              {address.isDefault ? (
                                <span className="rounded px-2 py-0.5 text-xs font-bold text-[#916130] [background:rgba(255,46,99,0.1)]">
                                  Padrão
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm leading-[1.625] text-[#9CA3AF]">
                              {address.street}, {address.number}
                              {address.complement
                                ? `, ${address.complement}`
                                : ""}
                            </p>
                            <p className="text-sm leading-[1.625] text-[#9CA3AF]">
                              {address.neighborhood} - {address.city}/
                              {address.state}
                            </p>
                            <p className="text-sm leading-[1.625] text-[#9CA3AF]">
                              CEP: {address.zipCode}
                            </p>
                          </div>

                          <span
                            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                              isSelected
                                ? "bg-[#916130]"
                                : "border border-white/20"
                            }`}
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : null}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : null}

              {!isLoadingAddresses &&
              addresses.length > 0 &&
              !selectedAddressId ? (
                <p className="mt-3 text-sm text-red-200">
                  Selecione um endereço para finalizar a compra.
                </p>
              ) : null}

              <Link
                href="/perfil"
                className="mt-4 inline-flex text-sm font-medium text-[#59627a] hover:underline"
              >
                + Adicionar novo endereço
              </Link>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#1b1712] p-6 sm:p-7">
              <h2 className="mb-6 flex items-center gap-3 [font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#f2eee8]">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-[#59627a] to-[#916130]">
                  <CreditCard className="h-5 w-5 text-white" />
                </span>
                Método de Pagamento
              </h2>

              <div className="space-y-3.5">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedPaymentMethodId === method.id;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethodId(method.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 p-[18px] text-left transition-colors ${
                        isSelected
                          ? "border-[#916130] bg-[rgba(255,46,99,0.05)]"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-b from-[#59627a] to-[#916130]">
                          <CreditCard className="h-6 w-6 text-white" />
                        </span>
                        <div className="space-y-0.5">
                          <p className="[font-family:var(--font-space-grotesk)] text-base font-bold text-[#f2eee8] uppercase">
                            {method.label}
                          </p>
                          <p className="text-sm text-[#9CA3AF]">
                            •••• •••• •••• {method.lastDigits}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          isSelected ? "bg-[#916130]" : "border border-white/20"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Link
                href="/perfil"
                className="mt-4 inline-flex text-sm font-medium text-[#59627a] hover:underline"
              >
                + Adicionar novo cartão
              </Link>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#1b1712] p-6 sm:p-7">
              <h2 className="mb-6 flex items-center gap-3 [font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#f2eee8]">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-[#59627a] to-[#916130]">
                  <User className="h-5 w-5 text-white" />
                </span>
                Dados da Conta
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-[#b8ad9f]">Nome</p>
                  <div className="rounded-2xl border border-white/10 bg-[#17140f] px-4 py-3 text-base text-[#f2eee8]">
                    {user?.name?.trim() || "Não informado"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-[#b8ad9f]">Email</p>
                  <div className="rounded-2xl border border-white/10 bg-[#17140f] px-4 py-3 text-base text-[#f2eee8]">
                    {user?.email?.trim() || "Não informado"}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-[#FE9A00]/20 bg-[rgba(254,154,0,0.05)] px-3 py-3 text-xs text-[#b8ad9f]">
                  <AlertCircle className="mt-px h-4 w-4 flex-shrink-0 text-[#FE9A00]" />
                  <p>
                    Nome, telefone e CPF poderão ser confirmados durante a
                    entrega no Stripe.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <section className="space-y-4 rounded-2xl border border-white/10 bg-[#1b1712] p-6 sm:p-7">
              <h2 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#f2eee8]">
                Resumo do Pedido
              </h2>

              <div className="space-y-4 border-b border-white/10 pb-4">
                {products.map((product) => {
                  const imageSrc = normalizeProductImageSrc(product.images[0]);

                  return (
                    <div key={product.id} className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-[#17140f]">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          fill
                          sizes="80px"
                          unoptimized={shouldUseUnoptimizedImage(imageSrc)}
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="truncate [font-family:var(--font-space-grotesk)] text-sm font-medium text-[#f2eee8]">
                          {product.name}
                        </h3>
                        <p className="text-sm text-[#9CA3AF]">
                          Qtd: {product.quantity}
                        </p>
                        <p className="text-sm font-bold text-[#916130]">
                          {formatCurrency(product.price * product.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-b border-white/10 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">
                    Subtotal ({totalQuantity} itens)
                  </span>
                  <span className="font-medium text-[#f2eee8]">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[#9CA3AF]">Frete</span>
                  <span className="font-bold text-[#00C950]">Grátis</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#f2eee8]">Total</span>
                <span className="text-3xl font-bold text-[#916130]">
                  {formatCurrency(total)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#916130] text-lg font-medium text-white transition-colors hover:bg-[#ff4b7b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    Finalizar Compra
                  </>
                )}
              </button>

              <div className="space-y-3 rounded-2xl border border-white/5 bg-[#17140f] p-4">
                <h3 className="[font-family:var(--font-space-grotesk)] text-sm font-bold text-[#f2eee8]">
                  Informações Importantes
                </h3>

                <div className="space-y-2 text-xs text-[#9CA3AF]">
                  <div className="flex items-start gap-2">
                    <Package className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#59627a]" />
                    <p>
                      Seu pedido será processado após a confirmação de pagamento
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#59627a]" />
                    <p>Você receberá um email com os detalhes do pedido</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#59627a]" />
                    <p>O prazo de entrega será informado após a confirmação</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-px h-3.5 w-3.5 flex-shrink-0 text-[#59627a]" />
                    <p>Em caso de dúvidas, entre em contato conosco</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </div>
  );
}
