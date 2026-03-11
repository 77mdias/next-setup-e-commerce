import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getEmailVerificationTokenExpiry } from "@/lib/auth-token-lifecycle";
import {
  generateVerificationTokenPair,
  sendVerificationEmail,
} from "@/lib/email";
import { createRequestLogger } from "@/lib/logger";
import { createPasswordPolicyErrorPayload } from "@/lib/password-policy";

export async function POST(request: NextRequest) {
  const logger = createRequestLogger({
    headers: request.headers,
    route: "/api/auth/register",
  });

  try {
    const { name, email, password, cpf, callbackUrl } = await request.json();
    const normalizedCpf =
      typeof cpf === "string" && cpf.trim().length > 0 ? cpf.trim() : null;
    const now = new Date();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nome, email e senha são obrigatórios" },
        { status: 400 },
      );
    }

    // Validação de senha robusta
    const passwordPolicyError = createPasswordPolicyErrorPayload(password);
    if (passwordPolicyError.details.length > 0) {
      return NextResponse.json(passwordPolicyError, {
        status: 400,
      });
    }

    // Verificar se o usuário já existe
    const existingUser = await db.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Usuário já existe com este email" },
        { status: 400 },
      );
    }

    // Verificar se o CPF já existe
    if (normalizedCpf) {
      const existingCpf = await db.user.findUnique({
        where: {
          cpf: normalizedCpf,
        },
      });

      if (existingCpf) {
        return NextResponse.json(
          { message: "Usuário já existe com este CPF" },
          { status: 400 },
        );
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Gerar token de verificação seguro
    const { token: verificationToken, tokenHash: verificationTokenHash } =
      generateVerificationTokenPair();
    const verificationExpires = getEmailVerificationTokenExpiry(now);

    // Criar o usuário
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        cpf: normalizedCpf,
        role: UserRole.CUSTOMER,
        isActive: false, // Usuário inativo até verificar email
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationExpires: verificationExpires,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Enviar email de verificação
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      callbackUrl,
    );

    if (!emailResult.success) {
      logger.error("auth.register.verification_email_failed", {
        data: {
          userId: user.id,
          email,
        },
      });
      // Se falhar ao enviar email, deletar o usuário criado
      await db.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { message: "Erro ao enviar email de verificação. Tente novamente." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message:
        "Usuário criado com sucesso. Verifique seu email para ativar sua conta.",
      user,
      emailSent: true,
    });
  } catch (error) {
    logger.error("auth.register.create_failed", { error });
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
