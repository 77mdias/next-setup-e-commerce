import { NextRequest, NextResponse } from "next/server";

import { createRequestLogger } from "@/lib/logger";

const PUBLIC_AUTH_RECOVERY_GUIDANCE = {
  message:
    "Por segurança, não confirmamos os métodos vinculados a um email específico.",
  details: [
    "Use o método de autenticação originalmente utilizado no cadastro.",
    "Se não lembrar o método, tente recuperar a conta por email.",
  ],
};

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
    // AIDEV-CRITICAL: Public auth endpoint must never disclose account existence.
    return NextResponse.json(PUBLIC_AUTH_RECOVERY_GUIDANCE);
  } catch (error) {
    logger.error("auth.user_info.lookup_failed", { error });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
