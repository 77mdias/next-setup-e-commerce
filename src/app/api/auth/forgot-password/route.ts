import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import {
  cleanupExpiredResetPasswordTokens,
  getResetPasswordTokenExpiry,
} from "@/lib/auth-token-lifecycle";
import { sendPasswordResetEmail } from "@/lib/email";
import { createRequestLogger } from "@/lib/logger";
import {
  consumeRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";
import { generateSecurityTokenPair } from "@/lib/secure-token";

const FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const FORGOT_PASSWORD_RATE_LIMIT_MESSAGE =
  "Muitas tentativas de recuperação de senha. Tente novamente em instantes.";

export async function POST(request: NextRequest) {
  const logger = createRequestLogger({
    headers: request.headers,
    route: "/api/auth/forgot-password",
  });

  try {
    const { email, callbackUrl } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const now = new Date();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 },
      );
    }

    const rateLimitResult = consumeRequestRateLimit({
      headers: request.headers,
      scope: "auth.forgot_password",
      now,
      ip: {
        limit: 5,
        windowMs: FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
      },
      identities: [
        {
          key: "email",
          value: normalizedEmail,
          limit: 3,
          windowMs: FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
        },
      ],
    });

    if (!rateLimitResult.allowed) {
      logger.warn("auth.forgot_password.rate_limited", {
        data: {
          bucketKey: rateLimitResult.bucketKey,
          emailProvided: true,
          limit: rateLimitResult.limit,
          retryAfter: rateLimitResult.retryAfter,
          windowMs: rateLimitResult.windowMs,
        },
      });

      return createRateLimitResponse({
        message: FORGOT_PASSWORD_RATE_LIMIT_MESSAGE,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      return NextResponse.json(
        {
          message:
            "Se o email existir, você receberá um link para redefinir sua senha",
        },
        { status: 200 },
      );
    }

    await cleanupExpiredResetPasswordTokens({
      referenceDate: now,
      userId: user.id,
    });

    // Gerar token único
    const { token: resetToken, tokenHash: resetTokenHash } =
      generateSecurityTokenPair();
    const resetTokenExpiry = getResetPasswordTokenExpiry(now);

    // Salvar apenas o hash do token no banco.
    // O valor anterior (se existir) é sobrescrito e invalidado imediatamente.
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: resetTokenHash,
        resetPasswordExpires: resetTokenExpiry,
      },
    });

    const emailResult = await sendPasswordResetEmail(
      normalizedEmail,
      resetToken,
      user.name,
      callbackUrl,
    );

    if (!emailResult.success) {
      logger.error("auth.forgot_password.email_delivery_failed", {
        context: {
          emailProvided: true,
        },
        error: emailResult.error,
      });
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Se o email existir, você receberá um link para redefinir sua senha",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("auth.forgot_password.request_failed", { error });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
