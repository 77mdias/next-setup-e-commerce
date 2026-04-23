"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminCatalogCategorySummary } from "@/lib/admin/catalog-contract";
import type { CategoryFormState } from "./types";
import { mapCategoryToForm } from "./utils";

interface CategoryListProps {
  categories: AdminCatalogCategorySummary[];
  selectedCategoryId: string | null;
  isLoading: boolean;
  canManage: boolean;
  onSelectCategory: (category: AdminCatalogCategorySummary) => void;
  onNewCategory: () => void;
}

export function CategoryList({
  categories,
  selectedCategoryId,
  isLoading,
  canManage,
  onSelectCategory,
  onNewCategory,
}: CategoryListProps) {
  if (isLoading && categories.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`category-skeleton-${index}`}
            className="h-16 animate-pulse rounded-2xl border border-white/6 bg-[#17140f]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <button
          key={category.id}
          className={cn(
            "w-full rounded-2xl border px-4 py-3 text-left transition",
            selectedCategoryId === category.id
              ? "border-[#59627a]/25 bg-[#59627a]/10"
              : "border-white/6 bg-[#17140f] hover:bg-white/8",
          )}
          type="button"
          onClick={() => onSelectCategory(category)}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="[font-family:var(--font-arimo)] font-medium text-[#f2eee8]">
                {category.name}
              </p>
              <p className="[font-family:var(--font-arimo)] text-xs text-[#9f9383]">
                {category.slug}
              </p>
            </div>
            <div className="text-right [font-family:var(--font-arimo)] text-xs text-[#b8ad9f]">
              <p>{category.productCount} produto(s)</p>
              <p>{category.childrenCount} filho(s)</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
