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
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

import { PUT } from "@/app/api/admin/products/[productId]/images/route";

function createRequest(payload: unknown) {
  return new NextRequest(
    "http://localhost:3000/api/admin/products/product-1/images",
    {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "PUT",
    },
  );
}

describe("PUT /api/admin/products/[productId]/images integration", () => {
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
      storeId: "store-1",
    });
    mockDb.product.update.mockResolvedValue({
      id: "product-1",
      images: [
        "data:image/png;base64,processed-1",
        "data:image/png;base64,processed-2",
      ],
      name: "Mouse RGB",
      updatedAt: new Date("2026-03-17T13:00:00.000Z"),
    });
  });

  it("persists validated processed images in the selected product", async () => {
    const response = await PUT(
      createRequest({
        processedImages: [
          "data:image/png;base64,processed-1",
          "data:image/png;base64,processed-2",
        ],
      }),
      {
        params: Promise.resolve({ productId: "product-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.product.update).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      data: {
        images: [
          "data:image/png;base64,processed-1",
          "data:image/png;base64,processed-2",
        ],
      },
      select: {
        id: true,
        images: true,
        name: true,
        updatedAt: true,
      },
    });
  });

  it("rejects invalid image payloads with the shared validation contract", async () => {
    const response = await PUT(
      createRequest({
        processedImages: ["notaurl"],
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
          field: "images.0",
          message: "URL da imagem inválida",
        },
      ],
    });
    expect(mockDb.product.update).not.toHaveBeenCalled();
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

    const response = await PUT(
      createRequest({
        processedImages: ["data:image/png;base64,processed-1"],
      }),
      {
        params: Promise.resolve({ productId: "product-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "ADMIN_AUTH_REQUIRED",
      error: "Usuário não autenticado",
    });
  });
});
