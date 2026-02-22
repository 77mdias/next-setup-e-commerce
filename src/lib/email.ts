import nodemailer from "nodemailer";
import { normalizeCallbackPath } from "@/lib/callback-url";

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use uma senha de app do Gmail
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Função para enviar email de verificação
export async function sendVerificationEmail(
  email: string,
  token: string,
  callbackUrl?: string,
) {
  const baseUrl = process.env.NEXTAUTH_URL;
  const safeCallbackPath = normalizeCallbackPath(callbackUrl);
  const callbackQuery = callbackUrl
    ? `&callbackUrl=${encodeURIComponent(safeCallbackPath)}`
    : "";

  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}${callbackQuery}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verifique seu email - My Store",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Bem-vindo ao My Store!</h2>
        <p>Olá! Obrigado por se cadastrar em nossa plataforma.</p>
        <p>Para ativar sua conta, clique no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verificar Email
          </a>
        </div>
        <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>Este link expira em 24 horas.</p>
        <p>Se você não criou uma conta, ignore este email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          My Store - Sua loja online de confiança
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error };
  }
}

// Função para gerar token de verificação
export function generateVerificationToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
