import { StockMoveType, type Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import type {
  AdminCatalogCategoryPayload,
  AdminCatalogCategorySummary,
  AdminCatalogProductDetail,
  AdminCatalogProductPayload,
  AdminCatalogProductSummary,
  AdminCatalogProductsMeta,
  AdminCatalogStockAdjustmentPayload,
  AdminCatalogStockMovement,
  AdminCatalogValidationIssue,
} from "@/lib/admin/catalog-contract";
import { db } from "@/lib/prisma";
import { validateRemoveBgImageUrl } from "@/lib/remove-bg-security";

export const ADMIN_CATALOG_INVALID_PAYLOAD_CODE =
  "ADMIN_CATALOG_INVALID_PAYLOAD" as const;
export const ADMIN_CATALOG_INVALID_PAYLOAD_ERROR =
  "Dados do catálogo administrativo são inválidos";
export const ADMIN_CATALOG_CONFLICT_CODE = "ADMIN_CATALOG_CONFLICT" as const;

const MAX_IMAGE_COUNT = 12;
const MAX_DATA_IMAGE_LENGTH = 6_000_000;

const baseOptionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();

const baseObjectSchema = z.record(z.string(), z.unknown());

const productPayloadSchema = z
  .object({
    brandId: z.string().trim().min(1, "Marca é obrigatória"),
    categoryId: z.string().trim().min(1, "Categoria é obrigatória"),
    costPrice: z
      .number()
      .finite()
      .min(0, "Custo não pode ser negativo")
      .nullable()
      .optional(),
    description: z
      .string()
      .trim()
      .min(12, "Descrição precisa ter ao menos 12 caracteres"),
    dimensions: baseObjectSchema.nullable().optional(),
    images: z
      .array(z.string())
      .max(MAX_IMAGE_COUNT, "Máximo de 12 imagens por produto")
      .optional(),
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    isOnSale: z.boolean().optional().default(false),
    name: z
      .string()
      .trim()
      .min(3, "Nome precisa ter ao menos 3 caracteres")
      .max(120, "Nome muito longo"),
    originalPrice: z
      .number()
      .finite()
      .positive("Preço original precisa ser positivo")
      .nullable()
      .optional(),
    price: z.number().finite().positive("Preço precisa ser positivo"),
    saleEndsAt: baseOptionalText,
    saleStartsAt: baseOptionalText,
    shortDesc: baseOptionalText,
    sku: z
      .string()
      .trim()
      .min(3, "SKU precisa ter ao menos 3 caracteres")
      .max(64, "SKU muito longo")
      .transform((value) => value.toUpperCase()),
    specifications: baseObjectSchema,
    storeId: z.string().trim().min(1, "Loja é obrigatória").optional(),
    warranty: baseOptionalText,
    weight: z
      .number()
      .finite()
      .min(0, "Peso não pode ser negativo")
      .nullable()
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.originalPrice !== null && value.originalPrice !== undefined) {
      if (value.originalPrice < value.price) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Preço original não pode ser menor que o preço atual",
          path: ["originalPrice"],
        });
      }
    }

    if (value.isOnSale && !value.originalPrice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Produto em promoção precisa informar preço original",
        path: ["originalPrice"],
      });
    }

    const saleStartsAt = parseOptionalDate(value.saleStartsAt ?? null);
    const saleEndsAt = parseOptionalDate(value.saleEndsAt ?? null);

    if (value.saleStartsAt && !saleStartsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data inicial da promoção é inválida",
        path: ["saleStartsAt"],
      });
    }

    if (value.saleEndsAt && !saleEndsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data final da promoção é inválida",
        path: ["saleEndsAt"],
      });
    }

    if (saleStartsAt && saleEndsAt && saleEndsAt <= saleStartsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data final da promoção precisa ser posterior à inicial",
        path: ["saleEndsAt"],
      });
    }
  });

const categoryPayloadSchema = z.object({
  description: baseOptionalText,
  iconUrl: baseOptionalText,
  imageUrl: baseOptionalText,
  isActive: z.boolean().optional().default(true),
  name: z
    .string()
    .trim()
    .min(2, "Nome da categoria é obrigatório")
    .max(80, "Nome da categoria muito longo"),
  parentId: baseOptionalText,
  slug: baseOptionalText,
  sortOrder: z
    .number()
    .int()
    .min(0, "Ordem deve ser positiva")
    .max(9_999, "Ordem acima do limite")
    .optional()
    .default(0),
});

const stockAdjustmentSchema = z
  .object({
    delta: z
      .number()
      .int("Ajuste de estoque precisa ser inteiro")
      .min(-10_000, "Ajuste abaixo do limite")
      .max(10_000, "Ajuste acima do limite"),
    maxStock: z
      .number()
      .int()
      .min(0, "Estoque máximo não pode ser negativo")
      .max(100_000, "Estoque máximo acima do limite")
      .optional(),
    minStock: z
      .number()
      .int()
      .min(0, "Estoque mínimo não pode ser negativo")
      .max(100_000, "Estoque mínimo acima do limite")
      .optional(),
    reason: z
      .string()
      .trim()
      .min(6, "Motivo precisa ter ao menos 6 caracteres")
      .max(160, "Motivo muito longo"),
    reference: baseOptionalText,
    targetType: z.enum(["product", "variant"]).optional().default("product"),
    variantId: baseOptionalText,
  })
  .superRefine((value, context) => {
    if (value.delta === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ajuste de estoque não pode ser zero",
        path: ["delta"],
      });
    }

    if (
      value.minStock !== undefined &&
      value.maxStock !== undefined &&
      value.maxStock < value.minStock
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Estoque máximo precisa ser maior ou igual ao mínimo",
        path: ["maxStock"],
      });
    }

    if (value.targetType === "variant" && !value.variantId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variação é obrigatória para ajuste por variante",
        path: ["variantId"],
      });
    }
  });

type ProductListRow = {
  brand: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  id: string;
  images: string[];
  inventory: Array<{
    id: string;
    minStock: number;
    quantity: number;
    reserved: number;
  }>;
  isActive: boolean;
  isFeatured: boolean;
  name: string;
  price: number;
  sku: string;
  store: {
    id: string;
    name: string;
  };
  updatedAt: Date;
};

type ProductDetailRow = ProductListRow & {
  costPrice: number | null;
  description: string;
  dimensions: Prisma.JsonValue | null;
  isOnSale: boolean;
  originalPrice: number | null;
  saleEndsAt: Date | null;
  saleStartsAt: Date | null;
  shortDesc: string | null;
  specifications: Prisma.JsonValue;
  variants: Array<{
    id: string;
    inventory: Array<{
      id: string;
      minStock: number;
      quantity: number;
      reserved: number;
    }>;
    isActive: boolean;
    name: string;
    sku: string | null;
    stock: number;
    value: string;
  }>;
  warranty: string | null;
  weight: number | null;
};

type StockMovementRow = {
  createdAt: Date;
  id: string;
  inventory: {
    product: {
      name: string;
    };
    variant: {
      id: string;
      value: string;
    } | null;
  };
  quantity: number;
  reason: string;
  reference: string | null;
  type: StockMoveType;
  user: {
    email: string | null;
    name: string | null;
  } | null;
};

type CategoryRow = {
  _count: {
    children: number;
    products: number;
  };
  description: string | null;
  id: string;
  isActive: boolean;
  name: string;
  parentId: string | null;
  slug: string;
  sortOrder: number;
};

export type ParsedAdminCatalogProductPayload = Omit<
  z.infer<typeof productPayloadSchema>,
  "images" | "saleEndsAt" | "saleStartsAt"
> & {
  images: string[];
  saleEndsAt: Date | null;
  saleStartsAt: Date | null;
};

export type ParsedAdminCatalogCategoryPayload = Omit<
  z.infer<typeof categoryPayloadSchema>,
  "iconUrl" | "imageUrl" | "slug"
> & {
  iconUrl: string | null;
  imageUrl: string | null;
  slug: string;
};

export type ParsedAdminCatalogStockAdjustmentPayload = z.infer<
  typeof stockAdjustmentSchema
>;

export function parseCatalogPositiveInt(
  value: string | null,
  fallback: number,
  max: number,
): number {
  const parsedValue = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(parsedValue, max);
}

export function parseCatalogStringParam(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function parseOptionalDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsedValue = new Date(value);
  return Number.isNaN(parsedValue.getTime()) ? null : parsedValue;
}

function normalizeCatalogImageUrl(
  value: string,
): { normalized: string } | { error: string } {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return {
      error: "Imagem vazia não é permitida",
    };
  }

  if (trimmedValue.startsWith("data:image/")) {
    if (trimmedValue.length > MAX_DATA_IMAGE_LENGTH) {
      return {
        error: "Imagem inline excede o limite permitido",
      };
    }

    return {
      normalized: trimmedValue,
    };
  }

  if (trimmedValue.startsWith("/")) {
    return {
      normalized: trimmedValue,
    };
  }

  const validation = validateRemoveBgImageUrl(trimmedValue);

  if (!validation.valid) {
    return {
      error: validation.error,
    };
  }

  return {
    normalized: validation.normalizedUrl,
  };
}

export function normalizeAdminCatalogImagesInput(
  value: string[] | undefined,
):
  | { ok: true; value: string[] }
  | { issues: AdminCatalogValidationIssue[]; ok: false } {
  if (!value || value.length === 0) {
    return {
      ok: true,
      value: [],
    };
  }

  const normalizedImages: string[] = [];
  const seenImages = new Set<string>();
  const issues: AdminCatalogValidationIssue[] = [];

  value.forEach((imageValue, index) => {
    const normalizedImage = normalizeCatalogImageUrl(imageValue);

    if ("error" in normalizedImage) {
      issues.push({
        field: `images.${index}`,
        message: normalizedImage.error,
      });
      return;
    }

    if (seenImages.has(normalizedImage.normalized)) {
      return;
    }

    seenImages.add(normalizedImage.normalized);
    normalizedImages.push(normalizedImage.normalized);
  });

  if (issues.length > 0) {
    return {
      issues,
      ok: false,
    };
  }

  return {
    ok: true,
    value: normalizedImages,
  };
}

function mapZodIssues(issues: z.ZodIssue[]): AdminCatalogValidationIssue[] {
  return issues.map((issue) => ({
    field: issue.path.join(".") || "payload",
    message: issue.message,
  }));
}

export function createCatalogValidationErrorResponse(
  issues: AdminCatalogValidationIssue[],
) {
  return NextResponse.json(
    {
      code: ADMIN_CATALOG_INVALID_PAYLOAD_CODE,
      error: ADMIN_CATALOG_INVALID_PAYLOAD_ERROR,
      issues,
    },
    { status: 400 },
  );
}

export function createCatalogConflictResponse(
  error: string,
  status = 409,
  code = ADMIN_CATALOG_CONFLICT_CODE,
) {
  return NextResponse.json(
    {
      code,
      error,
    },
    { status },
  );
}

export function parseAdminCatalogProductPayload(
  payload: AdminCatalogProductPayload,
):
  | {
      ok: true;
      value: ParsedAdminCatalogProductPayload;
    }
  | {
      issues: AdminCatalogValidationIssue[];
      ok: false;
    } {
  const parsedPayload = productPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      issues: mapZodIssues(parsedPayload.error.issues),
      ok: false,
    };
  }

  const normalizedImages = normalizeAdminCatalogImagesInput(
    parsedPayload.data.images,
  );

  if (!normalizedImages.ok) {
    return normalizedImages;
  }

  return {
    ok: true,
    value: {
      ...parsedPayload.data,
      images: normalizedImages.value,
      saleEndsAt: parseOptionalDate(parsedPayload.data.saleEndsAt ?? null),
      saleStartsAt: parseOptionalDate(parsedPayload.data.saleStartsAt ?? null),
    },
  };
}

export function parseAdminCatalogCategoryPayload(
  payload: AdminCatalogCategoryPayload,
):
  | {
      ok: true;
      value: ParsedAdminCatalogCategoryPayload;
    }
  | {
      issues: AdminCatalogValidationIssue[];
      ok: false;
    } {
  const parsedPayload = categoryPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      issues: mapZodIssues(parsedPayload.error.issues),
      ok: false,
    };
  }

  const imageFields = [
    ["imageUrl", parsedPayload.data.imageUrl],
    ["iconUrl", parsedPayload.data.iconUrl],
  ] as const;
  const issues: AdminCatalogValidationIssue[] = [];
  const normalizedImages = new Map<string, string>();

  for (const [field, rawValue] of imageFields) {
    if (!rawValue) {
      continue;
    }

    const normalizedImage = normalizeCatalogImageUrl(rawValue);
    if ("error" in normalizedImage) {
      issues.push({
        field,
        message: normalizedImage.error,
      });
    } else {
      normalizedImages.set(field, normalizedImage.normalized);
    }
  }

  if (issues.length > 0) {
    return {
      issues,
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      ...parsedPayload.data,
      iconUrl: normalizedImages.get("iconUrl") ?? null,
      imageUrl: normalizedImages.get("imageUrl") ?? null,
      slug: slugifyAdminCategory(
        parsedPayload.data.slug ?? parsedPayload.data.name,
      ),
    },
  };
}

export function parseAdminCatalogStockAdjustmentPayload(
  payload: AdminCatalogStockAdjustmentPayload,
):
  | {
      ok: true;
      value: ParsedAdminCatalogStockAdjustmentPayload;
    }
  | {
      issues: AdminCatalogValidationIssue[];
      ok: false;
    } {
  const parsedPayload = stockAdjustmentSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      issues: mapZodIssues(parsedPayload.error.issues),
      ok: false,
    };
  }

  return {
    ok: true,
    value: parsedPayload.data,
  };
}

export function slugifyAdminCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function resolveCatalogScopeMeta(params: {
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  role: string;
  stores: Array<{ id: string; name: string }>;
}): AdminCatalogProductsMeta {
  return {
    brands: params.brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
    })),
    canDeleteProducts: params.role !== "STORE_ADMIN",
    canManageCategories: params.role !== "STORE_ADMIN",
    categories: params.categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    stores: params.stores.map((store) => ({
      id: store.id,
      name: store.name,
    })),
  };
}

export async function loadAdminCatalogMeta(params: {
  role: string;
  scopedStoreIds: string[] | null;
}): Promise<AdminCatalogProductsMeta> {
  const storeWhere = params.scopedStoreIds
    ? {
        id: {
          in: params.scopedStoreIds,
        },
      }
    : {
        isActive: true,
      };

  const [brands, categories, stores] = await Promise.all([
    db.brand.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.store.findMany({
      where: storeWhere,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return resolveCatalogScopeMeta({
    brands,
    categories,
    role: params.role,
    stores,
  });
}

function resolveInventorySnapshot(
  inventory: Array<{
    id: string;
    minStock: number;
    quantity: number;
    reserved: number;
  }>,
) {
  const primaryInventory = inventory[0];

  return {
    availableQuantity: Math.max(
      (primaryInventory?.quantity ?? 0) - (primaryInventory?.reserved ?? 0),
      0,
    ),
    inventoryId: primaryInventory?.id ?? null,
    minStock: primaryInventory?.minStock ?? 0,
    quantity: primaryInventory?.quantity ?? 0,
    reserved: primaryInventory?.reserved ?? 0,
  };
}

export function serializeAdminCatalogProductSummary(
  product: ProductListRow,
): AdminCatalogProductSummary {
  const inventory = resolveInventorySnapshot(product.inventory);

  return {
    availableQuantity: inventory.availableQuantity,
    brand: {
      id: product.brand.id,
      name: product.brand.name,
    },
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    id: product.id,
    images: product.images,
    inventory: {
      minStock: inventory.minStock,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
    },
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    name: product.name,
    price: product.price,
    sku: product.sku,
    store: {
      id: product.store.id,
      name: product.store.name,
    },
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function serializeAdminCatalogStockMovement(
  movement: StockMovementRow,
): AdminCatalogStockMovement {
  const targetLabel = movement.inventory.variant
    ? `${movement.inventory.product.name} / ${movement.inventory.variant.value}`
    : movement.inventory.product.name;

  return {
    createdAt: movement.createdAt.toISOString(),
    id: movement.id,
    quantity: movement.quantity,
    reason: movement.reason,
    reference: movement.reference,
    target: {
      id: movement.inventory.variant ? movement.inventory.variant.id : null,
      label: targetLabel,
      type: movement.inventory.variant ? "variant" : "product",
    },
    type: movement.type,
    userLabel:
      movement.user?.name?.trim() ||
      movement.user?.email?.trim() ||
      "Operador admin",
  };
}

function normalizeJsonObject(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value === null ? null : {};
  }

  return value as Record<string, unknown>;
}

export function serializeAdminCatalogProductDetail(
  product: ProductDetailRow,
  inventoryHistory: StockMovementRow[],
): AdminCatalogProductDetail {
  const summary = serializeAdminCatalogProductSummary(product);
  const inventory = resolveInventorySnapshot(product.inventory);

  return {
    ...summary,
    costPrice: product.costPrice,
    description: product.description,
    dimensions: normalizeJsonObject(product.dimensions),
    inventoryHistory: inventoryHistory.map(serializeAdminCatalogStockMovement),
    inventoryRecordId: inventory.inventoryId,
    isOnSale: product.isOnSale,
    originalPrice: product.originalPrice,
    saleEndsAt: product.saleEndsAt?.toISOString() ?? null,
    saleStartsAt: product.saleStartsAt?.toISOString() ?? null,
    shortDesc: product.shortDesc,
    specifications: normalizeJsonObject(product.specifications) ?? {},
    variants: product.variants.map((variant) => {
      const variantInventory = resolveInventorySnapshot(variant.inventory);

      return {
        id: variant.id,
        inventory: variantInventory,
        isActive: variant.isActive,
        name: variant.name,
        sku: variant.sku,
        stock: variant.stock,
        value: variant.value,
      };
    }),
    warranty: product.warranty,
    weight: product.weight,
  };
}

export function serializeAdminCatalogCategory(
  category: CategoryRow,
): AdminCatalogCategorySummary {
  return {
    childrenCount: category._count.children,
    description: category.description,
    id: category.id,
    isActive: category.isActive,
    name: category.name,
    parentId: category.parentId,
    productCount: category._count.products,
    slug: category.slug,
    sortOrder: category.sortOrder,
  };
}
