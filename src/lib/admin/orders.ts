import type { Prisma, UserRole } from "@prisma/client";
import { OrderStatus } from "@prisma/client";

import type {
  AdminOrderSummary,
  AdminOrderDetail,
  AdminOrderHistoryEntry,
  AdminOrderPeriodPreset,
  AdminOrdersListFilters,
  AdminOrderStatus,
  AdminPaymentStatus,
} from "@/lib/admin/orders-contract";
import {
  ADMIN_ORDER_PERIOD_PRESETS,
  ADMIN_ORDER_STATUS_VALUES,
  ADMIN_PAYMENT_STATUS_VALUES,
} from "@/lib/admin/orders-contract";
import { buildOrderStatusHistory } from "@/lib/order-status-history";
import {
  ORDER_STATUS_TRANSITION_MATRIX,
  validateOrderStateTransition,
} from "@/lib/order-state-machine";

const ADMIN_ORDER_OPERATIONAL_TARGETS = [
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly OrderStatus[];
const ADMIN_ORDER_OPERATIONAL_TARGET_SET = new Set<OrderStatus>(
  ADMIN_ORDER_OPERATIONAL_TARGETS,
);

const ADMIN_ORDER_STATUS_VALUE_SET = new Set<string>(ADMIN_ORDER_STATUS_VALUES);
const ADMIN_PAYMENT_STATUS_VALUE_SET = new Set<string>(
  ADMIN_PAYMENT_STATUS_VALUES,
);
const ADMIN_ORDER_PERIOD_PRESET_SET = new Set<string>(
  ADMIN_ORDER_PERIOD_PRESETS,
);

const PERIOD_PRESET_DAYS: Record<AdminOrderPeriodPreset, number | null> = {
  all: null,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const ADMIN_ORDERS_INVALID_FILTERS_CODE = "ADMIN_ORDERS_INVALID_FILTERS";
export const ADMIN_ORDERS_INVALID_FILTERS_ERROR =
  "Parâmetros inválidos para pedidos administrativos";
export const ADMIN_ORDER_INVALID_ACTION_CODE = "ADMIN_ORDER_INVALID_ACTION";
export const ADMIN_ORDER_INVALID_ACTION_ERROR =
  "Ação operacional inválida para o pedido";
export const ADMIN_ORDER_STATE_CONFLICT_CODE = "ADMIN_ORDER_STATE_CONFLICT";
export const ADMIN_ORDER_STATE_CONFLICT_ERROR =
  "O pedido foi atualizado por outra operação. Recarregue os dados e tente novamente.";

type ParsedAdminOrdersFilters =
  | {
      filters: AdminOrdersListFilters;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

type RawAdminOrderBaseFields = {
  createdAt: Date;
  customerName: string;
  id: number;
  paymentStatus: AdminPaymentStatus;
  status: AdminOrderStatus;
  store: {
    id: string;
    name: string;
  };
  total: number;
  trackingCode: string | null;
};

type RawAdminOrderSummary = RawAdminOrderBaseFields & {
  items: Array<{
    productName: string;
  }>;
  _count?: {
    items: number;
  };
};

type RawAdminOrderHistoryRecord = {
  changedBy: string | null;
  createdAt: Date;
  id: string;
  notes: string | null;
  status: AdminOrderStatus;
  user: {
    role: UserRole;
  } | null;
};

type RawAdminOrderDetail = RawAdminOrderBaseFields & {
  address: {
    city: string;
    complement: string | null;
    neighborhood: string;
    number: string;
    state: string;
    street: string;
    zipCode: string;
  } | null;
  cancelReason: string | null;
  cancelledAt: Date | null;
  customerEmail: string | null;
  customerPhone: string;
  deliveredAt: Date | null;
  estimatedDelivery: Date | null;
  items: Array<{
    id: string;
    productImage: string | null;
    productName: string;
    quantity: number;
    totalPrice: number;
    unitPrice: number;
  }>;
  notes: string | null;
  payments: Array<{
    amount: number;
    failedAt: Date | null;
    id: string;
    method: string;
    paidAt: Date | null;
    status: AdminPaymentStatus;
  }>;
  shippedAt: Date | null;
  shippingMethod: "STANDARD" | "EXPRESS" | "PICKUP";
  statusHistory: RawAdminOrderHistoryRecord[];
};

function parsePositiveInt(
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

function parseOptionalString(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function maskEmail(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  const atIndex = normalizedValue.indexOf("@");

  if (atIndex <= 1) {
    return normalizedValue;
  }

  const localPart = normalizedValue.slice(0, atIndex);
  const domain = normalizedValue.slice(atIndex);
  const visiblePrefix = localPart.slice(0, 2);
  return `${visiblePrefix}${"*".repeat(Math.max(1, localPart.length - 2))}${domain}`;
}

function maskPhone(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length < 4) {
    return value;
  }

  return `*** *** ${digits.slice(-4)}`;
}

function sanitizeHistoryDescription(
  notes: string | null,
  isFallback: boolean,
): string | null {
  if (isFallback) {
    return "Historico reconstruido automaticamente a partir do estado atual.";
  }

  const normalizedNotes = notes?.trim();

  if (!normalizedNotes) {
    return null;
  }

  if (normalizedNotes.includes("source:admin_orders")) {
    return "Atualizacao operacional registrada pelo painel admin.";
  }

  if (normalizedNotes.includes("source:api_fallback")) {
    return "Historico reconstruido automaticamente a partir do estado atual.";
  }

  return normalizedNotes.slice(0, 160);
}

function resolveHistoryActorLabel(historyEntry: RawAdminOrderHistoryRecord) {
  if (historyEntry.user?.role === "ADMIN") {
    return "Operacao admin";
  }

  if (historyEntry.user?.role === "SUPER_ADMIN") {
    return "Operacao super admin";
  }

  if (historyEntry.user?.role === "STORE_ADMIN") {
    return "Operacao admin de loja";
  }

  if (historyEntry.changedBy) {
    return "Conta cliente";
  }

  return "Sistema";
}

function buildHistoryActorLabelMap(
  statusHistory: RawAdminOrderHistoryRecord[],
): Map<string, string> {
  return new Map(
    statusHistory.map((historyEntry) => [
      historyEntry.id,
      resolveHistoryActorLabel(historyEntry),
    ]),
  );
}

function normalizeHistoryEntries(
  order: Pick<RawAdminOrderDetail, "id" | "status" | "statusHistory"> & {
    updatedAt: Date;
    userId?: string | null;
  },
): AdminOrderHistoryEntry[] {
  const actorLabelByHistoryId = buildHistoryActorLabelMap(order.statusHistory);

  return buildOrderStatusHistory({
    orderId: order.id,
    currentStatus: order.status,
    fallbackChangedBy: order.userId ?? null,
    statusHistory: order.statusHistory,
    updatedAt: order.updatedAt,
  }).map((historyEntry) => ({
    actorLabel:
      actorLabelByHistoryId.get(historyEntry.id) ??
      (historyEntry.isFallback ? "Sistema" : "Atualizacao registrada"),
    createdAt: historyEntry.createdAt,
    description: sanitizeHistoryDescription(
      historyEntry.notes,
      historyEntry.isFallback,
    ),
    id: historyEntry.id,
    isFallback: historyEntry.isFallback,
    status: historyEntry.status,
  }));
}

function buildOrderCode(orderId: number) {
  return `ORD-${String(orderId).padStart(5, "0")}`;
}

function buildSerializedOrderSummary(params: {
  createdAt: Date;
  customerName: string;
  id: number;
  itemCount: number;
  itemPreview: string[];
  paymentStatus: AdminPaymentStatus;
  status: AdminOrderStatus;
  store: {
    id: string;
    name: string;
  };
  total: number;
  trackingCode: string | null;
}): AdminOrderSummary {
  return {
    code: buildOrderCode(params.id),
    createdAt: params.createdAt.toISOString(),
    customerName: params.customerName,
    id: params.id,
    itemCount: params.itemCount,
    itemPreview: params.itemPreview,
    paymentStatus: params.paymentStatus,
    status: params.status,
    store: params.store,
    total: params.total,
    trackingCode: params.trackingCode,
  };
}

function buildCreatedAtRange(period: AdminOrderPeriodPreset): Date | null {
  const days = PERIOD_PRESET_DAYS[period];

  if (days === null) {
    return null;
  }

  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function parseAdminOrdersFilters(
  searchParams: URLSearchParams,
): ParsedAdminOrdersFilters {
  const rawStatus = searchParams.get("status");
  const rawPaymentStatus = searchParams.get("paymentStatus");
  const rawPeriod = searchParams.get("period");
  const status = rawStatus?.trim().toUpperCase() ?? "ALL";
  const paymentStatus = rawPaymentStatus?.trim().toUpperCase() ?? "ALL";
  const period = rawPeriod?.trim().toLowerCase() ?? "30d";

  if (status !== "ALL" && !ADMIN_ORDER_STATUS_VALUE_SET.has(status)) {
    return {
      error: "status",
      ok: false,
    };
  }

  if (
    paymentStatus !== "ALL" &&
    !ADMIN_PAYMENT_STATUS_VALUE_SET.has(paymentStatus)
  ) {
    return {
      error: "paymentStatus",
      ok: false,
    };
  }

  if (!ADMIN_ORDER_PERIOD_PRESET_SET.has(period)) {
    return {
      error: "period",
      ok: false,
    };
  }

  return {
    filters: {
      limit: parsePositiveInt(searchParams.get("limit"), 12, 50),
      page: parsePositiveInt(searchParams.get("page"), 1, 10_000),
      paymentStatus: paymentStatus as AdminOrdersListFilters["paymentStatus"],
      period: period as AdminOrderPeriodPreset,
      query: parseOptionalString(searchParams.get("query")) ?? "",
      status: status as AdminOrdersListFilters["status"],
      storeId: parseOptionalString(searchParams.get("storeId")),
    },
    ok: true,
  };
}

export function buildAdminOrdersWhereInput(params: {
  filters: AdminOrdersListFilters;
  storeIds: string[] | null;
}): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (params.filters.storeId) {
    where.storeId = params.filters.storeId;
  } else if (params.storeIds) {
    where.storeId = {
      in: params.storeIds,
    };
  }

  if (params.filters.status !== "ALL") {
    where.status = params.filters.status;
  }

  if (params.filters.paymentStatus !== "ALL") {
    where.paymentStatus = params.filters.paymentStatus;
  }

  const createdAtFrom = buildCreatedAtRange(params.filters.period);

  if (createdAtFrom) {
    where.createdAt = {
      gte: createdAtFrom,
    };
  }

  const normalizedQuery = params.filters.query.trim();

  if (normalizedQuery.length > 0) {
    const numericOrderId = Number.parseInt(
      normalizedQuery.replace(/\D/g, ""),
      10,
    );
    const searchClauses: Prisma.OrderWhereInput[] = [
      {
        customerName: {
          contains: normalizedQuery,
          mode: "insensitive",
        },
      },
      {
        trackingCode: {
          contains: normalizedQuery,
          mode: "insensitive",
        },
      },
      {
        store: {
          name: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        },
      },
    ];

    if (Number.isFinite(numericOrderId) && numericOrderId > 0) {
      searchClauses.unshift({
        id: numericOrderId,
      });
    }

    where.OR = searchClauses;
  }

  return where;
}

export function buildAdminOrdersListSelect() {
  return {
    _count: {
      select: {
        items: true,
      },
    },
    createdAt: true,
    customerName: true,
    id: true,
    items: {
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        productName: true,
      },
      take: 2,
    },
    paymentStatus: true,
    status: true,
    store: {
      select: {
        id: true,
        name: true,
      },
    },
    total: true,
    trackingCode: true,
  } satisfies Prisma.OrderSelect;
}

export function buildAdminOrderDetailsInclude() {
  return {
    address: {
      select: {
        city: true,
        complement: true,
        neighborhood: true,
        number: true,
        state: true,
        street: true,
        zipCode: true,
      },
    },
    items: {
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        productImage: true,
        productName: true,
        quantity: true,
        totalPrice: true,
        unitPrice: true,
      },
    },
    payments: {
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        amount: true,
        failedAt: true,
        id: true,
        method: true,
        paidAt: true,
        status: true,
      },
    },
    statusHistory: {
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        changedBy: true,
        createdAt: true,
        id: true,
        notes: true,
        status: true,
        user: {
          select: {
            role: true,
          },
        },
      },
    },
    store: {
      select: {
        id: true,
        name: true,
      },
    },
  } satisfies Prisma.OrderInclude;
}

export function serializeAdminOrderSummary(
  order: RawAdminOrderSummary,
): AdminOrderSummary {
  return buildSerializedOrderSummary({
    createdAt: order.createdAt,
    customerName: order.customerName,
    id: order.id,
    itemCount: order._count?.items ?? order.items.length,
    itemPreview: order.items.map((item) => item.productName),
    paymentStatus: order.paymentStatus,
    status: order.status,
    store: order.store,
    total: order.total,
    trackingCode: order.trackingCode,
  });
}

export function serializeAdminOrderListItem(order: RawAdminOrderSummary) {
  const summary = serializeAdminOrderSummary(order);

  return {
    code: summary.code,
    createdAt: summary.createdAt,
    customerName: summary.customerName,
    id: summary.id,
    itemCount: summary.itemCount,
    itemPreview: summary.itemPreview,
    paymentStatus: summary.paymentStatus,
    status: summary.status,
    store: summary.store,
    total: summary.total,
    trackingCode: summary.trackingCode,
  };
}

export function getAllowedAdminOrderStatusTargets(
  currentStatus: AdminOrderStatus,
): AdminOrderStatus[] {
  const allowedTargets = ORDER_STATUS_TRANSITION_MATRIX[currentStatus] ?? [];

  return allowedTargets.filter((status): status is AdminOrderStatus =>
    ADMIN_ORDER_OPERATIONAL_TARGET_SET.has(status),
  );
}

export function serializeAdminOrderDetail(
  order: RawAdminOrderDetail & {
    updatedAt: Date;
    userId?: string | null;
  },
): AdminOrderDetail {
  const summary = buildSerializedOrderSummary({
    createdAt: order.createdAt,
    customerName: order.customerName,
    id: order.id,
    itemCount: order.items.length,
    itemPreview: order.items.map((item) => item.productName),
    paymentStatus: order.paymentStatus,
    status: order.status,
    store: order.store,
    total: order.total,
    trackingCode: order.trackingCode,
  });
  const statusOptions = getAllowedAdminOrderStatusTargets(order.status);

  return {
    ...summary,
    address: order.address,
    availableActions: {
      canUpdateStatus: statusOptions.length > 0,
      statusOptions,
    },
    cancelReason: order.cancelReason,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    customer: {
      emailMasked: maskEmail(order.customerEmail),
      name: order.customerName,
      phoneMasked: maskPhone(order.customerPhone),
    },
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
    history: normalizeHistoryEntries(order),
    items: order.items.map((item) => ({
      id: item.id,
      productImage: item.productImage || null,
      productName: item.productName,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      unitPrice: item.unitPrice,
    })),
    notes: order.notes,
    payments: order.payments.map((payment) => ({
      amount: payment.amount,
      failedAt: payment.failedAt?.toISOString() ?? null,
      id: payment.id,
      method: payment.method,
      paidAt: payment.paidAt?.toISOString() ?? null,
      status: payment.status,
    })),
    shippedAt: order.shippedAt?.toISOString() ?? null,
    shippingMethod: order.shippingMethod,
  };
}

export function isAdminOperationalOrderStatus(
  value: unknown,
): value is AdminOrderStatus {
  return (
    typeof value === "string" &&
    ADMIN_ORDER_STATUS_VALUE_SET.has(value) &&
    ADMIN_ORDER_OPERATIONAL_TARGET_SET.has(value as OrderStatus)
  );
}

export function validateAdminOrderStatusUpdate(params: {
  currentPaymentStatus: AdminPaymentStatus;
  currentStatus: AdminOrderStatus;
  nextStatus: AdminOrderStatus;
}) {
  if (
    !getAllowedAdminOrderStatusTargets(params.currentStatus).includes(
      params.nextStatus,
    )
  ) {
    return {
      ok: false as const,
      reason: ADMIN_ORDER_INVALID_ACTION_ERROR,
    };
  }

  const validation = validateOrderStateTransition({
    from: {
      orderStatus: params.currentStatus,
      paymentStatus: params.currentPaymentStatus,
    },
    to: {
      orderStatus: params.nextStatus,
      paymentStatus: params.currentPaymentStatus,
    },
  });

  if (!validation.valid || validation.isNoop) {
    return {
      ok: false as const,
      reason: validation.valid
        ? ADMIN_ORDER_INVALID_ACTION_ERROR
        : validation.reason,
    };
  }

  return {
    ok: true as const,
  };
}

export function buildAdminOrderStatusHistoryNote(params: {
  fromStatus: AdminOrderStatus;
  nextStatus: AdminOrderStatus;
}) {
  return `source:admin_orders; from:${params.fromStatus}; to:${params.nextStatus}`;
}

export function buildAdminOrderStatusUpdateData(params: {
  currentCancelReason: string | null;
  currentCancelledAt: Date | null;
  currentDeliveredAt: Date | null;
  currentShippedAt: Date | null;
  nextStatus: AdminOrderStatus;
  now: Date;
}): Prisma.OrderUpdateManyMutationInput {
  return {
    cancelReason:
      params.nextStatus === "CANCELLED"
        ? (params.currentCancelReason ??
          "Cancelado operacionalmente no painel admin")
        : params.currentCancelReason,
    cancelledAt:
      params.nextStatus === "CANCELLED"
        ? (params.currentCancelledAt ?? params.now)
        : params.currentCancelledAt,
    deliveredAt:
      params.nextStatus === "DELIVERED"
        ? (params.currentDeliveredAt ?? params.now)
        : params.currentDeliveredAt,
    shippedAt:
      params.nextStatus === "SHIPPED"
        ? (params.currentShippedAt ?? params.now)
        : params.currentShippedAt,
    status: params.nextStatus,
  };
}

export function normalizeAdminOrderId(value: string): number | null {
  const normalizedValue = value.trim();

  if (!/^\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
}
