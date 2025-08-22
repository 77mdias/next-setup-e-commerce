import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Token de verificação é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar usuário com o token
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(), // Token ainda não expirou
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Token inválido ou expirado" },
        { status: 400 },
      );
    }

    // Ativar o usuário e limpar o token
    await db.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return NextResponse.json({
      message: "Email verificado com sucesso! Sua conta foi ativada.",
      success: true,
    });
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// Rota para reenviar email de verificação
export async function POST(request: NextRequest) {
  try {
    const { email, callbackUrl } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (user.isActive) {
      return NextResponse.json(
        { message: "Email já foi verificado" },
        { status: 400 },
      );
    }

    // Gerar novo token
    const { generateVerificationToken, sendVerificationEmail } = await import(
      "@/lib/email"
    ).catch(() => {
      throw new Error("Erro ao importar módulo de email");
    });
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Atualizar token no banco
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Enviar novo email
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      callbackUrl,
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { message: "Erro ao enviar email de verificação" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Email de verificação reenviado com sucesso",
      success: true,
    });
  } catch (error) {
    console.error("Erro ao reenviar email:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
