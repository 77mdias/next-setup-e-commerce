import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStore } from "@/lib/rate-limit";

const {
  mockDb,
  mockGenerateVerificationTokenPair,
  mockHashVerificationToken,
  mockSendVerificationEmail,
} = vi.hoisted(() => ({
  mockDb: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
  mockGenerateVerificationTokenPair: vi.fn(),
  mockHashVerificationToken: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/email", () => ({
  generateVerificationTokenPair: mockGenerateVerificationTokenPair,
  hashVerificationToken: mockHashVerificationToken,
  sendVerificationEmail: mockSendVerificationEmail,
}));

import { GET, POST } from "@/app/api/auth/verify-email/route";

function createGetRequest(token?: string) {
  const endpoint = new URL("http://localhost:3000/api/auth/verify-email");

  if (token) {
    endpoint.searchParams.set("token", token);
  }

  return new NextRequest(endpoint.toString(), {
    method: "GET",
    headers: {
      "x-request-id": "req-auth-verify-email-get-test",
      "x-forwarded-for": "198.51.100.12",
    },
  });
}

function createPostRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/verify-email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req-auth-verify-email-post-test",
      "x-forwarded-for": "198.51.100.12",
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/auth/verify-email integration", () => {
  const neutralResendMessage =
    "Se o email existir e ainda não tiver sido verificado, você receberá um novo link de verificação.";

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    mockDb.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it("validates token using hash and invalidates token after successful verification", async () => {
    mockHashVerificationToken.mockReturnValue("hashed-token");
    mockDb.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "customer@example.com",
    });

    const response = await GET(createGetRequest("plain-token"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.email).toBe("customer@example.com");

    expect(mockHashVerificationToken).toHaveBeenCalledWith("plain-token");
    expect(mockDb.user.findFirst).toHaveBeenCalledWith({
      where: {
        emailVerificationTokenHash: "hashed-token",
        emailVerificationExpires: {
          gt: expect.any(Date),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    expect(mockDb.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: "user-1",
        emailVerificationTokenHash: "hashed-token",
        emailVerificationExpires: {
          gt: expect.any(Date),
        },
      },
      data: {
        isActive: true,
        emailVerified: expect.any(Date),
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
      },
    });
  });

  it("returns 400 when token is invalid or expired", async () => {
    mockHashVerificationToken.mockReturnValue("hashed-token");
    mockDb.user.findFirst.mockResolvedValue(null);

    const response = await GET(createGetRequest("plain-token"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("Token inválido ou expirado");
    expect(mockDb.user.updateMany).toHaveBeenCalledWith({
      where: {
        emailVerificationExpires: {
          lte: expect.any(Date),
        },
        emailVerificationTokenHash: "hashed-token",
      },
      data: {
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
      },
    });
  });

  it("resends verification email persisting only token hash", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "customer@example.com",
      isActive: false,
    });
    mockGenerateVerificationTokenPair.mockReturnValue({
      token: "plain-token",
      tokenHash: "hashed-token",
    });
    mockSendVerificationEmail.mockResolvedValue({ success: true });

    const response = await POST(
      createPostRequest({
        email: "customer@example.com",
        callbackUrl: "/checkout",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe(neutralResendMessage);

    expect(mockDb.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: "user-1",
        emailVerificationExpires: {
          lte: expect.any(Date),
        },
        emailVerificationTokenHash: {
          not: null,
        },
      },
      data: {
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
      },
    });

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        emailVerificationTokenHash: "hashed-token",
        emailVerificationExpires: expect.any(Date),
      },
    });

    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      "customer@example.com",
      "plain-token",
      "/checkout",
    );
  });

  it("returns neutral success when account does not exist", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);

    const response = await POST(
      createPostRequest({
        email: "unknown@example.com",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: neutralResendMessage,
      success: true,
    });
    expect(mockDb.user.updateMany).not.toHaveBeenCalled();
    expect(mockDb.user.update).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns neutral success when account is already verified", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-verified",
      email: "verified@example.com",
      isActive: true,
    });

    const response = await POST(
      createPostRequest({
        email: "verified@example.com",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: neutralResendMessage,
      success: true,
    });
    expect(mockDb.user.update).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns neutral success when email delivery fails", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "customer@example.com",
      isActive: false,
    });
    mockGenerateVerificationTokenPair.mockReturnValue({
      token: "plain-token",
      tokenHash: "hashed-token",
    });
    mockSendVerificationEmail.mockResolvedValue({ success: false });

    const response = await POST(
      createPostRequest({
        email: "customer@example.com",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: neutralResendMessage,
      success: true,
    });
  });

  it("returns 429 after too many verification attempts for the same token", async () => {
    mockHashVerificationToken.mockReturnValue("hashed-token");
    mockDb.user.findFirst.mockResolvedValue(null);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await GET(createGetRequest("plain-token"));
      expect(response.status).toBe(400);
    }

    const response = await GET(createGetRequest("plain-token"));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.message).toBe(
      "Muitas tentativas de verificação de email. Tente novamente em instantes.",
    );
    expect(body.retryAfter).toBeGreaterThanOrEqual(1);
    expect(response.headers.get("Retry-After")).toBe(String(body.retryAfter));
    expect(mockDb.user.findFirst).toHaveBeenCalledTimes(5);
  });

  it("returns 429 after too many resend attempts for the same email", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "customer@example.com",
      isActive: false,
    });
    mockGenerateVerificationTokenPair.mockReturnValue({
      token: "plain-token",
      tokenHash: "hashed-token",
    });
    mockSendVerificationEmail.mockResolvedValue({ success: true });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await POST(
        createPostRequest({
          email: "customer@example.com",
        }),
      );

      expect(response.status).toBe(200);
    }

    const response = await POST(
      createPostRequest({
        email: "customer@example.com",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.message).toBe(
      "Muitas tentativas de reenvio do email de verificação. Tente novamente em instantes.",
    );
    expect(body.retryAfter).toBeGreaterThanOrEqual(1);
    expect(response.headers.get("Retry-After")).toBe(String(body.retryAfter));
    expect(mockDb.user.findUnique).toHaveBeenCalledTimes(3);
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(3);
  });
});
