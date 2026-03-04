import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminAccess, mockAxiosGet, mockAxiosPost } = vi.hoisted(() => ({
  mockRequireAdminAccess: vi.fn(),
  mockAxiosGet: vi.fn(),
  mockAxiosPost: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

vi.mock("axios", () => ({
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost,
  },
}));

import { POST, PUT } from "@/app/api/admin/remove-bg/route";

function createRequest(method: "POST" | "PUT", payload: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/remove-bg", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/admin/remove-bg integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        id: "admin-1",
        role: "ADMIN",
      },
    });

    mockAxiosGet.mockResolvedValue({
      data: Buffer.from("original-image"),
    });

    mockAxiosPost.mockResolvedValue({
      data: Buffer.from("processed-image"),
    });
  });

  it("retorna 401 quando não há sessão autenticada", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: false,
      status: 401,
    });

    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
        apiKey: "test-key",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Usuário não autenticado");
    expect(mockAxiosGet).not.toHaveBeenCalled();
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it("retorna 403 quando o usuário não possui role ADMIN", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: false,
      status: 403,
    });

    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
        apiKey: "test-key",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Acesso administrativo obrigatório");
    expect(mockAxiosGet).not.toHaveBeenCalled();
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it("processa imagem única para admin autorizado", async () => {
    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
        apiKey: "test-key",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processedImage).toBe(
      `data:image/png;base64,${Buffer.from("processed-image").toString("base64")}`,
    );
    expect(body.originalSize).toBe(Buffer.from("original-image").length);
    expect(body.processedSize).toBe(Buffer.from("processed-image").length);
    expect(mockAxiosGet).toHaveBeenCalledWith("https://example.com/image.jpg", {
      responseType: "arraybuffer",
    });
    expect(mockAxiosPost).toHaveBeenCalledWith(
      "https://api.remove.bg/v1.0/removebg",
      expect.any(Object),
      expect.objectContaining({
        responseType: "arraybuffer",
        headers: expect.objectContaining({
          "X-Api-Key": "test-key",
        }),
      }),
    );
  });

  it("retorna erro operacional previsível sem expor detalhes internos", async () => {
    mockAxiosPost.mockRejectedValue({
      message: "stacktrace interna sensível",
      response: {
        status: 429,
      },
    });

    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
        apiKey: "test-key",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe(
      "Limite de processamento atingido. Tente novamente em instantes",
    );
    expect(body.error).not.toContain("stacktrace");
  });

  it("mantém processamento em lote com sucesso parcial e erro sanitizado", async () => {
    mockAxiosPost
      .mockRejectedValueOnce({
        response: {
          status: 403,
        },
      })
      .mockResolvedValueOnce({
        data: Buffer.from("processed-second"),
      });

    const response = await PUT(
      createRequest("PUT", {
        imageUrls: [
          "https://example.com/image-1.jpg",
          "https://example.com/image-2.jpg",
        ],
        apiKey: "test-key",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.totalProcessed).toBe(1);
    expect(body.totalErrors).toBe(1);
    expect(body.errors).toEqual([
      {
        index: 0,
        originalUrl: "https://example.com/image-1.jpg",
        error: "Falha na autenticação com o provedor de remoção de fundo",
        success: false,
      },
    ]);
  });
});
