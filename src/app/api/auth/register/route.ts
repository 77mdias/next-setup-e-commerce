import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { sendVerificationEmail, generateVerificationToken } from "@/lib/email";

// Função para validar senha com requisitos de segurança
function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Mínimo 8 caracteres
  if (password.length < 8) {
    errors.push("A senha deve ter pelo menos 8 caracteres");
  }

  // Pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula (A-Z)");
  }

  // Pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula (a-z)");
  }

  // Pelo menos um número
  if (!/\d/.test(password)) {
    errors.push("A senha deve conter pelo menos um número (0-9)");
  }

  // Pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(
      "A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, cpf, callbackUrl } = await request.json();

    if (!name || !email || !password || !cpf) {
      return NextResponse.json(
        { message: "Nome, email, senha e CPF são obrigatórios" },
        { status: 400 },
      );
    }

    // Validação de senha robusta
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          message: "Senha não atende aos requisitos de segurança",
          details: passwordValidation.errors,
        },
        { status: 400 },
      );
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
    const existingCpf = await db.user.findUnique({
      where: {
        cpf,
      },
    });

    if (existingCpf) {
      return NextResponse.json(
        { message: "Usuário já existe com este CPF" },
        { status: 400 },
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Gerar token de verificação
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Criar o usuário
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        cpf,
        role: UserRole.CUSTOMER,
        isActive: false, // Usuário inativo até verificar email
        emailVerificationToken: verificationToken,
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
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
