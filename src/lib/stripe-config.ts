import Stripe from "stripe";

// Validação das variáveis de ambiente
const validateStripeConfig = () => {
  const errors: string[] = [];

  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push("STRIPE_SECRET_KEY não está definida");
  }

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    errors.push("NEXT_PUBLIC_BASE_URL não está definida");
  }

  if (errors.length > 0) {
    console.error("❌ Erros de configuração do Stripe:", errors);
    throw new Error(`Configuração do Stripe inválida: ${errors.join(", ")}`);
  }

  console.log("✅ Configuração do Stripe validada com sucesso");
  console.log("🔧 Ambiente:", process.env.NODE_ENV);
  console.log("🔧 Base URL:", process.env.NEXT_PUBLIC_BASE_URL);
  console.log(
    "🔧 Stripe Key:",
    process.env.STRIPE_SECRET_KEY?.substring(0, 10) + "...",
  );
};

// Validar configuração na inicialização
validateStripeConfig();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Função para criar sessão com logs detalhados
export const createStripeCheckoutSession = async (sessionData: any) => {
  try {
    console.log("🔧 Iniciando criação da sessão do Stripe");
    console.log("🔧 Dados da sessão:", {
      itemsCount: sessionData.line_items?.length || 0,
      mode: sessionData.mode,
      successUrl: sessionData.success_url,
      cancelUrl: sessionData.cancel_url,
      customerEmail: sessionData.customer_email,
    });

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log("✅ Sessão do Stripe criada com sucesso:", {
      sessionId: session.id,
      url: session.url,
    });

    return session;
  } catch (error) {
    console.error("❌ Erro ao criar sessão do Stripe:", error);

    if (error instanceof Stripe.errors.StripeError) {
      console.error("❌ Erro específico do Stripe:", {
        type: error.type,
        code: error.code,
        message: error.message,
        decline_code: (error as any).decline_code,
      });
    }

    throw error;
  }
};
