import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/auth/forgot-password integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
    mockDb.user.update.mockResolvedValue({ id: "user-1" });
    mockSendMail.mockResolvedValue({ messageId: "message-1" });
  });

  it("stores only reset token hash and sends the raw token via email", async () => {
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

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { email: "customer@example.com" },
      data: {
        resetPasswordTokenHash: "hashed-reset-token",
        resetPasswordExpires: expect.any(Date),
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
    expect(mockDb.user.update).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
