import { NextRequest, NextResponse } from "next/server";
import {
  AdminAuditAction,
  AdminAuditResource,
  StockMoveType,
} from "@prisma/client";

import type { AdminCatalogStockAdjustmentPayload } from "@/lib/admin/catalog-contract";
import {
  createCatalogValidationErrorResponse,
  parseAdminCatalogStockAdjustmentPayload,
} from "@/lib/admin/catalog";
import { writeAdminAuditLog } from "@/lib/audit-log";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
} from "@/lib/rbac";

function buildInventoryAuditSnapshot(params: {
  inventoryId: string | null;
  maxStock: number;
  minStock: number;
  quantity: number;
  reserved: number;
  targetType: "product" | "variant";
  variantId: string | null;
}) {
  return {
    inventoryId: params.inventoryId,
    maxStock: params.maxStock,
    minStock: params.minStock,
    quantity: params.quantity,
    reserved: params.reserved,
    targetType: params.targetType,
    variantId: params.variantId,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/products/[productId]/stock",
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
  let payload: AdminCatalogStockAdjustmentPayload;

  try {
    payload = (await request.json()) as AdminCatalogStockAdjustmentPayload;
  } catch {
    return createCatalogValidationErrorResponse([
      {
        field: "payload",
        message: "Payload JSON inválido",
      },
    ]);
  }

  const parsedPayload = parseAdminCatalogStockAdjustmentPayload(payload);

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
    const product = await db.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        inventory: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            maxStock: true,
            minStock: true,
            quantity: true,
            reserved: true,
            variantId: true,
          },
          take: 1,
          where: {
            variantId: null,
          },
        },
        name: true,
        storeId: true,
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
                maxStock: true,
                minStock: true,
                quantity: true,
                reserved: true,
                variantId: true,
              },
              take: 1,
            },
            name: true,
            stock: true,
            value: true,
          },
        },
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

    const baseInventory = product.inventory[0] ?? null;
    const targetVariant =
      parsedPayload.value.targetType === "variant"
        ? (product.variants.find(
            (variant) => variant.id === parsedPayload.value.variantId,
          ) ?? null)
        : null;

    if (parsedPayload.value.targetType === "variant" && !targetVariant) {
      return createCatalogValidationErrorResponse([
        {
          field: "variantId",
          message: "Variação informada não pertence ao produto",
        },
      ]);
    }

    const selectedInventory =
      targetVariant?.inventory[0] ?? baseInventory ?? null;
    const currentQuantity = selectedInventory?.quantity ?? 0;
    const currentReserved = selectedInventory?.reserved ?? 0;
    const nextQuantity = currentQuantity + parsedPayload.value.delta;
    const nextMinStock =
      parsedPayload.value.minStock ?? selectedInventory?.minStock ?? 0;
    const nextMaxStock =
      parsedPayload.value.maxStock ?? selectedInventory?.maxStock ?? 1_000;

    if (nextQuantity < 0) {
      return NextResponse.json(
        {
          code: "ADMIN_CATALOG_STOCK_CONFLICT",
          error: "Ajuste de estoque deixaria a quantidade negativa",
        },
        { status: 409 },
      );
    }

    if (nextQuantity < currentReserved) {
      return NextResponse.json(
        {
          code: "ADMIN_CATALOG_STOCK_CONFLICT",
          error:
            "Ajuste de estoque deixaria a quantidade abaixo do volume reservado",
        },
        { status: 409 },
      );
    }

    if (targetVariant) {
      const nextVariantStock = targetVariant.stock + parsedPayload.value.delta;

      if (nextVariantStock < 0) {
        return NextResponse.json(
          {
            code: "ADMIN_CATALOG_STOCK_CONFLICT",
            error: "Ajuste de estoque deixaria a variação com saldo negativo",
          },
          { status: 409 },
        );
      }
    }

    const updatedState = await db.$transaction(async (transaction) => {
      const inventory =
        selectedInventory ??
        (await transaction.inventory.create({
          data: {
            location: "Ajuste admin",
            maxStock: nextMaxStock,
            minStock: nextMinStock,
            productId,
            quantity: 0,
            storeId: product.storeId,
            variantId: targetVariant?.id ?? null,
          },
        }));

      const updatedInventory = await transaction.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          lastRestocked: parsedPayload.value.delta > 0 ? new Date() : undefined,
          maxStock: nextMaxStock,
          minStock: nextMinStock,
          quantity: nextQuantity,
        },
        select: {
          id: true,
          maxStock: true,
          minStock: true,
          quantity: true,
          reserved: true,
        },
      });

      if (targetVariant) {
        await transaction.productVariant.update({
          where: {
            id: targetVariant.id,
          },
          data: {
            stock: targetVariant.stock + parsedPayload.value.delta,
          },
        });
      }

      const movement = await transaction.stockMovement.create({
        data: {
          inventoryId: updatedInventory.id,
          quantity: parsedPayload.value.delta,
          reason: parsedPayload.value.reason,
          reference: parsedPayload.value.reference ?? null,
          type: StockMoveType.ADJUSTMENT,
          userId: authorization.user.id,
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      await writeAdminAuditLog({
        action: AdminAuditAction.UPDATE,
        actor: authorization.user,
        after: buildInventoryAuditSnapshot({
          inventoryId: updatedInventory.id,
          maxStock: updatedInventory.maxStock,
          minStock: updatedInventory.minStock,
          quantity: updatedInventory.quantity,
          reserved: updatedInventory.reserved,
          targetType: targetVariant ? "variant" : "product",
          variantId: targetVariant?.id ?? null,
        }),
        before: buildInventoryAuditSnapshot({
          inventoryId: selectedInventory?.id ?? null,
          maxStock: selectedInventory?.maxStock ?? nextMaxStock,
          minStock: selectedInventory?.minStock ?? nextMinStock,
          quantity: currentQuantity,
          reserved: currentReserved,
          targetType: targetVariant ? "variant" : "product",
          variantId: targetVariant?.id ?? null,
        }),
        client: transaction,
        metadata: {
          delta: parsedPayload.value.delta,
          reason: parsedPayload.value.reason,
          reference: parsedPayload.value.reference ?? null,
          route: "/api/admin/products/[productId]/stock",
        },
        resource: AdminAuditResource.INVENTORY,
        storeId: product.storeId,
        summary: `Estoque de ${targetVariant ? `${product.name} / ${targetVariant.value}` : product.name} ajustado em ${parsedPayload.value.delta}.`,
        targetId: targetVariant?.id ?? product.id,
        targetLabel: targetVariant
          ? `${product.name} / ${targetVariant.value}`
          : product.name,
      });

      return {
        inventory: updatedInventory,
        movement,
      };
    });

    return NextResponse.json({
      adjustment: {
        delta: parsedPayload.value.delta,
        targetLabel: targetVariant
          ? `${product.name} / ${targetVariant.value}`
          : product.name,
        targetType: targetVariant ? "variant" : "product",
      },
      inventory: {
        availableQuantity: Math.max(
          updatedState.inventory.quantity - updatedState.inventory.reserved,
          0,
        ),
        id: updatedState.inventory.id,
        maxStock: updatedState.inventory.maxStock,
        minStock: updatedState.inventory.minStock,
        quantity: updatedState.inventory.quantity,
        reserved: updatedState.inventory.reserved,
      },
      movement: {
        createdAt: updatedState.movement.createdAt.toISOString(),
        id: updatedState.movement.id,
        quantity: updatedState.movement.quantity,
        reason: updatedState.movement.reason,
        reference: updatedState.movement.reference,
        type: updatedState.movement.type,
        userLabel:
          updatedState.movement.user?.name?.trim() ||
          updatedState.movement.user?.email?.trim() ||
          "Operador admin",
      },
      success: true,
    });
  } catch (error) {
    logger.error("admin.products.stock_adjust_failed", {
      context: {
        productId,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao ajustar estoque do produto" },
      { status: 500 },
    );
  }
}
