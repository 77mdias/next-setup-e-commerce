"use client";

import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, RefreshCw, Save, Sparkles, ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRemoveBg } from "@/hooks/useRemoveBg";
import type { AdminCatalogProductDetail } from "@/lib/admin/catalog-contract";
import { cn } from "@/lib/utils";
import type { ProductFormState } from "./types";
import { fieldClassName } from "./types";
import { ProductImagePreview } from "./ProductImagePreview";

interface ProductFormProps {
  form: ProductFormState;
  onFormChange: (form: ProductFormState) => void;
  onSubmit: () => void;
  onReset: () => void;
  onProcessImages: () => void;
  isCreating: boolean;
  isSaving: boolean;
  isDetailRefreshing: boolean;
  isRemovingBackground: boolean;
  isPersistingImages: boolean;
  selectedProduct: AdminCatalogProductDetail | null;
  meta?: {
    stores: Array<{ id: string; name: string }>;
    brands: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
    canDeleteProducts: boolean;
  } | null;
  removeBgProgress: number;
}

export function ProductForm({
  form,
  onFormChange,
  onSubmit,
  onReset,
  onProcessImages,
  isCreating,
  isSaving,
  isDetailRefreshing,
  isRemovingBackground,
  isPersistingImages,
  selectedProduct,
  meta,
  removeBgProgress,
}: ProductFormProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Nome
          </label>
          <Input
            className={fieldClassName}
            value={form.name}
            onChange={(event) =>
              onFormChange({ ...form, name: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            SKU
          </label>
          <Input
            className={fieldClassName}
            value={form.sku}
            onChange={(event) =>
              onFormChange({ ...form, sku: event.target.value })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Loja
          </label>
          <select
            className={fieldClassName}
            disabled={!isCreating}
            value={form.storeId}
            onChange={(event) =>
              onFormChange({ ...form, storeId: event.target.value })
            }
          >
            <option value="">Selecione a loja</option>
            {meta?.stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Marca
          </label>
          <select
            className={fieldClassName}
            value={form.brandId}
            onChange={(event) =>
              onFormChange({ ...form, brandId: event.target.value })
            }
          >
            <option value="">Selecione a marca</option>
            {meta?.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Categoria
          </label>
          <select
            className={fieldClassName}
            value={form.categoryId}
            onChange={(event) =>
              onFormChange({ ...form, categoryId: event.target.value })
            }
          >
            <option value="">Selecione a categoria</option>
            {meta?.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Preço
          </label>
          <Input
            className={fieldClassName}
            value={form.price}
            onChange={(event) =>
              onFormChange({ ...form, price: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Preço original
          </label>
          <Input
            className={fieldClassName}
            value={form.originalPrice}
            onChange={(event) =>
              onFormChange({ ...form, originalPrice: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Custo
          </label>
          <Input
            className={fieldClassName}
            value={form.costPrice}
            onChange={(event) =>
              onFormChange({ ...form, costPrice: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Peso
          </label>
          <Input
            className={fieldClassName}
            value={form.weight}
            onChange={(event) =>
              onFormChange({ ...form, weight: event.target.value })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Descrição curta
          </label>
          <Input
            className={fieldClassName}
            value={form.shortDesc}
            onChange={(event) =>
              onFormChange({ ...form, shortDesc: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Garantia
          </label>
          <Input
            className={fieldClassName}
            value={form.warranty}
            onChange={(event) =>
              onFormChange({ ...form, warranty: event.target.value })
            }
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
          Descrição
        </label>
        <textarea
          className={cn(fieldClassName, "min-h-32 resize-y")}
          value={form.description}
          onChange={(event) =>
            onFormChange({ ...form, description: event.target.value })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Especificações JSON
          </label>
          <textarea
            className={cn(
              fieldClassName,
              "min-h-48 resize-y font-mono",
            )}
            value={form.specificationsText}
            onChange={(event) =>
              onFormChange({ ...form, specificationsText: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Dimensões JSON
          </label>
          <textarea
            className={cn(
              fieldClassName,
              "min-h-48 resize-y font-mono",
            )}
            value={form.dimensionsText}
            onChange={(event) =>
              onFormChange({ ...form, dimensionsText: event.target.value })
            }
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
          <input
            checked={form.isActive}
            className="h-4 w-4 rounded border-white/20 bg-[#1b1712]"
            type="checkbox"
            onChange={(event) =>
              onFormChange({ ...form, isActive: event.target.checked })
            }
          />
          Produto ativo
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
          <input
            checked={form.isFeatured}
            className="h-4 w-4 rounded border-white/20 bg-[#1b1712]"
            type="checkbox"
            onChange={(event) =>
              onFormChange({ ...form, isFeatured: event.target.checked })
            }
          />
          Destaque
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
          <input
            checked={form.isOnSale}
            className="h-4 w-4 rounded border-white/20 bg-[#1b1712]"
            type="checkbox"
            onChange={(event) =>
              onFormChange({ ...form, isOnSale: event.target.checked })
            }
          />
          Em promoção
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Promoção a partir de
          </label>
          <Input
            className={fieldClassName}
            type="datetime-local"
            value={form.saleStartsAt}
            onChange={(event) =>
              onFormChange({ ...form, saleStartsAt: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Promoção até
          </label>
          <Input
            className={fieldClassName}
            type="datetime-local"
            value={form.saleEndsAt}
            onChange={(event) =>
              onFormChange({ ...form, saleEndsAt: event.target.value })
            }
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/6 bg-[#17140f] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
              Imagens
            </p>
            <h3 className="mt-2 [font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
              Lista validada e processamento seguro
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="border-white/6 bg-transparent hover:bg-[#17140f]"
              disabled={
                isCreating ||
                !selectedProduct ||
                selectedProduct.images.length === 0 ||
                isRemovingBackground ||
                isPersistingImages
              }
              type="button"
              variant="outline"
              onClick={onProcessImages}
            >
              {isRemovingBackground || isPersistingImages ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Processar com Remove.bg
            </Button>
            <Button
              asChild
              className="border-white/6 bg-transparent hover:bg-[#17140f]"
              type="button"
              variant="outline"
            >
              <Link href="/admin/remove-bg">
                <ImagePlus className="h-4 w-4" />
                Abrir laboratório dedicado
              </Link>
            </Button>
          </div>
        </div>

        {isRemovingBackground ? (
          <div className="mt-4 rounded-2xl border border-[#59627a]/25 bg-[#59627a]/10 px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#59627a]">
            Processando imagens com Remove.bg...{" "}
            {Math.round(removeBgProgress)}%
          </div>
        ) : null}

        <div className="mt-4">
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Uma imagem por linha
          </label>
          <textarea
            className={cn(
              fieldClassName,
              "min-h-32 resize-y font-mono",
            )}
            value={form.imagesText}
            onChange={(event) =>
              onFormChange({ ...form, imagesText: event.target.value })
            }
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {form.imagesText
            .split("\n")
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
            .slice(0, 8)
            .map((image, index) => (
              <ProductImagePreview
                key={`${image}-${index}`}
                alt={`Preview ${index + 1}`}
                src={image}
              />
            ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          disabled={isSaving}
          type="button"
          onClick={onSubmit}
        >
          {isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isCreating ? "Criar produto" : "Salvar produto"}
        </Button>
        {!isCreating && selectedProduct ? (
          <Button
            className="border-white/6 bg-transparent hover:bg-[#17140f]"
            type="button"
            variant="outline"
            onClick={onReset}
          >
            Restaurar último estado salvo
          </Button>
        ) : null}
      </div>
    </div>
  );
}
