import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogger = {
  child: vi.fn(() => mockLogger),
  error: vi.fn(),
  warn: vi.fn(),
};

const {
  mockAuthorizeAdminApiRequest,
  mockAuthorizeAdminStoreScopeAccess,
  mockDb,
  mockGetAuthorizedAdminStoreIds,
} = vi.hoisted(() => ({
  mockAuthorizeAdminApiRequest: vi.fn(),
  mockAuthorizeAdminStoreScopeAccess: vi.fn(),
  mockDb: {
    $transaction: vi.fn(),
    order: {
      groupBy: vi.fn(),
    },
    store: {
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
  mockGetAuthorizedAdminStoreIds: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createRequestLogger: vi.fn(() => mockLogger),
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/rbac", () => ({
  authorizeAdminApiRequest: mockAuthorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess: mockAuthorizeAdminStoreScopeAccess,
  getAuthorizedAdminStoreIds: mockGetAuthorizedAdminStoreIds,
}));

import { GET } from "@/app/api/admin/customers/route";

function createRequest(search = "") {
  return new NextRequest(`http://localhost:3000/api/admin/customers${search}`, {
    method: "GET",
  });
}

describe("GET /api/admin/customers integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizeAdminApiRequest.mockResolvedValue({
      action: "read",
      authorized: true,
      logger: mockLogger,
      role: "STORE_ADMIN",
      storeScope: {
        kind: "stores",
        storeIds: ["store-1"],
      },
      user: {
        adminStoreScope: {
          kind: "stores",
          storeIds: ["store-1"],
        },
        id: "admin-1",
        role: "STORE_ADMIN",
      },
    });
    mockAuthorizeAdminStoreScopeAccess.mockReturnValue({
      authorized: true,
    });
    mockGetAuthorizedAdminStoreIds.mockReturnValue(["store-1"]);
    mockDb.$transaction.mockImplementation(
      async (operations: Promise<unknown>[]) => Promise.all(operations),
    );
    mockDb.store.findMany.mockResolvedValue([
      {
        id: "store-1",
        name: "Loja Centro",
      },
    ]);
    mockDb.user.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
        email: "maria@example.com",
        id: "customer-1",
        isActive: true,
        name: "Maria Souza",
        orders: [
          {
            _count: {
              items: 2,
            },
            createdAt: new Date("2026-03-17T10:00:00.000Z"),
            id: 153,
            status: "PROCESSING",
            store: {
              id: "store-1",
              name: "Loja Centro",
            },
            total: 3599.9,
            trackingCode: "BR123",
          },
        ],
      },
    ]);
    mockDb.user.count.mockResolvedValue(1);
    mockDb.order.groupBy.mockResolvedValue([
      {
        _count: {
          _all: 4,
        },
        _max: {
          createdAt: new Date("2026-03-17T10:00:00.000Z"),
        },
        _sum: {
          total: 5599.7,
        },
        userId: "customer-1",
      },
    ]);
  });

  it("returns authorization failures unchanged", async () => {
    mockAuthorizeAdminApiRequest.mockResolvedValue({
      authorized: false,
      response: NextResponse.json(
        {
          code: "ADMIN_AUTH_REQUIRED",
          error: "Usuário não autenticado",
        },
        { status: 401 },
      ),
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "ADMIN_AUTH_REQUIRED",
      error: "Usuário não autenticado",
    });
  });

  it("lists customers constrained by store scope and textual search", async () => {
    const response = await GET(createRequest("?page=2&limit=5&query=Maria"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.stores).toEqual([
      {
        id: "store-1",
        name: "Loja Centro",
      },
    ]);
    expect(body.customers[0]).toEqual({
      createdAt: "2026-03-01T10:00:00.000Z",
      email: "maria@example.com",
      id: "customer-1",
      isActive: true,
      lastOrderAt: "2026-03-17T10:00:00.000Z",
      name: "Maria Souza",
      orderCount: 4,
      recentOrders: [
        {
          code: "ORD-00153",
          createdAt: "2026-03-17T10:00:00.000Z",
          id: 153,
          itemCount: 2,
          status: "PROCESSING",
          store: {
            id: "store-1",
            name: "Loja Centro",
          },
          total: 3599.9,
          trackingCode: "BR123",
        },
      ],
      stores: [
        {
          id: "store-1",
          name: "Loja Centro",
        },
      ],
      totalSpent: 5599.7,
    });
    expect(mockDb.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        where: expect.objectContaining({
          role: "CUSTOMER",
        }),
      }),
    );
  });

  it("returns 403 when a scoped admin requests another store explicitly", async () => {
    mockAuthorizeAdminStoreScopeAccess.mockReturnValue({
      authorized: false,
      response: NextResponse.json(
        {
          code: "ADMIN_ACCESS_DENIED",
          error: "Ação administrativa não autorizada",
        },
        { status: 403 },
      ),
    });

    const response = await GET(createRequest("?storeId=store-2"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      code: "ADMIN_ACCESS_DENIED",
      error: "Ação administrativa não autorizada",
    });
  });
});
