import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStore } from "@/lib/rate-limit";

const { mockRequireAdminAccess, mockAxiosGet, mockAxiosPost } = vi.hoisted(
  () => ({
    mockRequireAdminAccess: vi.fn(),
    mockAxiosGet: vi.fn(),
    mockAxiosPost: vi.fn(),
  }),
);

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

function createRequest(
  method: "POST" | "PUT",
  payload: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/remove-bg", {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.31",
      ...(headers ?? {}),
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/admin/remove-bg integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    process.env.REMOVE_BG_API_KEY = "server-test-key";
    process.env.REMOVE_BG_ALLOWED_IMAGE_HOSTS = "example.com";
    delete process.env.REMOVE_BG_ALLOWED_IMAGE_PROTOCOLS;

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
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Acesso administrativo obrigatório");
    expect(mockAxiosGet).not.toHaveBeenCalled();
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a imagem de origem não é encontrada", async () => {
    mockAxiosGet.mockRejectedValue({
      response: {
        status: 404,
      },
    });

    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe(
      "Imagem de origem não encontrada para processamento",
    );
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it("processa imagem única para admin autorizado", async () => {
    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
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
          "X-Api-Key": "server-test-key",
        }),
      }),
    );
  });

  it("retorna 429 com retry-after ao exceder o limite dedicado", async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await POST(
        createRequest("POST", {
          imageUrl: "https://example.com/image.jpg",
        }),
      );

      expect(response.status).toBe(200);
    }

    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).not.toBeNull();
    expect(body.error).toBe(
      "Muitas tentativas de processamento de imagem. Tente novamente em instantes.",
    );
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(mockAxiosGet).toHaveBeenCalledTimes(6);
    expect(mockAxiosPost).toHaveBeenCalledTimes(6);
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

  it("rejeita URL de origem fora da allowlist", async () => {
    process.env.REMOVE_BG_ALLOWED_IMAGE_HOSTS = "allowed.example.com";

    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Origem da imagem não permitida");
    expect(mockAxiosGet).not.toHaveBeenCalled();
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it("retorna 500 quando REMOVE_BG_API_KEY não está configurada no servidor", async () => {
    delete process.env.REMOVE_BG_API_KEY;

    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("REMOVE_BG_API_KEY não configurada no servidor");
    expect(mockAxiosGet).not.toHaveBeenCalled();
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });
});
