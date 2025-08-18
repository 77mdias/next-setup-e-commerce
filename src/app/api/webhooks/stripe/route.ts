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

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("Stripe signature não encontrada nos headers");
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_KEY,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db.order.update({
          where: { id: parseInt(orderId) },
          data: { status: "PAID" },
        });
      }
      break;

    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
    case "charge.failed":
      const failedSession = event.data.object as Stripe.Checkout.Session;
      const failedOrderId = failedSession.metadata?.orderId;

      if (failedOrderId) {
        await db.order.update({
          where: { id: parseInt(failedOrderId) },
          data: { status: "CANCELLED" },
        });
      }
      break;
  }

  return NextResponse.json({ received: true });
}
