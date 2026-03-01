import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/prisma";

type WebhookProcessResult = {
  completed: boolean;
  failureReason?: string;
  response: NextResponse;
};

function resolvePaymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null,
) {
  if (!paymentIntent) {
    return null;
  }

  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isPrismaUniqueConstraintError(
  error: unknown,
): error is { code: string } {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (error as { code?: string }).code === "P2002";
}

async function registerOrShortCircuitEvent(
  event: Stripe.Event,
  payload: string,
): Promise<NextResponse | null> {
  const now = new Date();

  try {
    await db.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        payload,
        status: "PROCESSING",
        lastReceivedAt: now,
      },
    });

    return null;
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error)) {
      throw error;
    }

    const existingEvent = await db.stripeWebhookEvent.findUnique({
      where: { eventId: event.id },
      select: { status: true },
    });

    if (!existingEvent) {
      throw error;
    }

    if (existingEvent.status === "COMPLETED") {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    if (existingEvent.status === "PROCESSING") {
      return NextResponse.json({ received: true, processing: true });
    }

    const retryClaim = await db.stripeWebhookEvent.updateMany({
      where: {
        eventId: event.id,
        status: "FAILED",
      },
      data: {
        status: "PROCESSING",
        payload,
        lastReceivedAt: now,
        processedAt: null,
        lastError: null,
        attemptCount: { increment: 1 },
      },
    });

    if (retryClaim.count === 0) {
      return NextResponse.json({ received: true, processing: true });
    }

    return null;
  }
}

async function markWebhookEventCompleted(eventId: string) {
  await db.stripeWebhookEvent.updateMany({
    where: { eventId },
    data: {
      status: "COMPLETED",
      processedAt: new Date(),
      lastError: null,
    },
  });
}

async function markWebhookEventFailed(eventId: string, failureReason: string) {
  await db.stripeWebhookEvent.updateMany({
    where: { eventId },
    data: {
      status: "FAILED",
      lastError: failureReason,
      processedAt: null,
    },
  });
}

async function processWebhookEvent(
  event: Stripe.Event,
): Promise<WebhookProcessResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const checkoutSessionId = session.id;
      const paymentIntentId = resolvePaymentIntentId(session.payment_intent);

      console.log("🔍 ID do pedido:", orderId);
      console.log("📋 Metadata completa:", session.metadata);
      console.log("💰 Status do pagamento:", session.payment_status);
      console.log("💳 ID do payment intent:", paymentIntentId);

      if (!orderId) {
        console.warn("⚠️ ID do pedido não encontrado nos metadados");
        return {
          completed: true,
          response: NextResponse.json({
            received: true,
            warning: "No order ID found",
          }),
        };
      }

      const existingOrder = await db.order.findUnique({
        where: {
          id: Number(orderId),
        },
        include: {
          store: { select: { slug: true } },
        },
      });

      if (!existingOrder) {
        console.error("❌ Pedido não encontrado no banco de dados:", orderId);
        return {
          completed: false,
          failureReason: `Order ${orderId} not found`,
          response: NextResponse.json(
            { error: "Order not found", orderId },
            { status: 404 },
          ),
        };
      }

      console.log(
        "📊 Pedido encontrado, status atual:",
        existingOrder.status,
        "paymentStatus:",
        existingOrder.paymentStatus,
      );

      const updatedOrder = await db.order.update({
        where: {
          id: Number(orderId),
        },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          stripeCheckoutSessionId:
            existingOrder.stripeCheckoutSessionId ?? checkoutSessionId,
          stripePaymentIntentId: paymentIntentId,
          stripePaymentId: paymentIntentId ?? checkoutSessionId,
        },
        include: {
          store: { select: { slug: true } },
          items: true,
        },
      });

      console.log("✅ Pedido atualizado com sucesso:", {
        orderId: updatedOrder.id,
        newStatus: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        stripeCheckoutSessionId: updatedOrder.stripeCheckoutSessionId,
        stripePaymentIntentId: updatedOrder.stripePaymentIntentId,
      });

      const payment = await db.payment.create({
        data: {
          orderId: Number(orderId),
          method: "stripe",
          amount: updatedOrder.total,
          status: "PAID",
          stripePaymentId: paymentIntentId ?? undefined,
          paidAt: new Date(),
        },
      });

      console.log("💰 Registro de pagamento criado com sucesso:", {
        paymentId: payment.id,
        amount: payment.amount,
        status: payment.status,
      });

      return {
        completed: true,
        response: NextResponse.json({ received: true }),
      };
    }

    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
    case "charge.failed": {
      const failedSession = event.data.object as Stripe.Checkout.Session;
      const failedOrderId = failedSession.metadata?.orderId;

      if (failedOrderId) {
        const failedOrder = await db.order.findUnique({
          where: {
            id: Number(failedOrderId),
          },
        });

        if (failedOrder) {
          await db.order.update({
            where: { id: Number(failedOrderId) },
            data: {
              status: "CANCELLED",
              paymentStatus: "FAILED",
              cancelledAt: new Date(),
              cancelReason: "Pagamento falhou ou expirou",
            },
          });

          console.log(
            "❌ Pedido cancelado devido a falha no pagamento:",
            failedOrderId,
          );
        }
      }

      return {
        completed: true,
        response: NextResponse.json({ received: true }),
      };
    }

    default:
      console.log("ℹ️ Evento não processado:", event.type);
      return {
        completed: true,
        response: NextResponse.json({ received: true }),
      };
  }
}

export async function POST(request: NextRequest) {
  // Verificar se as variáveis de ambiente estão configuradas
  if (!process.env.STRIPE_WEBHOOK_SECRET_KEY) {
    console.error("STRIPE_WEBHOOK_SECRET_KEY não está configurada");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Verificar se a chave secreta do Stripe está configurada
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ Chave secreta do Stripe não encontrada");
    return NextResponse.json(
      { error: "Missing Stripe secret key" },
      { status: 500 },
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-07-30.basil",
  });

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("Stripe signature não encontrada nos headers");
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;

  if (!webhookSecret) {
    console.error("❌ Chave secreta do webhook do Stripe não encontrada");
    return NextResponse.json(
      { error: "Missing Stripe webhook secret key" },
      { status: 500 },
    );
  }

  const text = await request.text();
  console.log("📄 Corpo da requisição recebido, tamanho:", text.length);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(text, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("🔍 Evento recebido:", event.type, "id:", event.id);

  try {
    const shortCircuitResponse = await registerOrShortCircuitEvent(event, text);

    if (shortCircuitResponse) {
      return shortCircuitResponse;
    }

    const result = await processWebhookEvent(event);

    if (result.completed) {
      await markWebhookEventCompleted(event.id);
    } else {
      await markWebhookEventFailed(
        event.id,
        result.failureReason ??
          `Webhook processing failed with status ${result.response.status}`,
      );
    }

    return result.response;
  } catch (error) {
    const errorMessage = toErrorMessage(error);

    console.error("❌ Erro ao processar webhook:", error);

    try {
      await markWebhookEventFailed(event.id, errorMessage);
    } catch (persistError) {
      console.error(
        "❌ Erro ao persistir falha do evento webhook:",
        persistError,
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
