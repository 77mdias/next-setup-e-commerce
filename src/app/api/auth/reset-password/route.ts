import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cleanupExpiredResetPasswordTokens } from "@/lib/auth-token-lifecycle";
import { createRequestLogger } from "@/lib/logger";
import { createPasswordPolicyErrorPayload } from "@/lib/password-policy";
import { hashSecurityToken } from "@/lib/secure-token";

export async function POST(request: NextRequest) {
  const logger = createRequestLogger({
    headers: request.headers,
    route: "/api/auth/reset-password",
  });

  try {
    const { email, newPassword, token } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedToken = typeof token === "string" ? token.trim() : "";
    const now = new Date();

    if (!normalizedEmail || !newPassword) {
      return NextResponse.json(
        { error: "Email e nova senha são obrigatórios" },
        { status: 400 },
      );
    }

    if (!normalizedToken) {
      return NextResponse.json(
        { error: "Token de reset é obrigatório" },
        { status: 400 },
      );
    }

    const passwordPolicyError = createPasswordPolicyErrorPayload(newPassword);
    if (passwordPolicyError.details.length > 0) {
      return NextResponse.json(passwordPolicyError, {
        status: 400,
      });
    }

    const tokenHash = hashSecurityToken(normalizedToken);

    // Consumir token de forma atômica para evitar reuso concorrente.
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const resetResult = await db.user.updateMany({
      where: {
        email: normalizedEmail,
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: {
          gt: now,
        },
      },
      data: {
        password: hashedPassword,
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
      },
    });

    if (resetResult.count === 0) {
      await cleanupExpiredResetPasswordTokens({
        email: normalizedEmail,
        referenceDate: now,
        tokenHash,
      });

      return NextResponse.json(
        { error: "Token inválido, expirado ou já utilizado" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Senha redefinida com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    logger.error("auth.reset_password.request_failed", { error });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
