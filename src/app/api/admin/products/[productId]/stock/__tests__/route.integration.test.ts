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
} = vi.hoisted(() => ({
  mockAuthorizeAdminApiRequest: vi.fn(),
  mockAuthorizeAdminStoreScopeAccess: vi.fn(),
  mockDb: {
    $transaction: vi.fn(),
    inventory: {
      create: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
      update: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
  },
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
}));

import { POST } from "@/app/api/admin/products/[productId]/stock/route";

function createRequest(payload: unknown) {
  return new NextRequest(
    "http://localhost:3000/api/admin/products/product-1/stock",
    {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    },
  );
}

describe("POST /api/admin/products/[productId]/stock integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizeAdminApiRequest.mockResolvedValue({
      action: "update",
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
    mockDb.product.findUnique.mockResolvedValue({
      id: "product-1",
      inventory: [
        {
          id: "inventory-1",
          maxStock: 100,
          minStock: 5,
          quantity: 12,
          reserved: 2,
          variantId: null,
        },
      ],
      name: "Mouse RGB",
      storeId: "store-1",
      variants: [
        {
          id: "variant-1",
          inventory: [],
          name: "Cor",
          stock: 6,
          value: "Branco",
        },
      ],
    });
    mockDb.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (transaction: typeof mockDb) => Promise<unknown>)(mockDb),
    );
    mockDb.inventory.update.mockResolvedValue({
      id: "inventory-1",
      maxStock: 90,
      minStock: 4,
      quantity: 16,
      reserved: 2,
    });
    mockDb.stockMovement.create.mockResolvedValue({
      createdAt: new Date("2026-03-17T14:00:00.000Z"),
      id: "movement-1",
      quantity: 4,
      reason: "Reposição física",
      reference: "NF-123",
      type: "ADJUSTMENT",
      user: {
        email: "ops@example.com",
        name: "Operação",
      },
    });
  });

  it("registers stock adjustments and writes a stock movement trail", async () => {
    const response = await POST(
      createRequest({
        delta: 4,
        maxStock: 90,
        minStock: 4,
        reason: "Reposição física",
        reference: "NF-123",
        targetType: "product",
      }),
      {
        params: Promise.resolve({ productId: "product-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.inventory).toEqual({
      availableQuantity: 14,
      id: "inventory-1",
      maxStock: 90,
      minStock: 4,
      quantity: 16,
      reserved: 2,
    });
    expect(mockDb.stockMovement.create).toHaveBeenCalledWith({
      data: {
        inventoryId: "inventory-1",
        quantity: 4,
        reason: "Reposição física",
        reference: "NF-123",
        type: "ADJUSTMENT",
        userId: "admin-1",
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  });

  it("rejects adjustments that would go below the reserved quantity", async () => {
    const response = await POST(
      createRequest({
        delta: -20,
        reason: "Baixa manual",
        targetType: "product",
      }),
      {
        params: Promise.resolve({ productId: "product-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      code: "ADMIN_CATALOG_STOCK_CONFLICT",
      error: "Ajuste de estoque deixaria a quantidade negativa",
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("returns authorization failures unchanged", async () => {
    mockAuthorizeAdminApiRequest.mockResolvedValue({
      authorized: false,
      response: NextResponse.json(
        {
          code: "ADMIN_ACCESS_DENIED",
          error: "Ação administrativa não autorizada",
        },
        { status: 403 },
      ),
    });

    const response = await POST(
      createRequest({
        delta: 4,
        reason: "Reposição física",
        targetType: "product",
      }),
      {
        params: Promise.resolve({ productId: "product-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      code: "ADMIN_ACCESS_DENIED",
      error: "Ação administrativa não autorizada",
    });
  });
});
