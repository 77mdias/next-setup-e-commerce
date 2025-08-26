import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-config";

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 Testando configuração do Stripe...");

    // Verificar variáveis de ambiente
    const envCheck = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log("🔧 Variáveis de ambiente:", envCheck);

    // Testar conexão com Stripe
    const account = await stripe.accounts.retrieve();

    console.log("✅ Conexão com Stripe estabelecida:", {
      accountId: account.id,
      environment: account.object,
    });

    return NextResponse.json({
      success: true,
      message: "Configuração do Stripe está funcionando corretamente",
      data: {
        account: {
          id: account.id,
          object: account.object,
          country: account.country,
        },
        environment: process.env.NODE_ENV,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        envCheck,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao testar Stripe:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro na configuração do Stripe",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    );
  }
}
