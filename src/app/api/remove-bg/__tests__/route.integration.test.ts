import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAxiosGet, mockAxiosPost } = vi.hoisted(() => ({
  mockAxiosGet: vi.fn(),
  mockAxiosPost: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost,
  },
}));

import { POST, PUT } from "@/app/api/remove-bg/route";

function createRequest(method: "POST" | "PUT", payload: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/remove-bg", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/remove-bg integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REMOVE_BG_API_KEY = "server-test-key";
    process.env.REMOVE_BG_ALLOWED_IMAGE_HOSTS = "example.com";
    delete process.env.REMOVE_BG_ALLOWED_IMAGE_PROTOCOLS;

    mockAxiosGet.mockResolvedValue({
      data: Buffer.from("original-image"),
    });

    mockAxiosPost.mockResolvedValue({
      data: Buffer.from("processed-image"),
    });
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
});
