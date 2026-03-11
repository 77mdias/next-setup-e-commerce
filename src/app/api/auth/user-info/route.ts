import { NextRequest, NextResponse } from "next/server";

import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const logger = createRequestLogger({
    headers: request.headers,
    route: "/api/auth/user-info",
  });

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    logger.info("auth.user_info.request_received", {
      data: {
        emailProvided: Boolean(email),
      },
    });

    if (!email) {
      logger.warn("auth.user_info.missing_email");
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
      logger.info("auth.user_info.user_not_found", {
        data: {
          email,
        },
      });
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    logger.info("auth.user_info.user_resolved", {
      data: {
        email,
        hasPassword: Boolean(user.password),
        oauthProviders: user.accounts.map((acc) => acc.provider),
      },
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
    logger.error("auth.user_info.lookup_failed", { error });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
