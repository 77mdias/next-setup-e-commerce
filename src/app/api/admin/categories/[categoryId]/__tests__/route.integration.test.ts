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
        delete: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
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

import { DELETE } from "@/app/api/admin/categories/[categoryId]/route";

function createRequest() {
  return new NextRequest(
    "http://localhost:3000/api/admin/categories/category-1",
    {
      method: "DELETE",
    },
  );
}

describe("/api/admin/categories/[categoryId] integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizeAdminApiRequest.mockResolvedValue({
      action: "delete",
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
  });

  it("blocks category deletion when there are children or products attached", async () => {
    mockDb.category.findUnique.mockResolvedValue({
      _count: {
        children: 2,
        products: 1,
      },
      id: "category-1",
    });

    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ categoryId: "category-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      code: "ADMIN_CATALOG_CATEGORY_DELETE_BLOCKED",
      error:
        "Categoria com subcategorias ou produtos vinculados não pode ser removida",
    });
    expect(mockDb.category.delete).not.toHaveBeenCalled();
  });

  it("deletes the category and writes an audit event when there are no dependencies", async () => {
    mockDb.category.findUnique.mockResolvedValue({
      _count: {
        children: 0,
        products: 0,
      },
      id: "category-1",
      isActive: true,
      name: "Periféricos",
      parentId: null,
      slug: "perifericos",
      sortOrder: 1,
    });

    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ categoryId: "category-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      categoryId: "category-1",
      success: true,
    });
    expect(mockDb.category.delete).toHaveBeenCalledWith({
      where: {
        id: "category-1",
      },
    });
    expect(mockWriteAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE",
        resource: "CATEGORY",
        targetId: "category-1",
      }),
    );
  });

  it("returns 404 when the requested category does not exist", async () => {
    mockDb.category.findUnique.mockResolvedValue(null);

    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ categoryId: "nonexistent-category" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: "Categoria não encontrada",
    });
    expect(mockDb.category.delete).not.toHaveBeenCalled();
  });
});
