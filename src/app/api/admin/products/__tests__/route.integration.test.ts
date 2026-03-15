import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminAccess, mockDb } = vi.hoisted(() => ({
  mockRequireAdminAccess: vi.fn(),
  mockDb: {
    $transaction: vi.fn(),
    product: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { GET } from "@/app/api/admin/products/route";

function createRequest(search = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/products${search}`, {
    method: "GET",
  });
}

describe("GET /api/admin/products integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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

    mockDb.product.findMany.mockResolvedValue([
      {
        id: "product-1",
        images: ["image-1"],
        name: "Mouse Gamer",
        storeId: "store-1",
      },
    ]);
    mockDb.product.count.mockResolvedValue(1);
    mockDb.$transaction.mockImplementation(async (operations: unknown[]) =>
      Promise.all(operations),
    );
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

  it("filters product queries by scoped store ids for store admins", async () => {
    const response = await GET(createRequest("?page=2&limit=5&query=mouse"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      products: [
        {
          id: "product-1",
          images: ["image-1"],
          name: "Mouse Gamer",
          storeId: "store-1",
        },
      ],
      total: 1,
      page: 2,
      totalPages: 1,
    });
    expect(mockDb.product.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          contains: "mouse",
          mode: "insensitive",
        },
        storeId: {
          in: ["store-1"],
        },
      },
      select: {
        id: true,
        images: true,
        name: true,
        storeId: true,
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      skip: 5,
      take: 5,
    });
    expect(mockDb.product.count).toHaveBeenCalledWith({
      where: {
        name: {
          contains: "mouse",
          mode: "insensitive",
        },
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

  it("keeps global visibility for super admin requests", async () => {
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

    const response = await GET(createRequest("?storeId=store-2"));

    expect(response.status).toBe(200);
    expect(mockDb.product.findMany).toHaveBeenCalledWith({
      where: {
        storeId: "store-2",
      },
      select: {
        id: true,
        images: true,
        name: true,
        storeId: true,
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      skip: 0,
      take: 12,
    });
  });
});
