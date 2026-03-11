import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb, mockGenerateVerificationTokenPair, mockSendVerificationEmail } =
  vi.hoisted(() => ({
    mockDb: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    },
    mockGenerateVerificationTokenPair: vi.fn(),
    mockSendVerificationEmail: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/email", () => ({
  generateVerificationTokenPair: mockGenerateVerificationTokenPair,
  sendVerificationEmail: mockSendVerificationEmail,
}));

import { POST } from "@/app/api/auth/register/route";

function createRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req-auth-register-test",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/auth/register integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.user.findUnique.mockResolvedValue(null);
    mockGenerateVerificationTokenPair.mockReturnValue({
      token: "plain-verification-token",
      tokenHash: "hashed-verification-token",
    });
    mockDb.user.create.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "user@example.com",
      role: "CUSTOMER",
      createdAt: new Date("2026-03-11T00:00:00.000Z"),
    });
    mockSendVerificationEmail.mockResolvedValue({ success: true });
  });

  it("stores only the token hash and sends raw token via email", async () => {
    const response = await POST(
      createRequest({
        name: "Test User",
        email: "user@example.com",
        password: "StrongPass1!",
        callbackUrl: "/checkout",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.emailSent).toBe(true);

    expect(mockDb.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "user@example.com",
          emailVerificationTokenHash: "hashed-verification-token",
          emailVerificationExpires: expect.any(Date),
        }),
      }),
    );

    const createArgs = mockDb.user.create.mock.calls[0][0];
    expect(createArgs.data.emailVerificationTokenHash).not.toBe(
      "plain-verification-token",
    );

    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      "user@example.com",
      "plain-verification-token",
      "/checkout",
    );
  });
});
