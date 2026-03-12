import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks weak password using shared policy response payload", async () => {
    const response = await POST(
      createRequest({
        name: "Test User",
        email: "user@example.com",
        password: "weak",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("Senha não atende aos requisitos de segurança");
    expect(body.error).toBe("Senha não atende aos requisitos de segurança");
    expect(body.details).toEqual(
      expect.arrayContaining([
        "A senha deve ter pelo menos 8 caracteres",
        "A senha deve conter pelo menos uma letra maiúscula (A-Z)",
        "A senha deve conter pelo menos um número (0-9)",
        "A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)",
      ]),
    );

    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    expect(mockDb.user.create).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("stores only the token hash and sends raw token via email", async () => {
    const referenceDate = new Date("2026-03-12T10:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(referenceDate);

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
          emailVerificationExpires: new Date("2026-03-13T10:00:00.000Z"),
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
