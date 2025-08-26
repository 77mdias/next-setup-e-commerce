import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, callbackUrl } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { email },
      include: {
        stores: true,
      },
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

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token no banco
    await db.user.update({
      where: { email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      },
    });

    // Construir URL de reset - extrair slug do callbackUrl se existir
    let resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // Adicionar callbackUrl se fornecido
    if (callbackUrl) {
      resetUrl += `&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }

    // Se o usuário tem uma loja associada, usar o slug da loja
    if (user.stores && user.stores.length > 0) {
      const userStore = user.stores[0];
      resetUrl = `${process.env.NEXTAUTH_URL}/${userStore.slug}/auth/reset-password?token=${resetToken}`;

      // Adicionar callbackUrl se fornecido
      if (callbackUrl) {
        resetUrl += `&callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
    }

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
      to: email,
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
    console.error("Erro ao processar solicitação de reset de senha:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
