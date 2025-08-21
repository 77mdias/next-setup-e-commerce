import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    console.log("API user-info - Email recebido:", email);

    if (!email) {
      console.log("API user-info - Email não fornecido");
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar usuário com suas contas OAuth
    const user = await db.user.findUnique({
      where: { email },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      console.log("API user-info - Usuário não encontrado para email:", email);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    console.log("API user-info - Usuário encontrado:", {
      hasPassword: !!user.password,
      oauthProviders: user.accounts.map((acc) => acc.provider),
    });

    // Determinar se o usuário tem senha
    const hasPassword = !!user.password;

    // Obter provedores OAuth
    const oauthProviders = user.accounts.map((account) => account.provider);

    return NextResponse.json({
      hasPassword,
      oauthProviders,
      email: user.email,
    });
  } catch (error) {
    console.error("Erro ao buscar informações do usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
