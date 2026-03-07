import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminAccess, mockDb } = vi.hoisted(() => ({
  mockRequireAdminAccess: vi.fn(),
  mockDb: {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { PUT } from "@/app/api/admin/products/[productId]/images/route";

function createRequest(payload: unknown): NextRequest {
  return new NextRequest(
    "http://localhost:3000/api/admin/products/product-1/images",
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

describe("PUT /api/admin/products/[productId]/images integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    mockDb.product.findUnique.mockResolvedValue({
      id: "product-1",
    });

    mockDb.product.update.mockResolvedValue({
      id: "product-1",
      name: "Mouse Gamer",
      images: [
        "data:image/png;base64,updated-1",
        "data:image/png;base64,updated-2",
      ],
      updatedAt: new Date("2026-03-07T10:00:00.000Z"),
    });
  });

  it("retorna 401 quando não há sessão autenticada", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: false,
      status: 401,
    });

    const response = await PUT(createRequest({ processedImages: ["img"] }), {
      params: Promise.resolve({ productId: "product-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Usuário não autenticado");
    expect(mockDb.product.findUnique).not.toHaveBeenCalled();
    expect(mockDb.product.update).not.toHaveBeenCalled();
  });

  it("retorna 403 quando o usuário não possui role ADMIN", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: false,
      status: 403,
    });

    const response = await PUT(createRequest({ processedImages: ["img"] }), {
      params: Promise.resolve({ productId: "product-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Acesso administrativo obrigatório");
    expect(mockDb.product.findUnique).not.toHaveBeenCalled();
    expect(mockDb.product.update).not.toHaveBeenCalled();
  });

  it("retorna 400 quando payload de imagens processadas é inválido", async () => {
    const response = await PUT(createRequest({ processedImages: ["", 42] }), {
      params: Promise.resolve({ productId: "product-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Array de imagens processadas é obrigatório");
    expect(mockDb.product.findUnique).not.toHaveBeenCalled();
    expect(mockDb.product.update).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o produto não existe", async () => {
    mockDb.product.findUnique.mockResolvedValue(null);

    const response = await PUT(
      createRequest({
        processedImages: ["data:image/png;base64,processed"],
      }),
      {
        params: Promise.resolve({ productId: "missing-product" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Produto não encontrado");
    expect(mockDb.product.update).not.toHaveBeenCalled();
  });

  it("persiste imagens processadas no produto correto", async () => {
    const response = await PUT(
      createRequest({
        processedImages: [
          " data:image/png;base64,updated-1 ",
          "data:image/png;base64,updated-2",
        ],
      }),
      {
        params: Promise.resolve({ productId: "product-1" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.product).toEqual(
      expect.objectContaining({
        id: "product-1",
        name: "Mouse Gamer",
        images: [
          "data:image/png;base64,updated-1",
          "data:image/png;base64,updated-2",
        ],
      }),
    );
    expect(mockDb.product.findUnique).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      select: {
        id: true,
      },
    });
    expect(mockDb.product.update).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      data: {
        images: [
          "data:image/png;base64,updated-1",
          "data:image/png;base64,updated-2",
        ],
      },
      select: {
        id: true,
        name: true,
        images: true,
        updatedAt: true,
      },
    });
  });
});
