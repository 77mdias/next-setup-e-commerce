import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminAccess, mockDb } = vi.hoisted(() => ({
  mockDb: {
    $transaction: vi.fn(),
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
  mockRequireAdminAccess: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { GET } from "@/app/api/admin/orders/route";

function createRequest(search = "") {
  return new NextRequest(`http://localhost:3000/api/admin/orders${search}`, {
    method: "GET",
  });
}

describe("GET /api/admin/orders integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-17T12:00:00.000Z"));

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

    mockDb.order.findMany.mockResolvedValue([
      {
        _count: {
          items: 2,
        },
        createdAt: new Date("2026-03-16T10:30:00.000Z"),
        customerName: "Maria Souza",
        id: 153,
        items: [{ productName: "Notebook Pro" }, { productName: "Mouse RGB" }],
        paymentStatus: "PAID",
        status: "PROCESSING",
        store: {
          id: "store-1",
          name: "Loja Centro",
        },
        total: 3599.9,
        trackingCode: "BR123",
      },
    ]);
    mockDb.order.count.mockResolvedValue(1);
    mockDb.$transaction.mockImplementation(async (operations: unknown[]) =>
      Promise.all(operations),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 401 when there is no authenticated admin session", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: false,
      status: 401,
    });

    const response = await GET(createRequest("?page=1&limit=12"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "ADMIN_AUTH_REQUIRED",
      error: "Usuário não autenticado",
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("returns 400 when order filters are invalid", async () => {
    const response = await GET(createRequest("?period=365d"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: "ADMIN_ORDERS_INVALID_FILTERS",
      error: "Parâmetros inválidos para pedidos administrativos",
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("filters order queries by scoped store ids and operational filters", async () => {
    const response = await GET(
      createRequest(
        "?page=2&limit=5&status=PROCESSING&paymentStatus=PAID&period=7d&query=Maria",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      filters: {
        limit: 5,
        page: 2,
        paymentStatus: "PAID",
        period: "7d",
        query: "Maria",
        status: "PROCESSING",
        storeId: null,
      },
      orders: [
        {
          code: "ORD-00153",
          createdAt: "2026-03-16T10:30:00.000Z",
          customerName: "Maria Souza",
          id: 153,
          itemCount: 2,
          itemPreview: ["Notebook Pro", "Mouse RGB"],
          paymentStatus: "PAID",
          status: "PROCESSING",
          store: {
            id: "store-1",
            name: "Loja Centro",
          },
          total: 3599.9,
          trackingCode: "BR123",
        },
      ],
      pagination: {
        hasNext: false,
        hasPrev: true,
        limit: 5,
        page: 2,
        total: 1,
        totalPages: 1,
      },
      success: true,
    });
    expect(mockDb.order.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: expect.any(Object),
      skip: 5,
      take: 5,
      where: {
        OR: [
          {
            customerName: {
              contains: "Maria",
              mode: "insensitive",
            },
          },
          {
            trackingCode: {
              contains: "Maria",
              mode: "insensitive",
            },
          },
          {
            store: {
              name: {
                contains: "Maria",
                mode: "insensitive",
              },
            },
          },
        ],
        createdAt: {
          gte: new Date("2026-03-10T12:00:00.000Z"),
        },
        paymentStatus: "PAID",
        status: "PROCESSING",
        storeId: {
          in: ["store-1"],
        },
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
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });
});
