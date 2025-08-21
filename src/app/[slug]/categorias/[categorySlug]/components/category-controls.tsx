"use client";

import { Button } from "@/components/ui/button";
import { Grid3X3, List, Filter } from "lucide-react";

interface CategoryControlsProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortBy: "name" | "products" | "sortOrder";
  onSortChange: (sort: "name" | "products" | "sortOrder") => void;
  showProducts: boolean;
  onToggleView: (showProducts: boolean) => void;
  hasSubcategories: boolean;
  hasProducts: boolean;
  filteredCount: number;
}

export function CategoryControls({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  showProducts,
  onToggleView,
  hasSubcategories,
  hasProducts,
  filteredCount,
}: CategoryControlsProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* View Mode Controls */}
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("grid")}
          className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
        >
          <Grid3X3 className="mr-2 h-4 w-4" />
          Grid
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("list")}
          className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
        >
          <List className="mr-2 h-4 w-4" />
          Lista
        </Button>

        {/* Filtro de Ordenação */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="rounded-md border border-gray-700 bg-[var(--card-product)] px-3 py-1 text-sm text-white focus:ring-2 focus:ring-[var(--button-primary)] focus:outline-none"
          >
            <option value="sortOrder">
              {showProducts ? "Melhor Avaliados" : "Ordenar por"}
            </option>
            <option value="name">Nome A-Z</option>
            <option value="products">
              {showProducts ? "Mais Vendidos" : "Mais Produtos"}
            </option>
            <option value="sortOrder">
              {showProducts ? "Padrão" : "Padrão"}
            </option>
          </select>
        </div>

        {/* Toggle entre Subcategorias e Produtos */}
        {hasSubcategories && hasProducts && (
          <div className="flex items-center space-x-2">
            <Button
              variant={!showProducts ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleView(false)}
              className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
            >
              Subcategorias
            </Button>
            <Button
              variant={showProducts ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleView(true)}
              className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
            >
              Produtos
            </Button>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-white/60">
        {showProducts
          ? `${filteredCount} produto${filteredCount !== 1 ? "s" : ""} encontrado${
              filteredCount !== 1 ? "s" : ""
            }`
          : `${filteredCount} subcategoria${
              filteredCount !== 1 ? "s" : ""
            } encontrada${filteredCount !== 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
