import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-config";

function extractClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    return firstIp?.trim() || null;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  return null;
}

function parseAllowedIps(rawValue: string | undefined) {
  if (!rawValue) {
    return new Set<string>();
  }

  return new Set(
    rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export async function GET(request: NextRequest) {
  const nodeEnv = process.env.NODE_ENV;
  const enableTestStripeEndpoint = process.env.ENABLE_TEST_STRIPE_ENDPOINT;
  const internalDebugKey = process.env.INTERNAL_DEBUG_KEY;
  const allowedIps = parseAllowedIps(process.env.TEST_STRIPE_ALLOWED_IPS);

  if (nodeEnv === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (nodeEnv !== "development") {
    if (enableTestStripeEndpoint !== "true") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const providedDebugKey = request.headers.get("x-internal-debug-key");
    const isAuthorizedDebugAccess =
      !!internalDebugKey && providedDebugKey === internalDebugKey;

    if (!isAuthorizedDebugAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const clientIp = extractClientIp(request);
    if (!clientIp || !allowedIps.has(clientIp)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  try {
    // Verificar configurações
    const config = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
      NODE_ENV: nodeEnv,
    };

    console.log("🔧 Configurações do Stripe:", config);

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY não configurada" },
        { status: 500 },
      );
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_BASE_URL não configurada" },
        { status: 500 },
      );
    }

    // Testar conexão com Stripe
    const testSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Teste de Configuração",
              description: "Produto de teste para verificar configuração",
            },
            unit_amount: 1000, // R$ 10,00
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/test-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/test-cancel`,
      metadata: {
        test: "true",
        orderId: "test-123",
      },
    });

    return NextResponse.json({
      success: true,
      config,
      testSession: {
        id: testSession.id,
        url: testSession.url,
        status: testSession.status,
      },
      message: "Configuração do Stripe está funcionando corretamente",
    });
  } catch (error) {
    console.error("❌ Erro ao testar Stripe:", error);

    return NextResponse.json(
      {
        error: "Erro ao testar configuração do Stripe",
      },
      { status: 500 },
    );
  }
}
