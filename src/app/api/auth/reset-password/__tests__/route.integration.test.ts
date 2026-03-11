import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockBcryptHash, mockDb, mockHashSecurityToken } = vi.hoisted(() => ({
  mockBcryptHash: vi.fn(),
  mockDb: {
    user: {
      updateMany: vi.fn(),
    },
  },
  mockHashSecurityToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/secure-token", () => ({
  hashSecurityToken: mockHashSecurityToken,
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: mockBcryptHash,
  },
}));

import { POST } from "@/app/api/auth/reset-password/route";

function createRequest(payload: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req-auth-reset-password-test",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/auth/reset-password integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockHashSecurityToken.mockReturnValue("hashed-reset-token");
    mockBcryptHash.mockResolvedValue("hashed-password");
    mockDb.user.updateMany.mockResolvedValue({ count: 1 });
  });

  it("consumes reset token atomically using token hash", async () => {
    const response = await POST(
      createRequest({
        email: "Customer@Example.com ",
        newPassword: "StrongPass1!",
        token: " plain-reset-token ",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Senha redefinida com sucesso");

    expect(mockHashSecurityToken).toHaveBeenCalledWith("plain-reset-token");
    expect(mockBcryptHash).toHaveBeenCalledWith("StrongPass1!", 12);

    expect(mockDb.user.updateMany).toHaveBeenCalledWith({
      where: {
        email: "customer@example.com",
        resetPasswordTokenHash: "hashed-reset-token",
        resetPasswordExpires: {
          gt: expect.any(Date),
        },
      },
      data: {
        password: "hashed-password",
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
      },
    });
  });

  it("blocks weak password using shared policy response payload", async () => {
    const response = await POST(
      createRequest({
        email: "customer@example.com",
        newPassword: "weak",
        token: "valid-token",
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
    expect(mockHashSecurityToken).not.toHaveBeenCalled();
    expect(mockBcryptHash).not.toHaveBeenCalled();
    expect(mockDb.user.updateMany).not.toHaveBeenCalled();
  });

  it("returns consistent response for invalid, expired or already used token", async () => {
    mockDb.user.updateMany.mockResolvedValueOnce({ count: 0 });

    const response = await POST(
      createRequest({
        email: "customer@example.com",
        newPassword: "StrongPass1!",
        token: "invalid-token",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Token inválido, expirado ou já utilizado");
    expect(mockDb.user.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        email: "customer@example.com",
        resetPasswordExpires: {
          lte: expect.any(Date),
        },
        resetPasswordTokenHash: "hashed-reset-token",
      },
      data: {
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
      },
    });
  });

  it("returns 400 when reset token is missing", async () => {
    const response = await POST(
      createRequest({
        email: "customer@example.com",
        newPassword: "StrongPass1!",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Token de reset é obrigatório");
    expect(mockHashSecurityToken).not.toHaveBeenCalled();
    expect(mockDb.user.updateMany).not.toHaveBeenCalled();
  });
});
