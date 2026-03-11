import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    },
  });
}

function createPostRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/verify-email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req-auth-verify-email-post-test",
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/auth/verify-email integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
