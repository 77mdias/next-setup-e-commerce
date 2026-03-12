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

import { POST, PUT } from "@/app/api/remove-bg/route";

function createRequest(
  method: "POST" | "PUT",
  payload: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest("http://localhost:3000/api/remove-bg", {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.30",
      ...(headers ?? {}),
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/remove-bg integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    process.env.REMOVE_BG_API_KEY = "server-test-key";
    process.env.REMOVE_BG_ALLOWED_IMAGE_HOSTS = "example.com";
    delete process.env.REMOVE_BG_ALLOWED_IMAGE_PROTOCOLS;

    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        id: "admin-legacy-1",
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

  it("processa imagem única usando chave apenas do servidor", async () => {
    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
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

  it("rejeita URL fora da allowlist de host", async () => {
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

  it("retorna 500 quando REMOVE_BG_API_KEY não está configurada", async () => {
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

  it("rejeita lote quando uma imagem possui origem não permitida", async () => {
    const response = await PUT(
      createRequest("PUT", {
        imageUrls: [
          "https://example.com/image-1.jpg",
          "https://forbidden.com/image-2.jpg",
        ],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Imagem 2: Origem da imagem não permitida");
    expect(mockAxiosGet).not.toHaveBeenCalled();
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it("loga falhas de forma sanitizada sem vazar email ou token", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockAxiosGet.mockRejectedValue({
      accessToken: "tok_remove_bg_secret",
      message: "Falha para admin@example.com token=abc123",
    });

    const response = await POST(
      createRequest("POST", {
        imageUrl: "https://example.com/image.jpg",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Falha ao processar imagem no provedor externo");
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const [serializedLog] = errorSpy.mock.calls[0];
    expect(serializedLog).toContain("remove_bg.legacy.post_failed");
    expect(serializedLog).toContain("[REDACTED_EMAIL]");
    expect(serializedLog).toContain("[REDACTED_TOKEN]");
    expect(serializedLog).not.toContain("admin@example.com");
    expect(serializedLog).not.toContain("token=abc123");
    expect(serializedLog).not.toContain("tok_remove_bg_secret");
  });
});
