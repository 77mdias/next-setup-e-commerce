export type AdminCatalogStoreOption = {
  id: string;
  name: string;
};

export type AdminCatalogBrandOption = {
  id: string;
  name: string;
};

export type AdminCatalogCategorySummary = {
  childrenCount: number;
  description: string | null;
  id: string;
  isActive: boolean;
  name: string;
  parentId: string | null;
  productCount: number;
  slug: string;
  sortOrder: number;
};

export type AdminCatalogStockTarget = {
  id: string | null;
  label: string;
  type: "product" | "variant";
};

export type AdminCatalogProductSummary = {
  availableQuantity: number;
  brand: AdminCatalogBrandOption;
  category: Pick<AdminCatalogCategorySummary, "id" | "name" | "slug">;
  id: string;
  images: string[];
  inventory: {
    minStock: number;
    quantity: number;
    reserved: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  name: string;
  price: number;
  sku: string;
  store: AdminCatalogStoreOption;
  updatedAt: string;
};

export type AdminCatalogStockMovement = {
  createdAt: string;
  id: string;
  quantity: number;
  reason: string;
  reference: string | null;
  target: AdminCatalogStockTarget;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RESERVED" | "RELEASED";
  userLabel: string;
};

export type AdminCatalogVariantSummary = {
  id: string;
  inventory: {
    availableQuantity: number;
    inventoryId: string | null;
    minStock: number;
    quantity: number;
    reserved: number;
  };
  isActive: boolean;
  name: string;
  sku: string | null;
  stock: number;
  value: string;
};

export type AdminCatalogProductDetail = AdminCatalogProductSummary & {
  costPrice: number | null;
  description: string;
  dimensions: Record<string, unknown> | null;
  inventoryHistory: AdminCatalogStockMovement[];
  inventoryRecordId: string | null;
  isOnSale: boolean;
  originalPrice: number | null;
  saleEndsAt: string | null;
  saleStartsAt: string | null;
  shortDesc: string | null;
  specifications: Record<string, unknown>;
  variants: AdminCatalogVariantSummary[];
  warranty: string | null;
  weight: number | null;
};

export type AdminCatalogProductsMeta = {
  brands: AdminCatalogBrandOption[];
  canDeleteProducts: boolean;
  canManageCategories: boolean;
  categories: Array<Pick<AdminCatalogCategorySummary, "id" | "name" | "slug">>;
  stores: AdminCatalogStoreOption[];
};

export type AdminCatalogProductsResponse = {
  meta: AdminCatalogProductsMeta;
  page: number;
  products: AdminCatalogProductSummary[];
  success: true;
  total: number;
  totalPages: number;
};

export type AdminCatalogProductDetailResponse = {
  meta: AdminCatalogProductsMeta;
  product: AdminCatalogProductDetail;
  success: true;
};

export type AdminCatalogProductMutationResponse = {
  product: AdminCatalogProductDetail | AdminCatalogProductSummary;
  success: true;
};

export type AdminCatalogCategoryListResponse = {
  categories: AdminCatalogCategorySummary[];
  success: true;
};

export type AdminCatalogCategoryMutationResponse = {
  category: AdminCatalogCategorySummary;
  success: true;
};

export type AdminCatalogValidationIssue = {
  field: string;
  message: string;
};

export type AdminCatalogValidationErrorResponse = {
  code: "ADMIN_CATALOG_INVALID_PAYLOAD";
  error: string;
  issues: AdminCatalogValidationIssue[];
};

export type AdminCatalogProductPayload = {
  brandId?: unknown;
  categoryId?: unknown;
  costPrice?: unknown;
  description?: unknown;
  dimensions?: unknown;
  images?: unknown;
  isActive?: unknown;
  isFeatured?: unknown;
  isOnSale?: unknown;
  name?: unknown;
  originalPrice?: unknown;
  price?: unknown;
  saleEndsAt?: unknown;
  saleStartsAt?: unknown;
  shortDesc?: unknown;
  sku?: unknown;
  specifications?: unknown;
  storeId?: unknown;
  warranty?: unknown;
  weight?: unknown;
};

export type AdminCatalogCategoryPayload = {
  description?: unknown;
  iconUrl?: unknown;
  imageUrl?: unknown;
  isActive?: unknown;
  name?: unknown;
  parentId?: unknown;
  slug?: unknown;
  sortOrder?: unknown;
};

export type AdminCatalogStockAdjustmentPayload = {
  delta?: unknown;
  maxStock?: unknown;
  minStock?: unknown;
  reason?: unknown;
  reference?: unknown;
  targetType?: unknown;
  variantId?: unknown;
};
