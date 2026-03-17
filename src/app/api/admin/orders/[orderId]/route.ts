import { AdminAuditAction, AdminAuditResource } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import type {
  AdminOrderDetailResponse,
  AdminOrderUpdatePayload,
} from "@/lib/admin/orders-contract";
import {
  ADMIN_ORDER_INVALID_ACTION_CODE,
  ADMIN_ORDER_INVALID_ACTION_ERROR,
  ADMIN_ORDER_STATE_CONFLICT_CODE,
  ADMIN_ORDER_STATE_CONFLICT_ERROR,
  buildAdminOrderDetailsInclude,
  buildAdminOrderStatusHistoryNote,
  buildAdminOrderStatusUpdateData,
  isAdminOperationalOrderStatus,
  normalizeAdminOrderId,
  serializeAdminOrderDetail,
  validateAdminOrderStatusUpdate,
} from "@/lib/admin/orders";
import { writeAdminAuditLog } from "@/lib/audit-log";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
} from "@/lib/rbac";

const ORDER_NOT_FOUND_ERROR = "Pedido administrativo nao encontrado";

class AdminOrderStateConflictError extends Error {
  constructor() {
    super(ADMIN_ORDER_STATE_CONFLICT_ERROR);
    this.name = "AdminOrderStateConflictError";
  }
}

function buildOrderAuditSnapshot(order: {
  cancelReason: string | null;
  cancelledAt: Date | null;
  deliveredAt: Date | null;
  paymentStatus: string;
  shippedAt: Date | null;
  status: string;
  store: {
    id: string;
  };
}) {
  return {
    cancelReason: order.cancelReason,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    paymentStatus: order.paymentStatus,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    status: order.status,
    storeId: order.store.id,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/orders/[orderId]",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "read",
    logger: requestLogger,
    request,
    resource: "orders",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;
  const { orderId: rawOrderId } = await params;
  const orderId = normalizeAdminOrderId(rawOrderId);

  if (!orderId) {
    return NextResponse.json(
      { error: "Identificador de pedido invalido" },
      { status: 400 },
    );
  }

  try {
    const order = await db.order.findUnique({
      include: buildAdminOrderDetailsInclude(),
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: ORDER_NOT_FOUND_ERROR },
        { status: 404 },
      );
    }

    const storeAccess = authorizeAdminStoreScopeAccess({
      authorization,
      resource: "orders",
      resourceId: order.id,
      storeId: order.store.id,
    });

    if (!storeAccess.authorized) {
      return storeAccess.response;
    }

    return NextResponse.json<AdminOrderDetailResponse>({
      order: serializeAdminOrderDetail(order),
      success: true,
    });
  } catch (error) {
    logger.error("admin.orders.detail_failed", {
      context: {
        orderId,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao carregar pedido administrativo" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/orders/[orderId]",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "update",
    logger: requestLogger,
    request,
    resource: "orders",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;
  const { orderId: rawOrderId } = await params;
  const orderId = normalizeAdminOrderId(rawOrderId);

  if (!orderId) {
    return NextResponse.json(
      { error: "Identificador de pedido invalido" },
      { status: 400 },
    );
  }

  let payload: AdminOrderUpdatePayload;

  try {
    payload = (await request.json()) as AdminOrderUpdatePayload;
  } catch {
    return NextResponse.json(
      { error: "Payload JSON invalido" },
      { status: 400 },
    );
  }

  if (!isAdminOperationalOrderStatus(payload.nextStatus)) {
    return NextResponse.json(
      {
        code: ADMIN_ORDER_INVALID_ACTION_CODE,
        error: ADMIN_ORDER_INVALID_ACTION_ERROR,
      },
      { status: 400 },
    );
  }

  const nextStatus = payload.nextStatus;

  try {
    const currentOrder = await db.order.findUnique({
      select: {
        cancelReason: true,
        cancelledAt: true,
        deliveredAt: true,
        id: true,
        paymentStatus: true,
        shippedAt: true,
        status: true,
        store: {
          select: {
            id: true,
          },
        },
      },
      where: {
        id: orderId,
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: ORDER_NOT_FOUND_ERROR },
        { status: 404 },
      );
    }

    const storeAccess = authorizeAdminStoreScopeAccess({
      authorization,
      resource: "orders",
      resourceId: currentOrder.id,
      storeId: currentOrder.store.id,
    });

    if (!storeAccess.authorized) {
      return storeAccess.response;
    }

    const validation = validateAdminOrderStatusUpdate({
      currentPaymentStatus: currentOrder.paymentStatus,
      currentStatus: currentOrder.status,
      nextStatus,
    });

    if (!validation.ok) {
      return NextResponse.json(
        {
          code: ADMIN_ORDER_INVALID_ACTION_CODE,
          error: validation.reason,
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const updatedOrder = await db.$transaction(async (transaction) => {
      const updatedRows = await transaction.order.updateMany({
        data: buildAdminOrderStatusUpdateData({
          currentCancelReason: currentOrder.cancelReason,
          currentCancelledAt: currentOrder.cancelledAt,
          currentDeliveredAt: currentOrder.deliveredAt,
          currentShippedAt: currentOrder.shippedAt,
          nextStatus,
          now,
        }),
        where: {
          id: currentOrder.id,
          paymentStatus: currentOrder.paymentStatus,
          status: currentOrder.status,
        },
      });

      if (updatedRows.count !== 1) {
        throw new AdminOrderStateConflictError();
      }

      await transaction.orderStatusHistory.create({
        data: {
          changedBy: authorization.user.id,
          notes: buildAdminOrderStatusHistoryNote({
            fromStatus: currentOrder.status,
            nextStatus,
          }),
          orderId: currentOrder.id,
          status: nextStatus,
        },
      });

      await writeAdminAuditLog({
        action: AdminAuditAction.UPDATE,
        actor: authorization.user,
        after: buildOrderAuditSnapshot({
          cancelReason:
            nextStatus === "CANCELLED"
              ? (currentOrder.cancelReason ??
                "Cancelado operacionalmente no painel admin")
              : currentOrder.cancelReason,
          cancelledAt:
            nextStatus === "CANCELLED" ? now : currentOrder.cancelledAt,
          deliveredAt:
            nextStatus === "DELIVERED" ? now : currentOrder.deliveredAt,
          paymentStatus: currentOrder.paymentStatus,
          shippedAt: nextStatus === "SHIPPED" ? now : currentOrder.shippedAt,
          status: nextStatus,
          store: currentOrder.store,
        }),
        before: buildOrderAuditSnapshot(currentOrder),
        client: transaction,
        metadata: {
          route: "/api/admin/orders/[orderId]",
        },
        resource: AdminAuditResource.ORDER,
        storeId: currentOrder.store.id,
        summary: `Pedido ORD-${String(currentOrder.id).padStart(5, "0")} atualizado de ${currentOrder.status} para ${nextStatus}.`,
        targetId: currentOrder.id,
        targetLabel: `Pedido ORD-${String(currentOrder.id).padStart(5, "0")}`,
      });

      return transaction.order.findUnique({
        include: buildAdminOrderDetailsInclude(),
        where: {
          id: currentOrder.id,
        },
      });
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: ORDER_NOT_FOUND_ERROR },
        { status: 404 },
      );
    }

    logger.info("admin.orders.status_updated", {
      context: {
        orderId,
      },
      data: {
        fromStatus: currentOrder.status,
        nextStatus,
        storeId: currentOrder.store.id,
      },
    });

    return NextResponse.json<AdminOrderDetailResponse>({
      order: serializeAdminOrderDetail(updatedOrder),
      success: true,
    });
  } catch (error) {
    if (error instanceof AdminOrderStateConflictError) {
      return NextResponse.json(
        {
          code: ADMIN_ORDER_STATE_CONFLICT_CODE,
          error: ADMIN_ORDER_STATE_CONFLICT_ERROR,
        },
        { status: 409 },
      );
    }

    logger.error("admin.orders.status_update_failed", {
      context: {
        orderId,
      },
      data: {
        nextStatus,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao atualizar pedido administrativo" },
      { status: 500 },
    );
  }
}
