import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, token } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email e nova senha são obrigatórios" },
        { status: 400 },
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Token de reset é obrigatório" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 },
      );
    }

    // Buscar usuário com o token válido
    const user = await db.user.findFirst({
      where: {
        email,
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 },
      );
    }

    // Criptografar nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha e limpar token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json(
      { message: "Senha redefinida com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
