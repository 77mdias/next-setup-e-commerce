import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, cpf } = await request.json();

    if (!name || !email || !password || !cpf) {
      return NextResponse.json(
        { message: "Nome, email, senha e CPF são obrigatórios" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "A senha deve ter pelo menos 6 caracteres" },
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

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar o usuário
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        cpf,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
