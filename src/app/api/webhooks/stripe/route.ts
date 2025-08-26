import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/prisma";

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

  console.log("🔍 Evento recebido:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        console.log("🔍 ID do pedido:", orderId);
        console.log("📋 Metadata completa:", session.metadata);
        console.log("💰 Status do pagamento:", session.payment_status);
        console.log("💳 ID do pagamento:", session.payment_intent);

        if (!orderId) {
          console.warn("⚠️ ID do pedido não encontrado nos metadados");
          return NextResponse.json({
            received: true,
            warning: "No order ID found",
          });
        }

        // Verificar se o pedido existe antes de atualizar
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
          return NextResponse.json(
            { error: "Order not found", orderId },
            { status: 404 },
          );
        }

        console.log(
          "📊 Pedido encontrado, status atual:",
          existingOrder.status,
          "paymentStatus:",
          existingOrder.paymentStatus,
        );

        // Atualizar o pedido para PAID
        const updatedOrder = await db.order.update({
          where: {
            id: Number(orderId),
          },
          data: {
            status: "PAID",
            paymentStatus: "PAID",
            stripePaymentId: session.payment_intent as string,
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
          stripePaymentId: updatedOrder.stripePaymentId,
        });

        // Criar registro de pagamento
        const payment = await db.payment.create({
          data: {
            orderId: Number(orderId),
            method: "stripe",
            amount: updatedOrder.total,
            status: "PAID",
            stripePaymentId: session.payment_intent as string,
            paidAt: new Date(),
          },
        });

        console.log("💰 Registro de pagamento criado com sucesso:", {
          paymentId: payment.id,
          amount: payment.amount,
          status: payment.status,
        });

        break;

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
      case "charge.failed":
        const failedSession = event.data.object as Stripe.Checkout.Session;
        const failedOrderId = failedSession.metadata?.orderId;

        if (failedOrderId) {
          // Verificar se o pedido existe
          const failedOrder = await db.order.findUnique({
            where: {
              id: Number(failedOrderId),
            },
          });

          if (failedOrder) {
            // Atualizar o pedido para CANCELLED
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
        break;

      default:
        console.log("ℹ️ Evento não processado:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
