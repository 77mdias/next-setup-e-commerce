import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockBcryptHash,
  mockCreateTransport,
  mockDb,
  mockGenerateSecurityTokenPair,
  mockGenerateVerificationTokenPair,
  mockHashSecurityToken,
  mockHashVerificationToken,
  mockSendMail,
  mockSendPasswordResetEmail,
  mockSendVerificationEmail,
} = vi.hoisted(() => ({
  mockBcryptHash: vi.fn(),
  mockCreateTransport: vi.fn(),
  mockDb: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
  },
  mockGenerateSecurityTokenPair: vi.fn(),
  mockGenerateVerificationTokenPair: vi.fn(),
  mockHashSecurityToken: vi.fn(),
  mockHashVerificationToken: vi.fn(),
  mockSendMail: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
  mockSendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/secure-token", () => ({
  generateSecurityTokenPair: mockGenerateSecurityTokenPair,
  hashSecurityToken: mockHashSecurityToken,
}));

vi.mock("@/lib/email", () => ({
  generateVerificationTokenPair: mockGenerateVerificationTokenPair,
  hashVerificationToken: mockHashVerificationToken,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  sendVerificationEmail: mockSendVerificationEmail,
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: mockBcryptHash,
  },
}));

import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import {
  GET as verifyEmailGet,
  POST as verifyEmailPost,
} from "@/app/api/auth/verify-email/route";
import { resetRateLimitStore } from "@/lib/rate-limit";

function createForgotPasswordRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req-auth-security-forgot-password",
      "x-forwarded-for": "198.51.100.40",
    },
    body: JSON.stringify(payload),
  });
}

function createResetPasswordRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req-auth-security-reset-password",
      "x-forwarded-for": "198.51.100.41",
    },
    body: JSON.stringify(payload),
  });
}

function createVerifyEmailGetRequest(token: string) {
  const endpoint = new URL("http://localhost:3000/api/auth/verify-email");
  endpoint.searchParams.set("token", token);

  return new NextRequest(endpoint.toString(), {
    method: "GET",
    headers: {
      "x-request-id": "req-auth-security-verify-email-get",
      "x-forwarded-for": "198.51.100.42",
    },
  });
}

function createVerifyEmailPostRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/verify-email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req-auth-security-verify-email-post",
      "x-forwarded-for": "198.51.100.43",
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/auth rate-limit burst integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();

    process.env.NEXTAUTH_URL = "http://localhost:3000";
    process.env.EMAIL_USER = "mailer@example.com";
    process.env.EMAIL_PASSWORD = "app-password";

    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    mockDb.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Customer",
      email: "customer@example.com",
      isActive: false,
    });
    mockDb.user.findFirst.mockResolvedValue(null);
    mockDb.user.updateMany.mockResolvedValue({ count: 1 });
    mockDb.user.update.mockResolvedValue({ id: "user-1" });

    mockGenerateSecurityTokenPair.mockReturnValue({
      token: "plain-reset-token",
      tokenHash: "hashed-reset-token",
    });
    mockHashSecurityToken.mockReturnValue("hashed-reset-token");
    mockGenerateVerificationTokenPair.mockReturnValue({
      token: "plain-verification-token",
      tokenHash: "hashed-verification-token",
    });
    mockHashVerificationToken.mockReturnValue("hashed-verification-token");

    mockBcryptHash.mockResolvedValue("hashed-password");
    mockSendMail.mockResolvedValue({ messageId: "message-1" });
    mockSendPasswordResetEmail.mockResolvedValue({ success: true });
    mockSendVerificationEmail.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reopens forgot-password after the burst window without blocking the next legitimate retry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await forgotPasswordPost(
        createForgotPasswordRequest({
          email: "customer@example.com",
        }),
      );

      expect(response.status).toBe(200);
    }

    const blockedResponse = await forgotPasswordPost(
      createForgotPasswordRequest({
        email: "customer@example.com",
      }),
    );
    const blockedBody = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(blockedBody.error).toBe(
      "Muitas tentativas de recuperação de senha. Tente novamente em instantes.",
    );
    expect(blockedResponse.headers.get("Retry-After")).toBe(
      String(blockedBody.retryAfter),
    );

    vi.advanceTimersByTime(15 * 60 * 1000 + 1_000);

    const reopenedResponse = await forgotPasswordPost(
      createForgotPasswordRequest({
        email: "customer@example.com",
      }),
    );
    const reopenedBody = await reopenedResponse.json();

    expect(reopenedResponse.status).toBe(200);
    expect(reopenedBody.message).toBe(
      "Se o email existir, você receberá um link para redefinir sua senha",
    );
    expect(mockDb.user.findUnique).toHaveBeenCalledTimes(4);
    expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(4);
  });

  it("reopens reset-password after the burst window without keeping the user blocked", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await resetPasswordPost(
        createResetPasswordRequest({
          email: "customer@example.com",
          newPassword: "StrongPass1!",
          token: "plain-reset-token",
        }),
      );

      expect(response.status).toBe(200);
    }

    const blockedResponse = await resetPasswordPost(
      createResetPasswordRequest({
        email: "customer@example.com",
        newPassword: "StrongPass1!",
        token: "plain-reset-token",
      }),
    );
    const blockedBody = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(blockedBody.error).toBe(
      "Muitas tentativas de redefinição de senha. Tente novamente em instantes.",
    );
    expect(blockedResponse.headers.get("Retry-After")).toBe(
      String(blockedBody.retryAfter),
    );

    vi.advanceTimersByTime(15 * 60 * 1000 + 1_000);

    const reopenedResponse = await resetPasswordPost(
      createResetPasswordRequest({
        email: "customer@example.com",
        newPassword: "StrongPass1!",
        token: "plain-reset-token",
      }),
    );
    const reopenedBody = await reopenedResponse.json();

    expect(reopenedResponse.status).toBe(200);
    expect(reopenedBody.message).toBe("Senha redefinida com sucesso");
    expect(mockBcryptHash).toHaveBeenCalledTimes(6);
    expect(mockDb.user.updateMany).toHaveBeenCalledTimes(6);
  });

  it("reopens verify-email GET after the burst window and preserves the public token contract", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await verifyEmailGet(
        createVerifyEmailGetRequest("plain-token"),
      );

      expect(response.status).toBe(400);
    }

    const blockedResponse = await verifyEmailGet(
      createVerifyEmailGetRequest("plain-token"),
    );
    const blockedBody = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(blockedBody.message).toBe(
      "Muitas tentativas de verificação de email. Tente novamente em instantes.",
    );
    expect(blockedResponse.headers.get("Retry-After")).toBe(
      String(blockedBody.retryAfter),
    );

    vi.advanceTimersByTime(15 * 60 * 1000 + 1_000);

    const reopenedResponse = await verifyEmailGet(
      createVerifyEmailGetRequest("plain-token"),
    );
    const reopenedBody = await reopenedResponse.json();

    expect(reopenedResponse.status).toBe(400);
    expect(reopenedBody.message).toBe("Token inválido ou expirado");
    expect(mockDb.user.findFirst).toHaveBeenCalledTimes(6);
  });

  it("reopens verify-email POST after the burst window without blocking the next legitimate resend", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T10:00:00.000Z"));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await verifyEmailPost(
        createVerifyEmailPostRequest({
          email: "customer@example.com",
        }),
      );

      expect(response.status).toBe(200);
    }

    const blockedResponse = await verifyEmailPost(
      createVerifyEmailPostRequest({
        email: "customer@example.com",
      }),
    );
    const blockedBody = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(blockedBody.message).toBe(
      "Muitas tentativas de reenvio do email de verificação. Tente novamente em instantes.",
    );
    expect(blockedResponse.headers.get("Retry-After")).toBe(
      String(blockedBody.retryAfter),
    );

    vi.advanceTimersByTime(15 * 60 * 1000 + 1_000);

    const reopenedResponse = await verifyEmailPost(
      createVerifyEmailPostRequest({
        email: "customer@example.com",
      }),
    );
    const reopenedBody = await reopenedResponse.json();

    expect(reopenedResponse.status).toBe(200);
    expect(reopenedBody).toEqual({
      message:
        "Se o email existir e ainda não tiver sido verificado, você receberá um novo link de verificação.",
      success: true,
    });
    expect(mockDb.user.findUnique).toHaveBeenCalledTimes(4);
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(4);
  });
});
