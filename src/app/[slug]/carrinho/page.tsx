"use client";

import { useCart } from "@/app/[slug]/context/cart";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ButtonBack from "@/components/ui/ButtonBack";

export default function CarrinhoPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
  } = useCart();

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  // Função para proceder ao checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirecionar para login se não estiver autenticado
      router.push(`/auth/signin?callbackUrl=/${slug}/carrinho`);
      return;
    }

    // Se estiver autenticado, prosseguir para checkout
    // TODO: Implementar página de checkout
    alert("Redirecionando para checkout... (ainda não implementado)");
  };

  return (
    <div className="min-h-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          {/* Botão de voltar */}
          <ButtonBack />

          {/* Título e navegação */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-[var(--text-price)]" />
              <h1 className="text-2xl font-bold text-white">
                Meu Carrinho ({totalQuantity})
              </h1>
            </div>

            <Link
              href={`/${slug}`}
              className="flex items-center gap-2 text-sm font-medium text-[var(--text-price)] transition-colors hover:text-[var(--text-price-secondary)]"
            >
              Continuar Comprando →
            </Link>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Mensagem de sucesso (produto adicionado) */}
        {products.length > 0 && (
          <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <p className="text-sm text-green-400">
                ✓ Produto adicionado ao carrinho com sucesso!
              </p>
            </div>
          </div>
        )}

        {/* Carrinho vazio */}
        {products.length === 0 ? (
          <div className="rounded-lg bg-[var(--card-product)] p-12 text-center">
            <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Seu carrinho está vazio
            </h2>
            <p className="mb-6 text-gray-400">
              Adicione produtos ao seu carrinho para vê-los aqui.
            </p>
            <Link href={`/${slug}`}>
              <Button className="bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)]">
                Começar a Comprar
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Lista de produtos */}
            <div className="space-y-4 lg:col-span-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg bg-[var(--card-product)] p-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Imagem do produto */}
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={product.images[0] || "/placeholder-product.jpg"}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Informações do produto */}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-semibold text-white">
                        {product.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold text-[var(--text-price)]">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice &&
                          product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Controles de quantidade */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-gray-700 p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => decreaseProductQuantity(product.id)}
                          className="h-8 w-8 p-0 text-white hover:bg-gray-600"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <span className="min-w-[2rem] text-center text-white">
                          {product.quantity}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => increaseProductQuantity(product.id)}
                          className="h-8 w-8 p-0 text-white hover:bg-gray-600"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Botão remover */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProductFromCart(product.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Subtotal do produto */}
                  <div className="mt-4 flex justify-end">
                    <span className="text-sm text-gray-400">
                      Subtotal:{" "}
                      <span className="font-semibold text-[var(--text-price)]">
                        {formatCurrency(product.price * product.quantity)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}

              {/* Botão limpar carrinho */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Carrinho
                </Button>
              </div>
            </div>

            {/* Resumo do pedido */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 rounded-lg bg-[var(--card-product)] p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Resumo do Pedido
                </h2>

                <div className="space-y-3 border-b border-gray-600 pb-4">
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
                </div>

                <div className="mt-4 flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-[var(--text-price)]">
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* Botão de checkout */}
                <Button
                  onClick={handleCheckout}
                  className="mt-6 w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
                  disabled={isLoading}
                >
                  {!isAuthenticated
                    ? "Fazer Login para Finalizar"
                    : "Finalizar Compra"}
                </Button>

                {/* Aviso para usuários não logados */}
                {!isAuthenticated && (
                  <p className="mt-3 text-center text-xs text-gray-400">
                    É necessário fazer login para finalizar a compra
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
