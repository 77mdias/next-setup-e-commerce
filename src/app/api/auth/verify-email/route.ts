import { NextRequest, NextResponse } from "next/server";

import {
  cleanupExpiredVerificationTokens,
  getEmailVerificationTokenExpiry,
} from "@/lib/auth-token-lifecycle";
import {
  generateVerificationTokenPair,
  hashVerificationToken,
  sendVerificationEmail,
} from "@/lib/email";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  consumeRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

const RESEND_VERIFICATION_NEUTRAL_RESPONSE = {
  message:
    "Se o email existir e ainda não tiver sido verificado, você receberá um novo link de verificação.",
  success: true,
};
const VERIFY_EMAIL_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_EMAIL_CONSUME_RATE_LIMIT_MESSAGE =
  "Muitas tentativas de verificação de email. Tente novamente em instantes.";
const VERIFY_EMAIL_RESEND_RATE_LIMIT_MESSAGE =
  "Muitas tentativas de reenvio do email de verificação. Tente novamente em instantes.";

export async function GET(request: NextRequest) {
  const logger = createRequestLogger({
    headers: request.headers,
    route: "/api/auth/verify-email",
  });

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const now = new Date();

    if (!token) {
      return NextResponse.json(
        { message: "Token de verificação é obrigatório" },
        { status: 400 },
      );
    }

    const tokenHash = hashVerificationToken(token);
    const rateLimitResult = consumeRequestRateLimit({
      headers: request.headers,
      scope: "auth.verify_email.consume",
      now,
      ip: {
        limit: 10,
        windowMs: VERIFY_EMAIL_RATE_LIMIT_WINDOW_MS,
      },
      identities: [
        {
          key: "token",
          value: tokenHash,
          limit: 5,
          windowMs: VERIFY_EMAIL_RATE_LIMIT_WINDOW_MS,
        },
      ],
    });

    if (!rateLimitResult.allowed) {
      logger.warn("auth.verify_email.consume.rate_limited", {
        data: {
          bucketKey: rateLimitResult.bucketKey,
          limit: rateLimitResult.limit,
          retryAfter: rateLimitResult.retryAfter,
          tokenProvided: true,
          windowMs: rateLimitResult.windowMs,
        },
      });

      return createRateLimitResponse({
        key: "message",
        message: VERIFY_EMAIL_CONSUME_RATE_LIMIT_MESSAGE,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    // Buscar usuário com hash de token válido
    const user = await db.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpires: {
          gt: now, // Token ainda não expirou
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      await cleanupExpiredVerificationTokens({
        referenceDate: now,
        tokenHash,
      });

      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 400 },
      );
    }

    // Consumir token de forma atômica para evitar reuso concorrente.
    const verificationResult = await db.user.updateMany({
      where: {
        id: user.id,
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpires: {
          gt: now,
        },
      },
      data: {
        isActive: true,
        emailVerified: now,
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
      },
    });

    if (verificationResult.count === 0) {
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Email verificado com sucesso! Sua conta foi ativada.",
      success: true,
      email: user.email,
    });
  } catch (error) {
    logger.error("auth.verify_email.request_failed", { error });
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// Rota para reenviar email de verificação
export async function POST(request: NextRequest) {
  const logger = createRequestLogger({
    headers: request.headers,
    route: "/api/auth/verify-email",
  });

  try {
    const { email, callbackUrl } = await request.json();
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const now = new Date();

    if (!normalizedEmail) {
      return NextResponse.json(
        { message: "Email é obrigatório" },
        { status: 400 },
      );
    }

    const rateLimitResult = consumeRequestRateLimit({
      headers: request.headers,
      scope: "auth.verify_email.resend",
      now,
      ip: {
        limit: 5,
        windowMs: VERIFY_EMAIL_RATE_LIMIT_WINDOW_MS,
      },
      identities: [
        {
          key: "email",
          value: normalizedEmail,
          limit: 3,
          windowMs: VERIFY_EMAIL_RATE_LIMIT_WINDOW_MS,
        },
      ],
    });

    if (!rateLimitResult.allowed) {
      logger.warn("auth.verify_email.resend.rate_limited", {
        data: {
          bucketKey: rateLimitResult.bucketKey,
          emailProvided: true,
          limit: rateLimitResult.limit,
          retryAfter: rateLimitResult.retryAfter,
          windowMs: rateLimitResult.windowMs,
        },
      });

      return createRateLimitResponse({
        key: "message",
        message: VERIFY_EMAIL_RESEND_RATE_LIMIT_MESSAGE,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // AIDEV-CRITICAL: resposta neutra para evitar enumeração de conta.
      return NextResponse.json(RESEND_VERIFICATION_NEUTRAL_RESPONSE);
    }

    await cleanupExpiredVerificationTokens({
      referenceDate: now,
      userId: user.id,
    });

    if (user.isActive) {
      return NextResponse.json(RESEND_VERIFICATION_NEUTRAL_RESPONSE);
    }

    // Gerar novo token seguro
    const { token: verificationToken, tokenHash: verificationTokenHash } =
      generateVerificationTokenPair();
    const verificationExpires = getEmailVerificationTokenExpiry(now);

    // Atualizar hash do token no banco.
    // O valor anterior (se existir) é sobrescrito e imediatamente invalidado.
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Enviar novo email
    const emailResult = await sendVerificationEmail(
      normalizedEmail,
      verificationToken,
      callbackUrl,
    );

    if (!emailResult.success) {
      logger.error("auth.verify_email.resend_email_delivery_failed", {
        data: {
          emailProvided: true,
        },
      });
      return NextResponse.json(RESEND_VERIFICATION_NEUTRAL_RESPONSE);
    }

    return NextResponse.json(RESEND_VERIFICATION_NEUTRAL_RESPONSE);
  } catch (error) {
    logger.error("auth.verify_email.resend_failed", { error });
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
