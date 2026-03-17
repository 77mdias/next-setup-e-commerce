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
    adminAuditLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    store: {
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

import { GET } from "@/app/api/admin/audit/route";

function createRequest(search = "") {
  return new NextRequest(`http://localhost:3000/api/admin/audit${search}`, {
    method: "GET",
  });
}

describe("GET /api/admin/audit integration", () => {
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
    mockDb.adminAuditLog.findMany.mockResolvedValue([
      {
        action: "UPDATE",
        actorLabel: "Operador admin",
        actorRole: "STORE_ADMIN",
        actorUserId: "admin-1",
        after: {
          status: "SHIPPED",
        },
        before: {
          status: "PROCESSING",
        },
        createdAt: new Date("2026-03-17T12:00:00.000Z"),
        id: "audit-1",
        metadata: {
          route: "/api/admin/orders/[orderId]",
        },
        resource: "ORDER",
        storeId: "store-1",
        summary: "Pedido ORD-00153 atualizado de PROCESSING para SHIPPED.",
        targetId: "153",
        targetLabel: "Pedido ORD-00153",
      },
    ]);
    mockDb.adminAuditLog.count.mockResolvedValue(1);
  });

  it("lists audit events with filters and serialized snapshots", async () => {
    const response = await GET(
      createRequest("?page=1&limit=10&resource=ORDER&action=UPDATE"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      events: [
        {
          action: "UPDATE",
          actor: {
            id: "admin-1",
            label: "Operador admin",
            role: "STORE_ADMIN",
          },
          after: {
            status: "SHIPPED",
          },
          before: {
            status: "PROCESSING",
          },
          createdAt: "2026-03-17T12:00:00.000Z",
          id: "audit-1",
          metadata: {
            route: "/api/admin/orders/[orderId]",
          },
          resource: "ORDER",
          storeId: "store-1",
          summary: "Pedido ORD-00153 atualizado de PROCESSING para SHIPPED.",
          target: {
            id: "153",
            label: "Pedido ORD-00153",
          },
        },
      ],
      filters: {
        action: "UPDATE",
        limit: 10,
        page: 1,
        query: "",
        resource: "ORDER",
        storeId: null,
      },
      meta: {
        stores: [
          {
            id: "store-1",
            name: "Loja Centro",
          },
        ],
      },
      pagination: {
        hasNext: false,
        hasPrev: false,
        limit: 10,
        page: 1,
        total: 1,
        totalPages: 1,
      },
      success: true,
    });
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
