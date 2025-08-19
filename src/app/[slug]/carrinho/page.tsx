"use client";

import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart } from "lucide-react";

export default function CarrinhoPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">
            Acesso não autorizado
          </h1>
          <p className="text-gray-400">
            Você precisa estar logado para acessar seu carrinho.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--button-primary)]">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">Carrinho</h1>
          <p className="text-gray-400">Seus produtos selecionados</p>
        </div>

        <div className="rounded-lg bg-[var(--card-product)] p-8 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-500" />
          <h2 className="mb-2 text-xl font-semibold text-white">
            Seu carrinho está vazio
          </h2>
          <p className="text-gray-400">
            Adicione produtos ao carrinho para continuar com a compra.
          </p>
        </div>
      </div>
    </div>
  );
}
