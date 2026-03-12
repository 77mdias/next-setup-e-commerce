import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import {
  cleanupExpiredResetPasswordTokens,
  getResetPasswordTokenExpiry,
} from "@/lib/auth-token-lifecycle";
import { sendPasswordResetEmail } from "@/lib/email";
import { createRequestLogger } from "@/lib/logger";
import { generateSecurityTokenPair } from "@/lib/secure-token";

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
