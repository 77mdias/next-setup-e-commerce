import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

import {
  getAdminStoreScopeStoreIds,
  type AdminStoreScope,
} from "@/lib/admin-store-scope";
import { db } from "@/lib/prisma";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const ADMIN_DASHBOARD_WINDOW_PRESETS = {
  "7d": {
    days: 7,
    label: "Últimos 7 dias",
  },
  "30d": {
    days: 30,
    label: "Últimos 30 dias",
  },
  "90d": {
    days: 90,
    label: "Últimos 90 dias",
  },
} as const;

export const DEFAULT_ADMIN_DASHBOARD_WINDOW = "7d";
export const DEFAULT_ADMIN_DASHBOARD_LOW_STOCK_LIMIT = 5;
export const MAX_ADMIN_DASHBOARD_LOW_STOCK_LIMIT = 20;

type OrderStatusCounts = Record<OrderStatus, number>;
type PaymentStatusCounts = Record<PaymentStatus, number>;

export type AdminDashboardWindowPreset =
  keyof typeof ADMIN_DASHBOARD_WINDOW_PRESETS;

export type AdminDashboardMetricChange = {
  absolute: number;
  percentage: number | null;
  previous: number;
  trend: "up" | "down" | "flat";
};

export type AdminDashboardLowStockItem = {
  availableQuantity: number;
  minStock: number;
  productId: string;
  productName: string;
  reserved: number;
  storeId: string;
  storeName: string;
};

export type AdminDashboardMetricsResponse = {
  filters: {
    lowStockLimit: number;
    scope: {
      appliedStoreIds: string[] | null;
      kind: AdminStoreScope["kind"];
    };
    storeId: string | null;
    window: {
      days: number;
      from: string;
      key: AdminDashboardWindowPreset;
      label: string;
      previousFrom: string;
      previousTo: string;
      to: string;
    };
  };
  generatedAt: string;
  kpis: {
    lowStock: {
      items: AdminDashboardLowStockItem[];
      products: number;
    };
    orders: {
      byStatus: OrderStatusCounts;
      comparison: AdminDashboardMetricChange;
      total: number;
    };
    paymentApproval: {
      approved: number;
      byStatus: PaymentStatusCounts;
      comparison: AdminDashboardMetricChange;
      rate: number;
      total: number;
    };
    revenue: {
      comparison: AdminDashboardMetricChange;
      currency: "BRL";
      gross: number;
      paidOrders: number;
    };
  };
  success: true;
};

export type AdminDashboardFilters = {
  lowStockLimit: number;
  storeId: string | null;
  window: AdminDashboardWindowPreset;
};

type DashboardFilterParseResult =
  | {
      filters: AdminDashboardFilters;
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

type AdminDashboardMetricsParams = AdminDashboardFilters & {
  now?: Date;
  storeScope: AdminStoreScope;
};

type DashboardWindowRange = {
  currentFrom: Date;
  currentTo: Date;
  days: number;
  key: AdminDashboardWindowPreset;
  label: string;
  previousFrom: Date;
  previousTo: Date;
};

const ORDER_STATUSES = Object.values(OrderStatus);
const PAYMENT_STATUSES = Object.values(PaymentStatus);

function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeStoreId(value: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number,
): number | null {
  if (value === null) {
    return fallback;
  }

  if (!/^\d+$/.test(value.trim())) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (parsedValue < 1 || parsedValue > max) {
    return null;
  }

  return parsedValue;
}

function buildWindowRange(
  key: AdminDashboardWindowPreset,
  now: Date,
): DashboardWindowRange {
  const preset = ADMIN_DASHBOARD_WINDOW_PRESETS[key];
  const currentTo = new Date(now);
  const currentFrom = new Date(currentTo.getTime() - preset.days * DAY_IN_MS);
  const previousTo = new Date(currentFrom);
  const previousFrom = new Date(previousTo.getTime() - preset.days * DAY_IN_MS);

  return {
    currentFrom,
    currentTo,
    days: preset.days,
    key,
    label: preset.label,
    previousFrom,
    previousTo,
  };
}

function buildMetricChange(
  current: number,
  previous: number,
  precision: number,
): AdminDashboardMetricChange {
  const absolute = roundTo(current - previous, precision);

  if (absolute === 0) {
    return {
      absolute: 0,
      percentage: 0,
      previous: roundTo(previous, precision),
      trend: "flat",
    };
  }

  if (previous === 0) {
    return {
      absolute,
      percentage: null,
      previous: 0,
      trend: absolute > 0 ? "up" : "down",
    };
  }

  return {
    absolute,
    percentage: roundTo(((current - previous) / previous) * 100, 2),
    previous: roundTo(previous, precision),
    trend: absolute > 0 ? "up" : "down",
  };
}

function buildStatusCountRecord<TStatus extends string>(
  statuses: readonly TStatus[],
  groups: ReadonlyArray<{
    _count: {
      _all: number;
    };
    status: TStatus;
  }>,
): Record<TStatus, number> {
  const counts = Object.fromEntries(
    statuses.map((status) => [status, 0]),
  ) as Record<TStatus, number>;

  for (const group of groups) {
    counts[group.status] = group._count._all;
  }

  return counts;
}

function sumValues(record: Record<string, number>) {
  return Object.values(record).reduce((total, value) => total + value, 0);
}

function buildOrderWhere(params: {
  authorizedStoreIds: string[] | null;
  from: Date;
  storeId: string | null;
  to: Date;
}): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    createdAt: {
      gte: params.from,
      lt: params.to,
    },
  };

  if (params.storeId) {
    where.storeId = params.storeId;
  } else if (params.authorizedStoreIds) {
    where.storeId = {
      in: params.authorizedStoreIds,
    };
  }

  return where;
}

function buildInventoryWhere(params: {
  authorizedStoreIds: string[] | null;
  storeId: string | null;
}): Prisma.InventoryWhereInput {
  const where: Prisma.InventoryWhereInput = {
    minStock: {
      gt: 0,
    },
    product: {
      isActive: true,
    },
  };

  if (params.storeId) {
    where.storeId = params.storeId;
  } else if (params.authorizedStoreIds) {
    where.storeId = {
      in: params.authorizedStoreIds,
    };
  }

  return where;
}

function buildEmptyDashboardMetrics(params: {
  filters: AdminDashboardFilters;
  now: Date;
  storeScope: AdminStoreScope;
}): AdminDashboardMetricsResponse {
  const windowRange = buildWindowRange(params.filters.window, params.now);

  return {
    success: true,
    generatedAt: params.now.toISOString(),
    filters: {
      lowStockLimit: params.filters.lowStockLimit,
      scope: {
        appliedStoreIds: [],
        kind: params.storeScope.kind,
      },
      storeId: params.filters.storeId,
      window: {
        days: windowRange.days,
        from: windowRange.currentFrom.toISOString(),
        key: windowRange.key,
        label: windowRange.label,
        previousFrom: windowRange.previousFrom.toISOString(),
        previousTo: windowRange.previousTo.toISOString(),
        to: windowRange.currentTo.toISOString(),
      },
    },
    kpis: {
      lowStock: {
        items: [],
        products: 0,
      },
      orders: {
        byStatus: buildStatusCountRecord(ORDER_STATUSES, []),
        comparison: buildMetricChange(0, 0, 0),
        total: 0,
      },
      paymentApproval: {
        approved: 0,
        byStatus: buildStatusCountRecord(PAYMENT_STATUSES, []),
        comparison: buildMetricChange(0, 0, 4),
        rate: 0,
        total: 0,
      },
      revenue: {
        comparison: buildMetricChange(0, 0, 2),
        currency: "BRL",
        gross: 0,
        paidOrders: 0,
      },
    },
  };
}

export function parseAdminDashboardFilters(
  searchParams: URLSearchParams,
): DashboardFilterParseResult {
  const rawWindow = searchParams.get("window");
  const rawLowStockLimit = searchParams.get("lowStockLimit");
  const window = rawWindow ?? DEFAULT_ADMIN_DASHBOARD_WINDOW;

  if (!(window in ADMIN_DASHBOARD_WINDOW_PRESETS)) {
    return {
      error: "window",
      ok: false,
    };
  }

  const lowStockLimit = parsePositiveInt(
    rawLowStockLimit,
    DEFAULT_ADMIN_DASHBOARD_LOW_STOCK_LIMIT,
    MAX_ADMIN_DASHBOARD_LOW_STOCK_LIMIT,
  );

  if (lowStockLimit === null) {
    return {
      error: "lowStockLimit",
      ok: false,
    };
  }

  return {
    filters: {
      lowStockLimit,
      storeId: normalizeStoreId(searchParams.get("storeId")),
      window: window as AdminDashboardWindowPreset,
    },
    ok: true,
  };
}

export async function getAdminDashboardMetrics(
  params: AdminDashboardMetricsParams,
): Promise<AdminDashboardMetricsResponse> {
  const now = params.now ?? new Date();
  const authorizedStoreIds = getAdminStoreScopeStoreIds(params.storeScope);
  const windowRange = buildWindowRange(params.window, now);
  const appliedStoreIds = params.storeId
    ? [params.storeId]
    : (authorizedStoreIds ?? null);

  if (authorizedStoreIds && authorizedStoreIds.length === 0) {
    return buildEmptyDashboardMetrics({
      filters: {
        lowStockLimit: params.lowStockLimit,
        storeId: params.storeId,
        window: params.window,
      },
      now,
      storeScope: params.storeScope,
    });
  }

  const currentOrderWhere = buildOrderWhere({
    authorizedStoreIds,
    from: windowRange.currentFrom,
    storeId: params.storeId,
    to: windowRange.currentTo,
  });
  const previousOrderWhere = buildOrderWhere({
    authorizedStoreIds,
    from: windowRange.previousFrom,
    storeId: params.storeId,
    to: windowRange.previousTo,
  });
  const inventoryWhere = buildInventoryWhere({
    authorizedStoreIds,
    storeId: params.storeId,
  });

  // AIDEV-CRITICAL: o contrato do dashboard precisa manter fórmula única de
  // agregação no backend para evitar divergência de KPI entre frontend e API.
  const [
    currentOrderGroups,
    previousOrderGroups,
    currentPaymentGroups,
    previousPaymentGroups,
    currentRevenue,
    previousRevenue,
    inventoryRows,
  ] = await Promise.all([
    db.order.groupBy({
      by: ["status"],
      where: currentOrderWhere,
      _count: {
        _all: true,
      },
    }),
    db.order.groupBy({
      by: ["status"],
      where: previousOrderWhere,
      _count: {
        _all: true,
      },
    }),
    db.order.groupBy({
      by: ["paymentStatus"],
      where: currentOrderWhere,
      _count: {
        _all: true,
      },
    }),
    db.order.groupBy({
      by: ["paymentStatus"],
      where: previousOrderWhere,
      _count: {
        _all: true,
      },
    }),
    db.order.aggregate({
      where: {
        ...currentOrderWhere,
        paymentStatus: "PAID",
      },
      _count: {
        _all: true,
      },
      _sum: {
        total: true,
      },
    }),
    db.order.aggregate({
      where: {
        ...previousOrderWhere,
        paymentStatus: "PAID",
      },
      _count: {
        _all: true,
      },
      _sum: {
        total: true,
      },
    }),
    db.inventory.findMany({
      where: inventoryWhere,
      select: {
        minStock: true,
        productId: true,
        quantity: true,
        reserved: true,
        storeId: true,
        product: {
          select: {
            name: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const currentOrderCounts = buildStatusCountRecord(
    ORDER_STATUSES,
    currentOrderGroups,
  );
  const previousOrderCounts = buildStatusCountRecord(
    ORDER_STATUSES,
    previousOrderGroups,
  );
  const currentPaymentCounts = buildStatusCountRecord(
    PAYMENT_STATUSES,
    currentPaymentGroups.map((group) => ({
      _count: group._count,
      status: group.paymentStatus,
    })),
  );
  const previousPaymentCounts = buildStatusCountRecord(
    PAYMENT_STATUSES,
    previousPaymentGroups.map((group) => ({
      _count: group._count,
      status: group.paymentStatus,
    })),
  );

  const currentOrdersTotal = sumValues(currentOrderCounts);
  const previousOrdersTotal = sumValues(previousOrderCounts);
  const currentPaymentTotal = sumValues(currentPaymentCounts);
  const previousPaymentTotal = sumValues(previousPaymentCounts);
  const currentApprovedPayments = currentPaymentCounts.PAID;
  const previousApprovedPayments = previousPaymentCounts.PAID;
  const currentApprovalRate =
    currentPaymentTotal > 0
      ? roundTo(currentApprovedPayments / currentPaymentTotal, 4)
      : 0;
  const previousApprovalRate =
    previousPaymentTotal > 0
      ? roundTo(previousApprovedPayments / previousPaymentTotal, 4)
      : 0;
  const currentGrossRevenue = roundTo(currentRevenue._sum.total ?? 0, 2);
  const previousGrossRevenue = roundTo(previousRevenue._sum.total ?? 0, 2);

  const lowStockByProduct = new Map<string, AdminDashboardLowStockItem>();

  for (const inventoryRow of inventoryRows) {
    const availableQuantity = inventoryRow.quantity - inventoryRow.reserved;

    if (availableQuantity > inventoryRow.minStock) {
      continue;
    }

    const currentItem = lowStockByProduct.get(inventoryRow.productId);
    const nextItem: AdminDashboardLowStockItem = {
      availableQuantity,
      minStock: inventoryRow.minStock,
      productId: inventoryRow.productId,
      productName: inventoryRow.product.name,
      reserved: inventoryRow.reserved,
      storeId: inventoryRow.storeId,
      storeName: inventoryRow.store.name,
    };

    if (
      !currentItem ||
      nextItem.availableQuantity < currentItem.availableQuantity
    ) {
      lowStockByProduct.set(inventoryRow.productId, nextItem);
    }
  }

  const lowStockItems = [...lowStockByProduct.values()]
    .sort((left, right) => {
      if (left.availableQuantity !== right.availableQuantity) {
        return left.availableQuantity - right.availableQuantity;
      }

      return left.productName.localeCompare(right.productName, "pt-BR");
    })
    .slice(0, params.lowStockLimit);

  return {
    success: true,
    generatedAt: now.toISOString(),
    filters: {
      lowStockLimit: params.lowStockLimit,
      scope: {
        appliedStoreIds,
        kind: params.storeScope.kind,
      },
      storeId: params.storeId,
      window: {
        days: windowRange.days,
        from: windowRange.currentFrom.toISOString(),
        key: windowRange.key,
        label: windowRange.label,
        previousFrom: windowRange.previousFrom.toISOString(),
        previousTo: windowRange.previousTo.toISOString(),
        to: windowRange.currentTo.toISOString(),
      },
    },
    kpis: {
      lowStock: {
        items: lowStockItems,
        products: lowStockByProduct.size,
      },
      orders: {
        byStatus: currentOrderCounts,
        comparison: buildMetricChange(
          currentOrdersTotal,
          previousOrdersTotal,
          0,
        ),
        total: currentOrdersTotal,
      },
      paymentApproval: {
        approved: currentApprovedPayments,
        byStatus: currentPaymentCounts,
        comparison: buildMetricChange(
          currentApprovalRate,
          previousApprovalRate,
          4,
        ),
        rate: currentApprovalRate,
        total: currentPaymentTotal,
      },
      revenue: {
        comparison: buildMetricChange(
          currentGrossRevenue,
          previousGrossRevenue,
          2,
        ),
        currency: "BRL",
        gross: currentGrossRevenue,
        paidOrders: currentRevenue._count._all,
      },
    },
  };
}
