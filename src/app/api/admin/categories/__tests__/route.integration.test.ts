import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockLogger = {
  child: vi.fn(() => mockLogger),
  error: vi.fn(),
  warn: vi.fn(),
};

const { mockAuthorizeAdminApiRequest, mockDb, mockWriteAdminAuditLog } =
  vi.hoisted(() => ({
    mockAuthorizeAdminApiRequest: vi.fn(),
    mockDb: {
      $transaction: vi.fn(),
      category: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    },
    mockWriteAdminAuditLog: vi.fn(),
  }));

vi.mock("@/lib/logger", () => ({
  createRequestLogger: vi.fn(() => mockLogger),
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/rbac", () => ({
  authorizeAdminApiRequest: mockAuthorizeAdminApiRequest,
  createAdminAuthorizationErrorResponse: vi.fn((status: 401 | 403) =>
    NextResponse.json(
      {
        code: status === 401 ? "ADMIN_AUTH_REQUIRED" : "ADMIN_ACCESS_DENIED",
        error:
          status === 401
            ? "Usuário não autenticado"
            : "Ação administrativa não autorizada",
      },
      { status },
    ),
  ),
}));

vi.mock("@/lib/audit-log", () => ({
  writeAdminAuditLog: mockWriteAdminAuditLog,
}));

import { GET, POST } from "@/app/api/admin/categories/route";

function createRequest(method: "GET" | "POST", payload?: unknown) {
  return new NextRequest("http://localhost:3000/api/admin/categories", {
    body: payload ? JSON.stringify(payload) : undefined,
    headers: payload
      ? {
          "content-type": "application/json",
        }
      : undefined,
    method,
  });
}

describe("/api/admin/categories integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizeAdminApiRequest.mockResolvedValue({
      action: "read",
      authorized: true,
      logger: mockLogger,
      role: "ADMIN",
      storeScope: {
        kind: "global",
      },
      user: {
        adminStoreScope: {
          kind: "global",
        },
        id: "admin-1",
        role: "ADMIN",
      },
    });
    mockDb.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (transaction: typeof mockDb) => Promise<unknown>)(mockDb),
    );
    mockDb.category.findMany.mockResolvedValue([
      {
        _count: {
          children: 1,
          products: 2,
        },
        description: "Periféricos premium",
        id: "category-1",
        isActive: true,
        name: "Periféricos",
        parentId: null,
        slug: "perifericos",
        sortOrder: 1,
      },
    ]);
  });

  it("lists administrative categories with operational counters", async () => {
    const response = await GET(createRequest("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      categories: [
        {
          childrenCount: 1,
          description: "Periféricos premium",
          id: "category-1",
          isActive: true,
          name: "Periféricos",
          parentId: null,
          productCount: 2,
          slug: "perifericos",
          sortOrder: 1,
        },
      ],
      success: true,
    });
  });

  it("creates a category for global admin roles", async () => {
    mockAuthorizeAdminApiRequest.mockResolvedValue({
      action: "create",
      authorized: true,
      logger: mockLogger,
      role: "ADMIN",
      storeScope: {
        kind: "global",
      },
      user: {
        adminStoreScope: {
          kind: "global",
        },
        id: "admin-1",
        role: "ADMIN",
      },
    });
    mockDb.category.findUnique.mockResolvedValue(null);
    mockDb.category.create.mockResolvedValue({
      _count: {
        children: 0,
        products: 0,
      },
      description: "Linha de áudio",
      id: "category-2",
      isActive: true,
      name: "Áudio",
      parentId: null,
      slug: "audio",
      sortOrder: 3,
    });

    const response = await POST(
      createRequest("POST", {
        description: "Linha de áudio",
        isActive: true,
        name: "Áudio",
        sortOrder: 3,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.category).toEqual({
      childrenCount: 0,
      description: "Linha de áudio",
      id: "category-2",
      isActive: true,
      name: "Áudio",
      parentId: null,
      productCount: 0,
      slug: "audio",
      sortOrder: 3,
    });
    expect(mockWriteAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        resource: "CATEGORY",
        targetId: "category-2",
      }),
    );
  });

  it("blocks store admins from mutating global categories", async () => {
    mockAuthorizeAdminApiRequest.mockResolvedValue({
      action: "create",
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
        id: "store-admin-1",
        role: "STORE_ADMIN",
      },
    });

    const response = await POST(
      createRequest("POST", {
        name: "Áudio",
        sortOrder: 3,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      code: "ADMIN_ACCESS_DENIED",
      error: "Ação administrativa não autorizada",
    });
    expect(mockDb.category.create).not.toHaveBeenCalled();
  });
});
