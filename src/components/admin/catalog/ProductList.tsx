"use client";

import Image from "next/image";

import { Boxes } from "lucide-react";

import { formatCurrency } from "@/helpers/format-currency";
import {
  normalizeProductImageSrc,
} from "@/lib/product-image";
import { cn } from "@/lib/utils";

interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  price: number;
  images: string[];
  availableQuantity: number;
  store: { name: string };
  category: { name: string };
  brand: { name: string };
  inventory: { minStock: number };
}

interface ProductListProps {
  products: ProductSummary[];
  selectedProductId: string | null;
  isCreatingProduct: boolean;
  isLoading: boolean;
  onSelectProduct: (productId: string) => void;
}

export function ProductList({
  products,
  selectedProductId,
  isCreatingProduct,
  isLoading,
  onSelectProduct,
}: ProductListProps) {
  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`product-skeleton-${index}`}
            className="h-28 animate-pulse rounded-2xl border border-white/6 bg-[#17140f]"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 bg-[#17140f] px-4 py-8 text-center [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
        Nenhum produto encontrado para o escopo e filtros atuais.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const isSelected =
          !isCreatingProduct && selectedProductId === product.id;

        return (
          <button
            key={product.id}
            className={cn(
              "w-full rounded-2xl border px-4 py-4 text-left transition",
              isSelected
                ? "border-[#59627a]/25 bg-[#59627a]/10"
                : "border-white/6 bg-[#17140f] hover:border-white/20 hover:bg-white/8",
            )}
            type="button"
            onClick={() => {
              onSelectProduct(product.id);
            }}
          >
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/6 bg-slate-900/80">
                {product.images[0] ? (
                  <Image
                    alt={product.name}
                    className="h-full w-full object-cover"
                    height={80}
                    src={normalizeProductImageSrc(product.images[0])}
                    unoptimized
                    width={80}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#9f9383]">
                    <Boxes className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate [font-family:var(--font-space-grotesk)] text-base font-semibold text-[#f2eee8]">
                    {product.name}
                  </h3>
                  <span className="rounded-full border border-white/6 bg-[#17140f] px-2 py-1 [font-family:var(--font-arimo)] text-[11px] tracking-[0.2em] text-[#b8ad9f] uppercase">
                    {product.sku}
                  </span>
                </div>
                <p className="[font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
                  {product.store.name} · {product.category.name} ·{" "}
                  {product.brand.name}
                </p>
                <div className="flex flex-wrap gap-3 [font-family:var(--font-arimo)] text-xs text-[#b8ad9f]">
                  <span>{formatCurrency(product.price)}</span>
                  <span>Disponível: {product.availableQuantity}</span>
                  <span>Mínimo: {product.inventory.minStock}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
