import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";
import {
  cleanupExpiredResetPasswordTokens,
  getResetPasswordTokenExpiry,
} from "@/lib/auth-token-lifecycle";
import { normalizeCallbackPath } from "@/lib/callback-url";
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

    const safeCallbackPath = normalizeCallbackPath(callbackUrl);
    const callbackQuery = callbackUrl
      ? `&callbackUrl=${encodeURIComponent(safeCallbackPath)}`
      : "";

    // Construir URL canônica de reset
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}${callbackQuery}`;

    // Configurar transporter de email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Enviar email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Redefinir sua senha</h2>
        <p>Olá ${user.name || "Usuário"},</p>
        <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Redefinir senha
          </a>
        </p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
        <p>Obrigado,<br>Equipe da My Store</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Redefinir senha - My Store",
      html: emailContent,
    });

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
