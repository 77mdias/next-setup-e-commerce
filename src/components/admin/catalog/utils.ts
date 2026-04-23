// Utility functions for Admin Catalog components

import type {
  AdminCatalogCategorySummary,
  AdminCatalogProductDetail,
  AdminCatalogProductPayload,
  AdminCatalogStockAdjustmentPayload,
} from "@/lib/admin/catalog-contract";
import type {
  CategoryFormState,
  ProductFormState,
  StockAdjustmentFormState,
} from "./types";

export function createEmptyProductForm(
  defaults?: Partial<
    Pick<ProductFormState, "brandId" | "categoryId" | "storeId">
  >,
): ProductFormState {
  return {
    brandId: defaults?.brandId ?? "",
    categoryId: defaults?.categoryId ?? "",
    costPrice: "",
    description: "",
    dimensionsText: "",
    imagesText: "",
    isActive: true,
    isFeatured: false,
    isOnSale: false,
    name: "",
    originalPrice: "",
    price: "",
    saleEndsAt: "",
    saleStartsAt: "",
    shortDesc: "",
    sku: "",
    specificationsText: "{\n  \n}",
    storeId: defaults?.storeId ?? "",
    warranty: "",
    weight: "",
  };
}

export function createEmptyCategoryForm(): CategoryFormState {
  return {
    description: "",
    isActive: true,
    name: "",
    parentId: "",
    slug: "",
    sortOrder: "0",
  };
}

export function createEmptyStockAdjustmentForm(): StockAdjustmentFormState {
  return {
    delta: "",
    maxStock: "",
    minStock: "",
    reason: "",
    reference: "",
    targetType: "product",
    variantId: "",
  };
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const normalizedDate = new Date(date.getTime() - offset * 60 * 1000);

  return normalizedDate.toISOString().slice(0, 16);
}

export function mapProductDetailToForm(
  detail: AdminCatalogProductDetail,
): ProductFormState {
  return {
    brandId: detail.brand.id,
    categoryId: detail.category.id,
    costPrice: detail.costPrice === null ? "" : String(detail.costPrice),
    description: detail.description,
    dimensionsText: detail.dimensions
      ? JSON.stringify(detail.dimensions, null, 2)
      : "",
    imagesText: detail.images.join("\n"),
    isActive: detail.isActive,
    isFeatured: detail.isFeatured,
    isOnSale: detail.isOnSale,
    name: detail.name,
    originalPrice:
      detail.originalPrice === null ? "" : String(detail.originalPrice),
    price: String(detail.price),
    saleEndsAt: toDateTimeLocalValue(detail.saleEndsAt),
    saleStartsAt: toDateTimeLocalValue(detail.saleStartsAt),
    shortDesc: detail.shortDesc ?? "",
    sku: detail.sku,
    specificationsText: JSON.stringify(detail.specifications, null, 2),
    storeId: detail.store.id,
    warranty: detail.warranty ?? "",
    weight: detail.weight === null ? "" : String(detail.weight),
  };
}

export function mapCategoryToForm(
  category: AdminCatalogCategorySummary,
): CategoryFormState {
  return {
    description: category.description ?? "",
    isActive: category.isActive,
    name: category.name,
    parentId: category.parentId ?? "",
    slug: category.slug,
    sortOrder: String(category.sortOrder),
  };
}

export function buildProductPayload(
  form: ProductFormState,
): AdminCatalogProductPayload {
  const images = form.imagesText
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const specifications = JSON.parse(form.specificationsText || "{}") as Record<
    string,
    unknown
  >;
  const dimensions =
    form.dimensionsText.trim().length > 0
      ? (JSON.parse(form.dimensionsText) as Record<string, unknown>)
      : null;

  return {
    brandId: form.brandId,
    categoryId: form.categoryId,
    costPrice:
      form.costPrice.trim().length > 0 ? Number(form.costPrice.trim()) : null,
    description: form.description,
    dimensions,
    images,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    isOnSale: form.isOnSale,
    name: form.name,
    originalPrice:
      form.originalPrice.trim().length > 0
        ? Number(form.originalPrice.trim())
        : null,
    price: Number(form.price.trim()),
    saleEndsAt: form.saleEndsAt.trim().length > 0 ? form.saleEndsAt : null,
    saleStartsAt:
      form.saleStartsAt.trim().length > 0 ? form.saleStartsAt : null,
    shortDesc: form.shortDesc.trim().length > 0 ? form.shortDesc : null,
    sku: form.sku,
    specifications,
    storeId: form.storeId,
    warranty: form.warranty.trim().length > 0 ? form.warranty : null,
    weight: form.weight.trim().length > 0 ? Number(form.weight.trim()) : null,
  };
}

export function buildCategoryPayload(form: CategoryFormState) {
  return {
    description: form.description.trim().length > 0 ? form.description : null,
    isActive: form.isActive,
    name: form.name,
    parentId: form.parentId.trim().length > 0 ? form.parentId : null,
    slug: form.slug.trim().length > 0 ? form.slug : null,
    sortOrder: Number(form.sortOrder.trim() || "0"),
  };
}

export function buildStockPayload(
  form: StockAdjustmentFormState,
): AdminCatalogStockAdjustmentPayload {
  return {
    delta: Number(form.delta.trim()),
    maxStock:
      form.maxStock.trim().length > 0
        ? Number(form.maxStock.trim())
        : undefined,
    minStock:
      form.minStock.trim().length > 0
        ? Number(form.minStock.trim())
        : undefined,
    reason: form.reason,
    reference: form.reference.trim().length > 0 ? form.reference : null,
    targetType: form.targetType,
    variantId: form.targetType === "variant" ? form.variantId : null,
  };
}
