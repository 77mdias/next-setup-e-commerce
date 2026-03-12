import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStore } from "@/lib/rate-limit";

const {
  mockCreateTransport,
  mockDb,
  mockGenerateSecurityTokenPair,
  mockSendMail,
} = vi.hoisted(() => ({
  mockCreateTransport: vi.fn(),
  mockDb: {
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
  mockGenerateSecurityTokenPair: vi.fn(),
  mockSendMail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/secure-token", () => ({
  generateSecurityTokenPair: mockGenerateSecurityTokenPair,
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

import { POST } from "@/app/api/auth/forgot-password/route";

function createRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req-auth-forgot-password-test",
      "x-forwarded-for": "198.51.100.10",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/auth/forgot-password integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();

    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.EMAIL_USER = "mailer@example.com";
    process.env.EMAIL_PASSWORD = "app-password";

    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    mockGenerateSecurityTokenPair.mockReturnValue({
      token: "plain-reset-token",
      tokenHash: "hashed-reset-token",
    });

    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Customer",
      email: "customer@example.com",
    });
    mockDb.user.updateMany.mockResolvedValue({ count: 0 });
    mockDb.user.update.mockResolvedValue({ id: "user-1" });
    mockSendMail.mockResolvedValue({ messageId: "message-1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores only reset token hash and sends the raw token via email", async () => {
    const referenceDate = new Date("2026-03-12T10:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(referenceDate);

    const response = await POST(
      createRequest({
        email: "Customer@Example.com ",
        callbackUrl: "/checkout",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(
      "Se o email existir, você receberá um link para redefinir sua senha",
    );

    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: "customer@example.com" },
    });

    expect(mockDb.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: "user-1",
        resetPasswordExpires: {
          lte: expect.any(Date),
        },
        resetPasswordTokenHash: {
          not: null,
        },
      },
      data: {
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
      },
    });

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        resetPasswordTokenHash: "hashed-reset-token",
        resetPasswordExpires: new Date("2026-03-12T11:00:00.000Z"),
      },
    });

    const updateArgs = mockDb.user.update.mock.calls[0][0];
    expect(updateArgs.data.resetPasswordTokenHash).not.toBe(
      "plain-reset-token",
    );

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const sendMailArgs = mockSendMail.mock.calls[0][0];
    expect(sendMailArgs.to).toBe("customer@example.com");
    expect(sendMailArgs.html).toContain("token=plain-reset-token");
    expect(sendMailArgs.html).not.toContain("hashed-reset-token");
  });

  it("returns generic response for unknown email without persisting or sending", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);

    const response = await POST(
      createRequest({
        email: "missing@example.com",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(
      "Se o email existir, você receberá um link para redefinir sua senha",
    );
    expect(mockDb.user.updateMany).not.toHaveBeenCalled();
    expect(mockDb.user.update).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("returns the same neutral payload for existing and unknown emails", async () => {
    mockDb.user.findUnique
      .mockResolvedValueOnce({
        id: "user-1",
        name: "Customer",
        email: "customer@example.com",
      })
      .mockResolvedValueOnce(null);

    const existingResponse = await POST(
      createRequest({
        email: "customer@example.com",
      }),
    );
    const existingBody = await existingResponse.json();

    const unknownResponse = await POST(
      createRequest({
        email: "missing@example.com",
      }),
    );
    const unknownBody = await unknownResponse.json();

    expect(existingResponse.status).toBe(200);
    expect(unknownResponse.status).toBe(200);
    expect(existingBody).toEqual(unknownBody);
    expect(existingBody).toEqual({
      message:
        "Se o email existir, você receberá um link para redefinir sua senha",
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it("returns 429 after too many requests for the same email within the window", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await POST(
        createRequest({
          email: "customer@example.com",
        }),
      );

      expect(response.status).toBe(200);
    }

    const response = await POST(
      createRequest({
        email: "customer@example.com",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe(
      "Muitas tentativas de recuperação de senha. Tente novamente em instantes.",
    );
    expect(body.retryAfter).toBeGreaterThanOrEqual(1);
    expect(response.headers.get("Retry-After")).toBe(String(body.retryAfter));
    expect(mockDb.user.findUnique).toHaveBeenCalledTimes(3);
    expect(mockSendMail).toHaveBeenCalledTimes(3);
  });
});
