import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminAccess, mockDb } = vi.hoisted(() => ({
  mockRequireAdminAccess: vi.fn(),
  mockDb: {
    inventory: {
      findMany: vi.fn(),
    },
    order: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { GET } from "@/app/api/admin/dashboard/route";

function createRequest(search = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/dashboard${search}`, {
    method: "GET",
  });
}

describe("GET /api/admin/dashboard integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));

    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        adminStoreScope: {
          kind: "stores",
          storeIds: ["store-1"],
        },
        id: "store-admin-1",
        role: "STORE_ADMIN",
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 401 when there is no authenticated admin session", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: false,
      status: 401,
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "ADMIN_AUTH_REQUIRED",
      error: "Usuário não autenticado",
    });
    expect(mockDb.order.groupBy).not.toHaveBeenCalled();
    expect(mockDb.inventory.findMany).not.toHaveBeenCalled();
  });

  it("returns 400 when dashboard filters are invalid", async () => {
    const response = await GET(createRequest("?window=365d"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: "ADMIN_DASHBOARD_INVALID_FILTERS",
      error: "Parâmetros inválidos para métricas administrativas",
    });
    expect(mockDb.order.groupBy).not.toHaveBeenCalled();
    expect(mockDb.inventory.findMany).not.toHaveBeenCalled();
  });

  it("returns scoped dashboard KPIs with stable shape for store admins", async () => {
    mockDb.order.groupBy
      .mockResolvedValueOnce([
        { _count: { _all: 1 }, status: "PENDING" },
        { _count: { _all: 3 }, status: "PAID" },
        { _count: { _all: 2 }, status: "SHIPPED" },
      ])
      .mockResolvedValueOnce([
        { _count: { _all: 1 }, status: "PENDING" },
        { _count: { _all: 1 }, status: "PAID" },
        { _count: { _all: 1 }, status: "FAILED" },
      ])
      .mockResolvedValueOnce([
        { _count: { _all: 1 }, paymentStatus: "PENDING" },
        { _count: { _all: 4 }, paymentStatus: "PAID" },
        { _count: { _all: 1 }, paymentStatus: "FAILED" },
      ])
      .mockResolvedValueOnce([
        { _count: { _all: 1 }, paymentStatus: "PENDING" },
        { _count: { _all: 1 }, paymentStatus: "PAID" },
        { _count: { _all: 1 }, paymentStatus: "FAILED" },
      ]);
    mockDb.order.aggregate
      .mockResolvedValueOnce({
        _count: { _all: 4 },
        _sum: { total: 1250.5 },
      })
      .mockResolvedValueOnce({
        _count: { _all: 2 },
        _sum: { total: 500 },
      });
    mockDb.inventory.findMany.mockResolvedValue([
      {
        minStock: 5,
        product: {
          name: "Mouse Gamer",
        },
        productId: "product-1",
        quantity: 4,
        reserved: 3,
        store: {
          name: "Loja Centro",
        },
        storeId: "store-1",
      },
      {
        minStock: 2,
        product: {
          name: "Monitor Curvo",
        },
        productId: "product-2",
        quantity: 2,
        reserved: 2,
        store: {
          name: "Loja Centro",
        },
        storeId: "store-1",
      },
      {
        minStock: 4,
        product: {
          name: "Teclado Mecânico",
        },
        productId: "product-3",
        quantity: 10,
        reserved: 1,
        store: {
          name: "Loja Centro",
        },
        storeId: "store-1",
      },
    ]);

    const response = await GET(
      createRequest("?window=7d&lowStockLimit=2&storeId=store-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      generatedAt: "2026-03-15T12:00:00.000Z",
      filters: {
        lowStockLimit: 2,
        scope: {
          appliedStoreIds: ["store-1"],
          kind: "stores",
        },
        storeId: "store-1",
        window: {
          days: 7,
          from: "2026-03-08T12:00:00.000Z",
          key: "7d",
          label: "Últimos 7 dias",
          previousFrom: "2026-03-01T12:00:00.000Z",
          previousTo: "2026-03-08T12:00:00.000Z",
          to: "2026-03-15T12:00:00.000Z",
        },
      },
      kpis: {
        lowStock: {
          items: [
            {
              availableQuantity: 0,
              minStock: 2,
              productId: "product-2",
              productName: "Monitor Curvo",
              reserved: 2,
              storeId: "store-1",
              storeName: "Loja Centro",
            },
            {
              availableQuantity: 1,
              minStock: 5,
              productId: "product-1",
              productName: "Mouse Gamer",
              reserved: 3,
              storeId: "store-1",
              storeName: "Loja Centro",
            },
          ],
          products: 2,
        },
        orders: {
          byStatus: {
            CANCELLED: 0,
            DELIVERED: 0,
            PAID: 3,
            PAYMENT_PENDING: 0,
            PENDING: 1,
            PROCESSING: 0,
            REFUNDED: 0,
            SHIPPED: 2,
          },
          comparison: {
            absolute: 3,
            percentage: 100,
            previous: 3,
            trend: "up",
          },
          total: 6,
        },
        paymentApproval: {
          approved: 4,
          byStatus: {
            CANCELLED: 0,
            FAILED: 1,
            PAID: 4,
            PENDING: 1,
            REFUNDED: 0,
          },
          comparison: {
            absolute: 0.3334,
            percentage: 100.03,
            previous: 0.3333,
            trend: "up",
          },
          rate: 0.6667,
          total: 6,
        },
        revenue: {
          comparison: {
            absolute: 750.5,
            percentage: 150.1,
            previous: 500,
            trend: "up",
          },
          currency: "BRL",
          gross: 1250.5,
          paidOrders: 4,
        },
      },
    });
    expect(mockDb.order.groupBy).toHaveBeenNthCalledWith(1, {
      by: ["status"],
      where: {
        createdAt: {
          gte: new Date("2026-03-08T12:00:00.000Z"),
          lt: new Date("2026-03-15T12:00:00.000Z"),
        },
        storeId: "store-1",
      },
      _count: {
        _all: true,
      },
    });
    expect(mockDb.order.groupBy).toHaveBeenNthCalledWith(3, {
      by: ["paymentStatus"],
      where: {
        createdAt: {
          gte: new Date("2026-03-08T12:00:00.000Z"),
          lt: new Date("2026-03-15T12:00:00.000Z"),
        },
        storeId: "store-1",
      },
      _count: {
        _all: true,
      },
    });
    expect(mockDb.order.aggregate).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date("2026-03-08T12:00:00.000Z"),
          lt: new Date("2026-03-15T12:00:00.000Z"),
        },
        paymentStatus: "PAID",
        storeId: "store-1",
      },
      _count: {
        _all: true,
      },
      _sum: {
        total: true,
      },
    });
    expect(mockDb.inventory.findMany).toHaveBeenCalledWith({
      select: {
        minStock: true,
        product: {
          select: {
            name: true,
          },
        },
        productId: true,
        quantity: true,
        reserved: true,
        store: {
          select: {
            name: true,
          },
        },
        storeId: true,
      },
      where: {
        minStock: {
          gt: 0,
        },
        product: {
          isActive: true,
        },
        storeId: "store-1",
      },
    });
  });

  it("returns 403 when a store admin requests another store explicitly", async () => {
    const response = await GET(createRequest("?storeId=store-2"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      code: "ADMIN_ACCESS_DENIED",
      error: "Ação administrativa não autorizada",
    });
    expect(mockDb.order.groupBy).not.toHaveBeenCalled();
    expect(mockDb.inventory.findMany).not.toHaveBeenCalled();
  });

  it("returns an empty but stable payload when scoped admin has no stores", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        adminStoreScope: {
          kind: "stores",
          storeIds: [],
        },
        id: "store-admin-empty",
        role: "STORE_ADMIN",
      },
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.kpis.lowStock.products).toBe(0);
    expect(body.kpis.orders.total).toBe(0);
    expect(body.kpis.paymentApproval.rate).toBe(0);
    expect(body.kpis.revenue.gross).toBe(0);
    expect(body.filters.scope.appliedStoreIds).toEqual([]);
    expect(mockDb.order.groupBy).not.toHaveBeenCalled();
    expect(mockDb.inventory.findMany).not.toHaveBeenCalled();
  });

  it("keeps explicit store filters for super admins", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        adminStoreScope: {
          kind: "global",
        },
        id: "super-admin-1",
        role: "SUPER_ADMIN",
      },
    });
    mockDb.order.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockDb.order.aggregate
      .mockResolvedValueOnce({
        _count: { _all: 0 },
        _sum: { total: 0 },
      })
      .mockResolvedValueOnce({
        _count: { _all: 0 },
        _sum: { total: 0 },
      });
    mockDb.inventory.findMany.mockResolvedValue([]);

    const response = await GET(createRequest("?storeId=store-2"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filters.scope).toEqual({
      appliedStoreIds: ["store-2"],
      kind: "global",
    });
    expect(mockDb.order.groupBy).toHaveBeenNthCalledWith(1, {
      by: ["status"],
      where: {
        createdAt: {
          gte: new Date("2026-03-08T12:00:00.000Z"),
          lt: new Date("2026-03-15T12:00:00.000Z"),
        },
        storeId: "store-2",
      },
      _count: {
        _all: true,
      },
    });
  });
});
