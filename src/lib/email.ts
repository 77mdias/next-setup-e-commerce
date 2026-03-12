import nodemailer from "nodemailer";
import { normalizeCallbackPath } from "@/lib/callback-url";
import { createLogger } from "@/lib/logger";
import {
  generateSecurityToken,
  generateSecurityTokenPair,
  hashSecurityToken,
} from "@/lib/secure-token";

const emailLogger = createLogger({
  route: "/lib/email",
});

type EmailSendResult = { success: true } | { success: false; error: unknown };

function createEmailTransporter() {
  // AIDEV-CRITICAL: manter validacao de certificado TLS habilitada.
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use uma senha de app do Gmail
    },
  });
}

function buildCallbackQuery(callbackUrl?: string): string {
  if (!callbackUrl) {
    return "";
  }

  const safeCallbackPath = normalizeCallbackPath(callbackUrl);
  return `&callbackUrl=${encodeURIComponent(safeCallbackPath)}`;
}

async function sendWithConfiguredTransport(mailOptions: {
  from: string | undefined;
  to: string;
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  try {
    const transporter = createEmailTransporter();
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// Função para enviar email de verificação
export async function sendVerificationEmail(
  email: string,
  token: string,
  callbackUrl?: string,
): Promise<EmailSendResult> {
  const baseUrl = process.env.NEXTAUTH_URL;
  const callbackQuery = buildCallbackQuery(callbackUrl);

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

  const result = await sendWithConfiguredTransport(mailOptions);

  if (!result.success) {
    emailLogger.error("email.verification_send_failed", {
      context: {
        email,
      },
      error: result.error,
    });
  }

  return result;
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName?: string | null,
  callbackUrl?: string,
): Promise<EmailSendResult> {
  const baseUrl = process.env.NEXTAUTH_URL;
  const callbackQuery = buildCallbackQuery(callbackUrl);
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}${callbackQuery}`;
  const recipientName =
    typeof userName === "string" && userName.trim() ? userName : "Usuário";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Redefinir senha - My Store",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Redefinir sua senha</h2>
        <p>Olá ${recipientName},</p>
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
    `,
  };

  const result = await sendWithConfiguredTransport(mailOptions);

  if (!result.success) {
    emailLogger.error("email.password_reset_send_failed", {
      context: {
        email,
      },
      error: result.error,
    });
  }

  return result;
}

// Funções para geração e hash de token de verificação
export function generateVerificationToken(): string {
  return generateSecurityToken();
}

export function hashVerificationToken(token: string): string {
  return hashSecurityToken(token);
}

export function generateVerificationTokenPair(): {
  token: string;
  tokenHash: string;
} {
  return generateSecurityTokenPair();
}
