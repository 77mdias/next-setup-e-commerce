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
    brand: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    inventory: {
      create: vi.fn(),
    },
    product: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    store: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
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

import { GET, POST } from "@/app/api/admin/products/route";

function createGetRequest(search = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/admin/products${search}`, {
    method: "GET",
  });
}

function createPostRequest(payload: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/products", {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
}

function buildAuthorizedResult(role: "STORE_ADMIN" | "ADMIN" = "STORE_ADMIN") {
  return {
    action: "read",
    authorized: true,
    logger: mockLogger,
    role,
    storeScope:
      role === "STORE_ADMIN"
        ? {
            kind: "stores",
            storeIds: ["store-1"],
          }
        : {
            kind: "global",
          },
    user: {
      adminStoreScope:
        role === "STORE_ADMIN"
          ? {
              kind: "stores",
              storeIds: ["store-1"],
            }
          : {
              kind: "global",
            },
      id: "admin-1",
      role,
    },
  };
}

describe("/api/admin/products integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthorizeAdminApiRequest.mockResolvedValue(buildAuthorizedResult());
    mockAuthorizeAdminStoreScopeAccess.mockReturnValue({
      authorized: true,
    });
    mockGetAuthorizedAdminStoreIds.mockReturnValue(["store-1"]);

    mockDb.brand.findMany.mockResolvedValue([
      { id: "brand-1", name: "Corsair" },
    ]);
    mockDb.category.findMany.mockResolvedValue([
      { id: "category-1", name: "Periféricos", slug: "perifericos" },
    ]);
    mockDb.store.findMany.mockResolvedValue([
      { id: "store-1", name: "Loja Centro" },
    ]);
    mockDb.product.findMany.mockResolvedValue([
      {
        brand: {
          id: "brand-1",
          name: "Corsair",
        },
        category: {
          id: "category-1",
          name: "Periféricos",
          slug: "perifericos",
        },
        id: "product-1",
        images: ["data:image/png;base64,preview"],
        inventory: [
          {
            id: "inventory-1",
            minStock: 4,
            quantity: 12,
            reserved: 2,
          },
        ],
        isActive: true,
        isFeatured: false,
        name: "Mouse RGB",
        price: 249.9,
        sku: "MOUSE-RGB",
        store: {
          id: "store-1",
          name: "Loja Centro",
        },
        updatedAt: new Date("2026-03-17T12:00:00.000Z"),
      },
    ]);
    mockDb.product.count.mockResolvedValue(1);
    mockDb.$transaction.mockImplementation(async (value: unknown) => {
      if (typeof value === "function") {
        return value(mockDb);
      }

      return Promise.all(value as Array<Promise<unknown>>);
    });
  });

  it("returns scoped products and metadata for the admin catalog", async () => {
    const response = await GET(createGetRequest("?page=2&limit=5&query=mouse"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta).toEqual({
      brands: [{ id: "brand-1", name: "Corsair" }],
      canDeleteProducts: false,
      canManageCategories: false,
      categories: [
        { id: "category-1", name: "Periféricos", slug: "perifericos" },
      ],
      stores: [{ id: "store-1", name: "Loja Centro" }],
    });
    expect(body.products).toEqual([
      expect.objectContaining({
        availableQuantity: 10,
        name: "Mouse RGB",
        sku: "MOUSE-RGB",
      }),
    ]);
    expect(mockDb.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        where: {
          OR: [
            {
              name: {
                contains: "mouse",
                mode: "insensitive",
              },
            },
            {
              sku: {
                contains: "mouse",
                mode: "insensitive",
              },
            },
          ],
          storeId: {
            in: ["store-1"],
          },
        },
      }),
    );
  });

  it("creates a product and the base inventory inside the authorized store scope", async () => {
    mockAuthorizeAdminApiRequest.mockResolvedValue({
      ...buildAuthorizedResult(),
      action: "create",
    });
    mockDb.store.findUnique.mockResolvedValue({
      id: "store-1",
      isActive: true,
    });
    mockDb.brand.findUnique.mockResolvedValue({ id: "brand-1" });
    mockDb.category.findUnique.mockResolvedValue({ id: "category-1" });
    mockDb.product.findUnique.mockResolvedValueOnce(null);
    mockDb.product.create.mockResolvedValue({
      brand: {
        id: "brand-1",
        name: "Corsair",
      },
      category: {
        id: "category-1",
        name: "Periféricos",
        slug: "perifericos",
      },
      id: "product-2",
      images: ["data:image/png;base64,processed"],
      isActive: true,
      isFeatured: true,
      name: "Teclado Pro",
      price: 499.9,
      sku: "TECLADO-PRO",
      store: {
        id: "store-1",
        name: "Loja Centro",
      },
      updatedAt: new Date("2026-03-17T13:00:00.000Z"),
    });

    const response = await POST(
      createPostRequest({
        brandId: "brand-1",
        categoryId: "category-1",
        description: "Teclado mecânico com controle operacional completo.",
        images: ["data:image/png;base64,processed"],
        isActive: true,
        isFeatured: true,
        isOnSale: false,
        name: "Teclado Pro",
        price: 499.9,
        sku: "teclado-pro",
        specifications: {
          switch: "red",
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.product).toEqual(
      expect.objectContaining({
        availableQuantity: 0,
        id: "product-2",
        inventory: {
          minStock: 0,
          quantity: 0,
          reserved: 0,
        },
        sku: "TECLADO-PRO",
      }),
    );
    expect(mockAuthorizeAdminStoreScopeAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: "store-1",
      }),
    );
    expect(mockDb.inventory.create).toHaveBeenCalledWith({
      data: {
        location: "Estoque admin",
        maxStock: 1000,
        minStock: 0,
        productId: "product-2",
        quantity: 0,
        storeId: "store-1",
      },
    });
  });

  it("rejects invalid catalog payloads with the shared validation contract", async () => {
    mockAuthorizeAdminApiRequest.mockResolvedValue({
      ...buildAuthorizedResult(),
      action: "create",
    });

    const response = await POST(
      createPostRequest({
        brandId: "",
        categoryId: "category-1",
        description: "curta",
        images: ["notaurl"],
        name: "x",
        price: 0,
        sku: "ab",
        specifications: {},
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: "ADMIN_CATALOG_INVALID_PAYLOAD",
      error: "Dados do catálogo administrativo são inválidos",
      issues: expect.arrayContaining([
        expect.objectContaining({ field: "brandId" }),
        expect.objectContaining({ field: "description" }),
        expect.objectContaining({ field: "name" }),
        expect.objectContaining({ field: "price" }),
      ]),
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("returns authorization denial responses unchanged", async () => {
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

    const response = await GET(createGetRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "ADMIN_AUTH_REQUIRED",
      error: "Usuário não autenticado",
    });
  });
});
