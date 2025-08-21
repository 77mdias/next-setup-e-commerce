"use client";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  showProducts: boolean;
  onClearSearch: () => void;
}

export function EmptyState({ showProducts, onClearSearch }: EmptyStateProps) {
  return (
    <div className="animate-in fade-in py-12 text-center">
      <div className="mb-4 animate-bounce text-6xl">🔍</div>
      <h3 className="mb-2 text-xl font-semibold text-white">
        {showProducts
          ? "Nenhum produto encontrado"
          : "Nenhuma subcategoria encontrada"}
      </h3>
      <p className="mb-6 text-gray-400">
        Tente ajustar sua busca ou explore outras categorias
      </p>
      <Button
        onClick={onClearSearch}
        className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
      >
        Limpar Busca
      </Button>
    </div>
  );
}
