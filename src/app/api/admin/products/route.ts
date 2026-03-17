import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import type {
  AdminCatalogProductMutationResponse,
  AdminCatalogProductsResponse,
  AdminCatalogValidationIssue,
  AdminCatalogProductPayload,
} from "@/lib/admin/catalog-contract";
import {
  createCatalogValidationErrorResponse,
  loadAdminCatalogMeta,
  parseAdminCatalogProductPayload,
  parseCatalogPositiveInt,
  parseCatalogStringParam,
  serializeAdminCatalogProductSummary,
} from "@/lib/admin/catalog";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
  getAuthorizedAdminStoreIds,
} from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/products",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "read",
    logger: requestLogger,
    request,
    resource: "catalog",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseCatalogPositiveInt(searchParams.get("page"), 1, 10_000);
    const limit = parseCatalogPositiveInt(searchParams.get("limit"), 12, 60);
    const searchQuery = parseCatalogStringParam(searchParams.get("query"));
    const requestedStoreId = parseCatalogStringParam(
      searchParams.get("storeId"),
    );
    const scopedStoreIds = getAuthorizedAdminStoreIds(authorization);

    if (requestedStoreId) {
      const storeAccess = authorizeAdminStoreScopeAccess({
        authorization,
        resource: "catalog",
        storeId: requestedStoreId,
      });

      if (!storeAccess.authorized) {
        return storeAccess.response;
      }
    }

    const meta = await loadAdminCatalogMeta({
      role: authorization.role,
      scopedStoreIds,
    });

    if (scopedStoreIds && scopedStoreIds.length === 0) {
      return NextResponse.json<AdminCatalogProductsResponse>({
        meta,
        page,
        products: [],
        success: true,
        total: 0,
        totalPages: 1,
      });
    }

    const where: Prisma.ProductWhereInput = {};

    if (requestedStoreId) {
      where.storeId = requestedStoreId;
    } else if (scopedStoreIds) {
      where.storeId = {
        in: scopedStoreIds,
      };
    }

    if (searchQuery) {
      where.OR = [
        {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await db.$transaction([
      db.product.findMany({
        where,
        select: {
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          id: true,
          images: true,
          inventory: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              minStock: true,
              quantity: true,
              reserved: true,
            },
            take: 1,
            where: {
              variantId: null,
            },
          },
          isActive: true,
          isFeatured: true,
          name: true,
          price: true,
          sku: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedAt: true,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      db.product.count({
        where,
      }),
    ]);

    return NextResponse.json<AdminCatalogProductsResponse>({
      meta,
      page,
      products: products.map(serializeAdminCatalogProductSummary),
      success: true,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    logger.error("admin.products.list_failed", {
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao carregar produtos administrativos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/products",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "create",
    logger: requestLogger,
    request,
    resource: "catalog",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;
  let payload: AdminCatalogProductPayload;

  try {
    payload = (await request.json()) as AdminCatalogProductPayload;
  } catch {
    return createCatalogValidationErrorResponse([
      {
        field: "payload",
        message: "Payload JSON inválido",
      },
    ]);
  }

  const parsedPayload = parseAdminCatalogProductPayload(payload);

  if (!parsedPayload.ok) {
    return createCatalogValidationErrorResponse(parsedPayload.issues);
  }

  const scopedStoreIds = getAuthorizedAdminStoreIds(authorization);
  const targetStoreId =
    parsedPayload.value.storeId ??
    (scopedStoreIds?.length === 1 ? scopedStoreIds[0] : null);

  if (!targetStoreId) {
    return createCatalogValidationErrorResponse([
      {
        field: "storeId",
        message: "Loja é obrigatória para criar produto",
      },
    ]);
  }

  const storeAccess = authorizeAdminStoreScopeAccess({
    authorization,
    resource: "catalog",
    storeId: targetStoreId,
  });

  if (!storeAccess.authorized) {
    return storeAccess.response;
  }

  try {
    const [store, brand, category, existingProduct] = await Promise.all([
      db.store.findUnique({
        where: {
          id: targetStoreId,
        },
        select: {
          id: true,
          isActive: true,
        },
      }),
      db.brand.findUnique({
        where: {
          id: parsedPayload.value.brandId,
        },
        select: {
          id: true,
        },
      }),
      db.category.findUnique({
        where: {
          id: parsedPayload.value.categoryId,
        },
        select: {
          id: true,
        },
      }),
      db.product.findUnique({
        where: {
          sku: parsedPayload.value.sku,
        },
        select: {
          id: true,
        },
      }),
    ]);

    const issues: AdminCatalogValidationIssue[] = [];

    if (!store || !store.isActive) {
      issues.push({
        field: "storeId",
        message: "Loja informada não está disponível para operação",
      });
    }

    if (!brand) {
      issues.push({
        field: "brandId",
        message: "Marca informada não foi encontrada",
      });
    }

    if (!category) {
      issues.push({
        field: "categoryId",
        message: "Categoria informada não foi encontrada",
      });
    }

    if (existingProduct) {
      issues.push({
        field: "sku",
        message: "Já existe um produto com este SKU",
      });
    }

    if (issues.length > 0) {
      return createCatalogValidationErrorResponse(issues);
    }

    const createdProduct = await db.$transaction(async (transaction) => {
      const product = await transaction.product.create({
        data: {
          brandId: parsedPayload.value.brandId,
          categoryId: parsedPayload.value.categoryId,
          costPrice: parsedPayload.value.costPrice ?? null,
          description: parsedPayload.value.description,
          dimensions:
            parsedPayload.value.dimensions === null
              ? Prisma.JsonNull
              : (parsedPayload.value.dimensions as Prisma.InputJsonValue),
          images: parsedPayload.value.images,
          isActive: parsedPayload.value.isActive,
          isFeatured: parsedPayload.value.isFeatured,
          isOnSale: parsedPayload.value.isOnSale,
          name: parsedPayload.value.name,
          originalPrice: parsedPayload.value.originalPrice ?? null,
          price: parsedPayload.value.price,
          saleEndsAt: parsedPayload.value.saleEndsAt,
          saleStartsAt: parsedPayload.value.saleStartsAt,
          shortDesc: parsedPayload.value.shortDesc ?? null,
          sku: parsedPayload.value.sku,
          specifications: parsedPayload.value
            .specifications as Prisma.InputJsonValue,
          storeId: targetStoreId,
          warranty: parsedPayload.value.warranty ?? null,
          weight: parsedPayload.value.weight ?? null,
        },
        select: {
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          id: true,
          images: true,
          isActive: true,
          isFeatured: true,
          name: true,
          price: true,
          sku: true,
          store: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedAt: true,
        },
      });

      await transaction.inventory.create({
        data: {
          location: "Estoque admin",
          maxStock: 1_000,
          minStock: 0,
          productId: product.id,
          quantity: 0,
          storeId: targetStoreId,
        },
      });

      return product;
    });

    return NextResponse.json<AdminCatalogProductMutationResponse>({
      product: {
        availableQuantity: 0,
        brand: createdProduct.brand,
        category: createdProduct.category,
        id: createdProduct.id,
        images: createdProduct.images,
        inventory: {
          minStock: 0,
          quantity: 0,
          reserved: 0,
        },
        isActive: createdProduct.isActive,
        isFeatured: createdProduct.isFeatured,
        name: createdProduct.name,
        price: createdProduct.price,
        sku: createdProduct.sku,
        store: createdProduct.store,
        updatedAt: createdProduct.updatedAt.toISOString(),
      },
      success: true,
    });
  } catch (error) {
    logger.error("admin.products.create_failed", {
      context: {
        storeId: targetStoreId,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao criar produto administrativo" },
      { status: 500 },
    );
  }
}
