import Stripe from "stripe";

import { createLogger } from "@/lib/logger";

const stripeLogger = createLogger({
  route: "/lib/stripe-config",
});

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
    stripeLogger.error("stripe.config.invalid", {
      data: {
        errors,
      },
    });
    throw new Error(`Configuração do Stripe inválida: ${errors.join(", ")}`);
  }

  stripeLogger.info("stripe.config.validated", {
    data: {
      environment: process.env.NODE_ENV ?? null,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? null,
      hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    },
  });
};

// Validar configuração na inicialização
validateStripeConfig();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Função para criar sessão com logs detalhados
export const createStripeCheckoutSession = async (
  sessionData: Stripe.Checkout.SessionCreateParams,
) => {
  try {
    stripeLogger.info("stripe.checkout_session.create_started", {
      data: {
        itemsCount: sessionData.line_items?.length ?? 0,
        mode: sessionData.mode ?? null,
        successUrl: sessionData.success_url ?? null,
        cancelUrl: sessionData.cancel_url ?? null,
        customerEmail: sessionData.customer_email ?? null,
      },
    });

    const session = await stripe.checkout.sessions.create(sessionData);

    stripeLogger.info("stripe.checkout_session.create_succeeded", {
      data: {
        sessionId: session.id,
        hasUrl: Boolean(session.url),
      },
    });

    return session;
  } catch (error) {
    stripeLogger.error("stripe.checkout_session.create_failed", {
      error,
    });

    if (error instanceof Stripe.errors.StripeError) {
      stripeLogger.error("stripe.checkout_session.create_stripe_error", {
        data: {
          type: error.type,
          code: error.code,
          message: error.message,
          declineCode:
            (error as { decline_code?: string }).decline_code ?? null,
        },
      });
    }

    throw error;
  }
};

export const expireStripeCheckoutSession = async (sessionId: string) => {
  try {
    stripeLogger.info("stripe.checkout_session.expire_started", {
      context: {
        checkoutSessionId: sessionId,
      },
    });
    await stripe.checkout.sessions.expire(sessionId);
    stripeLogger.info("stripe.checkout_session.expire_succeeded", {
      context: {
        checkoutSessionId: sessionId,
      },
    });
  } catch (error) {
    stripeLogger.error("stripe.checkout_session.expire_failed", {
      context: {
        checkoutSessionId: sessionId,
      },
      error,
    });
    throw error;
  }
};
