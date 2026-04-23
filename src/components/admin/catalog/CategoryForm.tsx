"use client";

import { LoaderCircle, RefreshCw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminCatalogCategorySummary } from "@/lib/admin/catalog-contract";
import { cn } from "@/lib/utils";
import type { CategoryFormState } from "./types";
import { fieldClassName } from "./types";

interface CategoryFormProps {
  form: CategoryFormState;
  onFormChange: (form: CategoryFormState) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  selectedCategoryId: string | null;
  isSaving: boolean;
  isDeleting: boolean;
  isRefreshing: boolean;
  canManage: boolean;
  categories: AdminCatalogCategorySummary[];
}

export function CategoryForm({
  form,
  onFormChange,
  onSubmit,
  onDelete,
  onRefresh,
  selectedCategoryId,
  isSaving,
  isDeleting,
  isRefreshing,
  canManage,
  categories,
}: CategoryFormProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/6 bg-[#17140f] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Nome
          </label>
          <Input
            className={fieldClassName}
            disabled={!canManage}
            value={form.name}
            onChange={(event) =>
              onFormChange({ ...form, name: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Slug
          </label>
          <Input
            className={fieldClassName}
            disabled={!canManage}
            value={form.slug}
            onChange={(event) =>
              onFormChange({ ...form, slug: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Ordem
          </label>
          <Input
            className={fieldClassName}
            disabled={!canManage}
            value={form.sortOrder}
            onChange={(event) =>
              onFormChange({ ...form, sortOrder: event.target.value })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Categoria pai
          </label>
          <select
            className={fieldClassName}
            disabled={!canManage}
            value={form.parentId}
            onChange={(event) =>
              onFormChange({ ...form, parentId: event.target.value })
            }
          >
            <option value="">Sem categoria pai</option>
            {categories
              .filter((category) => category.id !== selectedCategoryId)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
        <input
          checked={form.isActive}
          className="h-4 w-4 rounded border-white/20 bg-[#1b1712]"
          disabled={!canManage}
          type="checkbox"
          onChange={(event) =>
            onFormChange({ ...form, isActive: event.target.checked })
          }
        />
        Categoria ativa
      </div>

      <div>
        <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
          Descrição
        </label>
        <textarea
          className={cn(fieldClassName, "min-h-28 resize-y")}
          disabled={!canManage}
          value={form.description}
          onChange={(event) =>
            onFormChange({ ...form, description: event.target.value })
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          disabled={!canManage || isSaving}
          type="button"
          onClick={onSubmit}
        >
          {isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar categoria
        </Button>
        <Button
          className="border-white/6 bg-transparent hover:bg-[#17140f]"
          disabled={!selectedCategoryId || isDeleting}
          type="button"
          variant="outline"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Remover
        </Button>
        <Button
          className="border-white/6 bg-transparent hover:bg-[#17140f]"
          type="button"
          variant="outline"
          onClick={onRefresh}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
          Atualizar
        </Button>
      </div>
    </div>
  );
}
