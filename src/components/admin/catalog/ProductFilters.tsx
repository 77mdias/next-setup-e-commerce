"use client";

import { startTransition, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminCatalogProductsFilters } from "@/hooks/useAdminCatalog";
import { fieldClassName } from "./types";

interface ProductFiltersProps {
  filters: AdminCatalogProductsFilters;
  onFiltersChange: (filters: AdminCatalogProductsFilters) => void;
  onNewProduct: () => void;
  meta?: {
    stores: Array<{ id: string; name: string }>;
  } | null;
  totalPages: number;
  currentPage: number;
}

export function ProductFilters({
  filters,
  onFiltersChange,
  onNewProduct,
  meta,
  totalPages,
  currentPage,
}: ProductFiltersProps) {
  const [searchInput, setSearchInput] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.2em] text-[#9f9383] uppercase">
            Fila operacional
          </p>
          <h2 className="mt-2 [font-family:var(--font-space-grotesk)] text-xl font-semibold text-[#f2eee8]">
            Produtos por loja
          </h2>
        </div>
        <Button
          className="border-white/10 bg-[#17140f] hover:bg-white/15"
          type="button"
          variant="outline"
          onClick={onNewProduct}
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9f9383]" />
          <Input
            className="h-10 rounded-2xl border-white/6 bg-[#17140f] pl-9 text-[#f2eee8]"
            placeholder="Buscar por nome ou SKU"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <Button
          className="h-10 rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          type="button"
          onClick={() => {
            startTransition(() => {
              onFiltersChange({
                ...filters,
                page: 1,
                query: searchInput.trim(),
              });
            });
          }}
        >
          Buscar
        </Button>
      </div>

      {meta?.stores.length ? (
        <select
          className={fieldClassName}
          value={filters.storeId ?? ""}
          onChange={(event) => {
            startTransition(() => {
              onFiltersChange({
                ...filters,
                page: 1,
                storeId: event.target.value || null,
              });
            });
          }}
        >
          <option value="">Todas as lojas do escopo</option>
          {meta.stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      ) : null}

      <div className="flex items-center justify-between text-sm text-[#9f9383]">
        <span className="[font-family:var(--font-arimo)]">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            className="border-white/6 bg-transparent hover:bg-[#17140f]"
            disabled={currentPage <= 1}
            type="button"
            variant="outline"
            onClick={() => {
              startTransition(() => {
                onFiltersChange({
                  ...filters,
                  page: Math.max(filters.page - 1, 1),
                });
              });
            }}
          >
            Anterior
          </Button>
          <Button
            className="border-white/6 bg-transparent hover:bg-[#17140f]"
            disabled={currentPage >= totalPages}
            type="button"
            variant="outline"
            onClick={() => {
              startTransition(() => {
                onFiltersChange({
                  ...filters,
                  page: filters.page + 1,
                });
              });
            }}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
