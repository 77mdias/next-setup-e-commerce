"use client";

import { LoaderCircle, Warehouse } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminCatalogProductDetail } from "@/lib/admin/catalog-contract";
import type { StockAdjustmentFormState } from "./types";
import { fieldClassName } from "./types";

interface StockEditorProps {
  stockForm: StockAdjustmentFormState;
  onStockFormChange: (form: StockAdjustmentFormState) => void;
  onAdjustStock: () => void;
  isAdjusting: boolean;
  selectedProduct: AdminCatalogProductDetail | null;
}

export function StockEditor({
  stockForm,
  onStockFormChange,
  onAdjustStock,
  isAdjusting,
  selectedProduct,
}: StockEditorProps) {
  const stockTargets = selectedProduct
    ? [
        {
          id: "",
          label: `Produto base · ${selectedProduct.name}`,
          type: "product" as const,
        },
        ...selectedProduct.variants.map((variant) => ({
          id: variant.id,
          label: `${variant.name}: ${variant.value}`,
          type: "variant" as const,
        })),
      ]
    : [];

  if (!selectedProduct) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-white/12 bg-[#17140f] px-4 py-8 text-center [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
        Selecione um produto para ajustar estoque.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3">
          <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Quantidade
          </p>
          <p className="mt-2 [font-family:var(--font-space-grotesk)] text-2xl font-semibold text-[#f2eee8]">
            {selectedProduct.inventory.quantity}
          </p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3">
          <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Reservado
          </p>
          <p className="mt-2 [font-family:var(--font-space-grotesk)] text-2xl font-semibold text-[#f2eee8]">
            {selectedProduct.inventory.reserved}
          </p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3">
          <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Estoque mínimo
          </p>
          <p className="mt-2 [font-family:var(--font-space-grotesk)] text-2xl font-semibold text-[#f2eee8]">
            {selectedProduct.inventory.minStock}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Alvo do ajuste
          </label>
          <select
            className={fieldClassName}
            value={
              stockForm.targetType === "variant"
                ? stockForm.variantId
                : ""
            }
            onChange={(event) =>
              onStockFormChange({
                ...stockForm,
                targetType: event.target.value ? "variant" : "product",
                variantId: event.target.value,
              })
            }
          >
            {stockTargets.map((target) => (
              <option
                key={`${target.type}-${target.id}`}
                value={target.id}
              >
                {target.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Delta
          </label>
          <Input
            className={fieldClassName}
            placeholder="Ex.: 5 ou -3"
            value={stockForm.delta}
            onChange={(event) =>
              onStockFormChange({ ...stockForm, delta: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Estoque mínimo alvo
          </label>
          <Input
            className={fieldClassName}
            value={stockForm.minStock}
            onChange={(event) =>
              onStockFormChange({ ...stockForm, minStock: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Estoque máximo alvo
          </label>
          <Input
            className={fieldClassName}
            value={stockForm.maxStock}
            onChange={(event) =>
              onStockFormChange({ ...stockForm, maxStock: event.target.value })
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Motivo
          </label>
          <Input
            className={fieldClassName}
            value={stockForm.reason}
            onChange={(event) =>
              onStockFormChange({ ...stockForm, reason: event.target.value })
            }
          />
        </div>
        <div>
          <label className="mb-2 block [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#9f9383] uppercase">
            Referência
          </label>
          <Input
            className={fieldClassName}
            value={stockForm.reference}
            onChange={(event) =>
              onStockFormChange({ ...stockForm, reference: event.target.value })
            }
          />
        </div>
      </div>

      <Button
        className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
        disabled={isAdjusting}
        type="button"
        onClick={onAdjustStock}
      >
        {isAdjusting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Warehouse className="h-4 w-4" />
        )}
        Registrar ajuste
      </Button>
    </div>
  );
}
