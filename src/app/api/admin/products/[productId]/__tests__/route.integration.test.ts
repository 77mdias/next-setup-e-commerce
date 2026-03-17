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
    brand: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    orderItem: {
      count: vi.fn(),
    },
    product: {
      delete: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockMovement: {
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

import { DELETE, GET, PUT } from "@/app/api/admin/products/[productId]/route";

function createRequest(method: "DELETE" | "GET" | "PUT", payload?: unknown) {
  return new NextRequest("http://localhost:3000/api/admin/products/product-1", {
    body: payload ? JSON.stringify(payload) : undefined,
    headers: payload
      ? {
          "content-type": "application/json",
        }
      : undefined,
    method,
  });
}

function buildAuthorizedResult(action: "delete" | "read" | "update") {
  return {
    action,
    authorized: true,
    logger: mockLogger,
    role: "ADMIN" as const,
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
  };
}

const detailRow = {
  brand: {
    id: "brand-1",
    name: "Corsair",
  },
  category: {
    id: "category-1",
    name: "Periféricos",
    slug: "perifericos",
  },
  costPrice: 120,
  description: "Mouse gamer com sensor óptico e perfil operacional.",
  dimensions: {
    width: "12cm",
  },
  id: "product-1",
  images: ["data:image/png;base64,product"],
  inventory: [
    {
      id: "inventory-1",
      minStock: 2,
      quantity: 12,
      reserved: 1,
    },
  ],
  isActive: true,
  isFeatured: true,
  isOnSale: false,
  name: "Mouse RGB",
  originalPrice: 259.9,
  price: 199.9,
  saleEndsAt: null,
  saleStartsAt: null,
  shortDesc: "Precisão para setup competitivo",
  sku: "MOUSE-RGB",
  specifications: {
    dpi: "16000",
  },
  store: {
    id: "store-1",
    name: "Loja Centro",
  },
  updatedAt: new Date("2026-03-17T12:00:00.000Z"),
  variants: [],
  warranty: "12 meses",
  weight: 0.25,
};

describe("/api/admin/products/[productId] integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizeAdminApiRequest.mockResolvedValue(
      buildAuthorizedResult("read"),
    );
    mockAuthorizeAdminStoreScopeAccess.mockReturnValue({
      authorized: true,
    });
    mockGetAuthorizedAdminStoreIds.mockReturnValue(null);
    mockDb.brand.findMany.mockResolvedValue([
      { id: "brand-1", name: "Corsair" },
    ]);
    mockDb.category.findMany.mockResolvedValue([
      { id: "category-1", name: "Periféricos", slug: "perifericos" },
    ]);
    mockDb.store.findMany.mockResolvedValue([
      { id: "store-1", name: "Loja Centro" },
    ]);
    mockDb.product.findUnique.mockResolvedValue(detailRow);
    mockDb.stockMovement.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-03-17T11:00:00.000Z"),
        id: "movement-1",
        inventory: {
          product: {
            name: "Mouse RGB",
          },
          variant: null,
        },
        quantity: 4,
        reason: "Reposição manual",
        reference: "NF-123",
        type: "ADJUSTMENT",
        user: {
          email: "ops@example.com",
          name: "Operação",
        },
      },
    ]);
  });

  it("returns product detail with inventory history and catalog metadata", async () => {
    const response = await GET(createRequest("GET"), {
      params: Promise.resolve({ productId: "product-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.product).toEqual(
      expect.objectContaining({
        availableQuantity: 11,
        id: "product-1",
        inventoryHistory: [
          expect.objectContaining({
            reason: "Reposição manual",
          }),
        ],
        name: "Mouse RGB",
      }),
    );
    expect(body.meta.canDeleteProducts).toBe(true);
  });

  it("rejects attempts to change the product store on update", async () => {
    mockAuthorizeAdminApiRequest.mockResolvedValue(
      buildAuthorizedResult("update"),
    );
    mockDb.brand.findUnique.mockResolvedValue({ id: "brand-1" });
    mockDb.category.findUnique.mockResolvedValue({ id: "category-1" });
    mockDb.product.findFirst.mockResolvedValue(null);

    const response = await PUT(
      createRequest("PUT", {
        brandId: "brand-1",
        categoryId: "category-1",
        description: "Mouse gamer com sensor óptico e perfil operacional.",
        images: ["data:image/png;base64,product"],
        isActive: true,
        isFeatured: true,
        isOnSale: false,
        name: "Mouse RGB",
        price: 199.9,
        sku: "MOUSE-RGB",
        specifications: {
          dpi: "16000",
        },
        storeId: "store-2",
      }),
      {
        params: Promise.resolve({ productId: "product-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: "ADMIN_CATALOG_INVALID_PAYLOAD",
      error: "Dados do catálogo administrativo são inválidos",
      issues: [
        {
          field: "storeId",
          message: "Loja do produto não pode ser alterada após a criação",
        },
      ],
    });
    expect(mockDb.product.update).not.toHaveBeenCalled();
  });

  it("blocks deletion when the product already has order history", async () => {
    mockAuthorizeAdminApiRequest.mockResolvedValue(
      buildAuthorizedResult("delete"),
    );
    mockDb.product.findUnique.mockResolvedValue({
      id: "product-1",
      name: "Mouse RGB",
      storeId: "store-1",
    });
    mockDb.orderItem.count.mockResolvedValue(3);

    const response = await DELETE(createRequest("DELETE"), {
      params: Promise.resolve({ productId: "product-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      code: "ADMIN_CATALOG_PRODUCT_DELETE_BLOCKED",
      error:
        "Produto com histórico de pedidos não pode ser removido do catálogo",
    });
    expect(mockDb.product.delete).not.toHaveBeenCalled();
  });

  it("returns denied authorization responses unchanged", async () => {
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

    const response = await GET(createRequest("GET"), {
      params: Promise.resolve({ productId: "product-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      code: "ADMIN_ACCESS_DENIED",
      error: "Ação administrativa não autorizada",
    });
  });
});
