// Shared types for Admin Catalog components

export type ProductFormState = {
  brandId: string;
  categoryId: string;
  costPrice: string;
  description: string;
  dimensionsText: string;
  imagesText: string;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  name: string;
  originalPrice: string;
  price: string;
  saleEndsAt: string;
  saleStartsAt: string;
  shortDesc: string;
  sku: string;
  specificationsText: string;
  storeId: string;
  warranty: string;
  weight: string;
};

export type CategoryFormState = {
  description: string;
  isActive: boolean;
  name: string;
  parentId: string;
  slug: string;
  sortOrder: string;
};

export type StockAdjustmentFormState = {
  delta: string;
  maxStock: string;
  minStock: string;
  reason: string;
  reference: string;
  targetType: "product" | "variant";
  variantId: string;
};

export const DEFAULT_FILTERS = {
  limit: 8,
  page: 1,
  query: "",
  storeId: null as string | null,
};

export const fieldClassName =
  "min-h-10 w-full rounded-2xl border border-white/6 bg-[#17140f] px-3 py-2 text-sm text-[#f2eee8] shadow-sm outline-none transition focus:border-[#59627a]/60 focus:ring-2 focus:ring-cyan-400/20";
