import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStore } from "@/lib/rate-limit";

const { mockAxiosGet, mockAxiosPost, mockRequireAdminAccess } = vi.hoisted(
  () => ({
    mockAxiosGet: vi.fn(),
    mockAxiosPost: vi.fn(),
    mockRequireAdminAccess: vi.fn(),
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

import { POST as adminRemoveBgPost } from "@/app/api/admin/remove-bg/route";
import { POST as legacyRemoveBgPost } from "@/app/api/remove-bg/route";

function createLegacyRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/remove-bg", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.50",
    },
    body: JSON.stringify(payload),
  });
}

function createAdminRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/admin/remove-bg", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.50",
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/remove-bg shared rate-limit integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();

    process.env.REMOVE_BG_API_KEY = "server-test-key";
    process.env.REMOVE_BG_ALLOWED_IMAGE_HOSTS = "example.com";
    delete process.env.REMOVE_BG_ALLOWED_IMAGE_PROTOCOLS;

    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        id: "admin-shared-1",
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks alternating legacy/admin bursts with the same shared limit and reopens after the window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const legacyResponse = await legacyRemoveBgPost(
        createLegacyRequest({
          imageUrl: `https://example.com/legacy-${attempt}.jpg`,
        }),
      );
      const adminResponse = await adminRemoveBgPost(
        createAdminRequest({
          imageUrl: `https://example.com/admin-${attempt}.jpg`,
        }),
      );

      expect(legacyResponse.status).toBe(200);
      expect(adminResponse.status).toBe(200);
    }

    const blockedResponse = await legacyRemoveBgPost(
      createLegacyRequest({
        imageUrl: "https://example.com/legacy-blocked.jpg",
      }),
    );
    const blockedBody = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(blockedBody.error).toBe(
      "Muitas tentativas de processamento de imagem. Tente novamente em instantes.",
    );
    expect(blockedResponse.headers.get("Retry-After")).toBe(
      String(blockedBody.retryAfter),
    );
    expect(mockAxiosGet).toHaveBeenCalledTimes(6);
    expect(mockAxiosPost).toHaveBeenCalledTimes(6);

    vi.advanceTimersByTime(10 * 60 * 1000 + 1_000);

    const reopenedResponse = await adminRemoveBgPost(
      createAdminRequest({
        imageUrl: "https://example.com/admin-reopened.jpg",
      }),
    );
    const reopenedBody = await reopenedResponse.json();

    expect(reopenedResponse.status).toBe(200);
    expect(reopenedBody.success).toBe(true);
    expect(mockAxiosGet).toHaveBeenCalledTimes(7);
    expect(mockAxiosPost).toHaveBeenCalledTimes(7);
  });
});
