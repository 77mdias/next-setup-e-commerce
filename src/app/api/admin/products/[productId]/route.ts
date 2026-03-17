import { NextRequest, NextResponse } from "next/server";
import { AdminAuditAction, AdminAuditResource, Prisma } from "@prisma/client";

import type {
  AdminCatalogProductDetailResponse,
  AdminCatalogProductMutationResponse,
  AdminCatalogProductPayload,
  AdminCatalogValidationIssue,
} from "@/lib/admin/catalog-contract";
import {
  createCatalogValidationErrorResponse,
  loadAdminCatalogMeta,
  parseAdminCatalogProductPayload,
  serializeAdminCatalogProductDetail,
} from "@/lib/admin/catalog";
import { writeAdminAuditLog } from "@/lib/audit-log";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
  getAuthorizedAdminStoreIds,
} from "@/lib/rbac";

function buildProductAuditSnapshot(params: {
  brandId: string;
  categoryId: string;
  imageCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  name: string;
  price: number;
  sku: string;
  storeId: string;
}) {
  return {
    brandId: params.brandId,
    categoryId: params.categoryId,
    imageCount: params.imageCount,
    isActive: params.isActive,
    isFeatured: params.isFeatured,
    isOnSale: params.isOnSale,
    name: params.name,
    price: params.price,
    sku: params.sku,
    storeId: params.storeId,
  };
}

async function loadProductDetail(productId: string) {
  const product = await db.product.findUnique({
    where: {
      id: productId,
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
      costPrice: true,
      description: true,
      dimensions: true,
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
      isOnSale: true,
      name: true,
      originalPrice: true,
      price: true,
      saleEndsAt: true,
      saleStartsAt: true,
      shortDesc: true,
      sku: true,
      specifications: true,
      store: {
        select: {
          id: true,
          name: true,
        },
      },
      updatedAt: true,
      variants: {
        orderBy: [{ name: "asc" }, { value: "asc" }],
        select: {
          id: true,
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
          },
          isActive: true,
          name: true,
          sku: true,
          stock: true,
          value: true,
        },
      },
      warranty: true,
      weight: true,
    },
  });

  if (!product) {
    return null;
  }

  const inventoryIds = [
    ...product.inventory.map((inventory) => inventory.id),
    ...product.variants.flatMap((variant) =>
      variant.inventory.map((inventory) => inventory.id),
    ),
  ];

  const inventoryHistory =
    inventoryIds.length > 0
      ? await db.stockMovement.findMany({
          where: {
            inventoryId: {
              in: inventoryIds,
            },
          },
          include: {
            inventory: {
              include: {
                product: {
                  select: {
                    name: true,
                  },
                },
                variant: {
                  select: {
                    id: true,
                    value: true,
                  },
                },
              },
            },
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 12,
        })
      : [];

  return serializeAdminCatalogProductDetail(product, inventoryHistory);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/products/[productId]",
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
  const { productId } = await params;

  if (!productId?.trim()) {
    return createCatalogValidationErrorResponse([
      {
        field: "productId",
        message: "Identificador de produto inválido",
      },
    ]);
  }

  try {
    const product = await loadProductDetail(productId);

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    const storeAccess = authorizeAdminStoreScopeAccess({
      authorization,
      resource: "catalog",
      resourceId: product.id,
      storeId: product.store.id,
    });

    if (!storeAccess.authorized) {
      return storeAccess.response;
    }

    const meta = await loadAdminCatalogMeta({
      role: authorization.role,
      scopedStoreIds: getAuthorizedAdminStoreIds(authorization),
    });

    return NextResponse.json<AdminCatalogProductDetailResponse>({
      meta,
      product,
      success: true,
    });
  } catch (error) {
    logger.error("admin.products.detail_failed", {
      context: {
        productId,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao carregar detalhe do produto" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/products/[productId]",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "update",
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

  const { productId } = await params;

  if (!productId?.trim()) {
    return createCatalogValidationErrorResponse([
      {
        field: "productId",
        message: "Identificador de produto inválido",
      },
    ]);
  }

  try {
    const existingProduct = await db.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        brandId: true,
        categoryId: true,
        id: true,
        images: true,
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        name: true,
        price: true,
        sku: true,
        storeId: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    const storeAccess = authorizeAdminStoreScopeAccess({
      authorization,
      resource: "catalog",
      resourceId: existingProduct.id,
      storeId: existingProduct.storeId,
    });

    if (!storeAccess.authorized) {
      return storeAccess.response;
    }

    const issues: AdminCatalogValidationIssue[] = [];

    if (
      parsedPayload.value.storeId &&
      parsedPayload.value.storeId !== existingProduct.storeId
    ) {
      issues.push({
        field: "storeId",
        message: "Loja do produto não pode ser alterada após a criação",
      });
    }

    const [brand, category, duplicatedSku] = await Promise.all([
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
      db.product.findFirst({
        where: {
          id: {
            not: productId,
          },
          sku: parsedPayload.value.sku,
        },
        select: {
          id: true,
        },
      }),
    ]);

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

    if (duplicatedSku) {
      issues.push({
        field: "sku",
        message: "Já existe um produto com este SKU",
      });
    }

    if (issues.length > 0) {
      return createCatalogValidationErrorResponse(issues);
    }

    await db.$transaction(async (transaction) => {
      await transaction.product.update({
        where: {
          id: productId,
        },
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
          warranty: parsedPayload.value.warranty ?? null,
          weight: parsedPayload.value.weight ?? null,
        },
      });

      await writeAdminAuditLog({
        action: AdminAuditAction.UPDATE,
        actor: authorization.user,
        after: buildProductAuditSnapshot({
          brandId: parsedPayload.value.brandId,
          categoryId: parsedPayload.value.categoryId,
          imageCount: parsedPayload.value.images.length,
          isActive: parsedPayload.value.isActive,
          isFeatured: parsedPayload.value.isFeatured,
          isOnSale: parsedPayload.value.isOnSale,
          name: parsedPayload.value.name,
          price: parsedPayload.value.price,
          sku: parsedPayload.value.sku,
          storeId: existingProduct.storeId,
        }),
        before: buildProductAuditSnapshot({
          brandId: existingProduct.brandId,
          categoryId: existingProduct.categoryId,
          imageCount: existingProduct.images.length,
          isActive: existingProduct.isActive,
          isFeatured: existingProduct.isFeatured,
          isOnSale: existingProduct.isOnSale,
          name: existingProduct.name,
          price: existingProduct.price,
          sku: existingProduct.sku,
          storeId: existingProduct.storeId,
        }),
        client: transaction,
        metadata: {
          route: "/api/admin/products/[productId]",
        },
        resource: AdminAuditResource.PRODUCT,
        storeId: existingProduct.storeId,
        summary: `Produto ${existingProduct.name} (${existingProduct.sku}) atualizado no catalogo administrativo.`,
        targetId: existingProduct.id,
        targetLabel: parsedPayload.value.name,
      });
    });

    const updatedProduct = await loadProductDetail(productId);

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json<AdminCatalogProductMutationResponse>({
      product: updatedProduct,
      success: true,
    });
  } catch (error) {
    logger.error("admin.products.update_failed", {
      context: {
        productId,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao atualizar produto administrativo" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/products/[productId]",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "delete",
    logger: requestLogger,
    request,
    resource: "catalog",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;
  const { productId } = await params;

  if (!productId?.trim()) {
    return createCatalogValidationErrorResponse([
      {
        field: "productId",
        message: "Identificador de produto inválido",
      },
    ]);
  }

  try {
    const product = await db.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        name: true,
        price: true,
        sku: true,
        storeId: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    const storeAccess = authorizeAdminStoreScopeAccess({
      authorization,
      resource: "catalog",
      resourceId: product.id,
      storeId: product.storeId,
    });

    if (!storeAccess.authorized) {
      return storeAccess.response;
    }

    const orderItemCount = await db.orderItem.count({
      where: {
        productId,
      },
    });

    if (orderItemCount > 0) {
      return NextResponse.json(
        {
          code: "ADMIN_CATALOG_PRODUCT_DELETE_BLOCKED",
          error:
            "Produto com histórico de pedidos não pode ser removido do catálogo",
        },
        { status: 409 },
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.product.delete({
        where: {
          id: productId,
        },
      });

      await writeAdminAuditLog({
        action: AdminAuditAction.DELETE,
        actor: authorization.user,
        after: null,
        before: {
          id: product.id,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isOnSale: product.isOnSale,
          name: product.name,
          price: product.price,
          sku: product.sku,
          storeId: product.storeId,
        },
        client: transaction,
        metadata: {
          route: "/api/admin/products/[productId]",
        },
        resource: AdminAuditResource.PRODUCT,
        storeId: product.storeId,
        summary: `Produto ${product.name} (${product.sku}) removido do catalogo administrativo.`,
        targetId: product.id,
        targetLabel: product.name,
      });
    });

    return NextResponse.json({
      productId,
      success: true,
    });
  } catch (error) {
    logger.error("admin.products.delete_failed", {
      context: {
        productId,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao remover produto administrativo" },
      { status: 500 },
    );
  }
}
