import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";

import { createRequestLogger, type StructuredLogger } from "@/lib/logger";
import { validateOrderStateTransition } from "@/lib/order-state-machine";
import { db } from "@/lib/prisma";
import { cleanupAbandonedReservations } from "@/lib/stock-reservation";

type WebhookProcessResult = {
  completed: boolean;
  failureReason?: string;
  response: NextResponse;
};

type WebhookMutationClient = Pick<
  typeof db,
  "order" | "payment" | "stripeWebhookEvent" | "orderStatusHistory" | "cart"
>;

type EventRegistrationResult =
  | { claimed: true }
  | { claimed: false; response: NextResponse };

const DEFAULT_PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

type FailureEventContext = {
  orderId: number | null;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
  cancelReason: string;
};

type FailureOrderLookupResult = {
  lookupSource: "metadata" | "payment_intent" | "checkout_session" | "none";
  order: {
    id: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
  } | null;
};

function resolvePaymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null,
) {
  if (!paymentIntent) {
    return null;
  }

  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

function resolveOrderId(rawOrderId: string | undefined) {
  if (!rawOrderId) {
    return null;
  }

  const parsedOrderId = Number(rawOrderId);

  if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
    return null;
  }

  return parsedOrderId;
}

function resolveFailureCancelReason(
  eventType: Stripe.Event.Type,
  failureMessage?: string | null,
) {
  if (eventType === "checkout.session.expired") {
    return "Sessão de checkout expirada";
  }

  if (failureMessage?.trim()) {
    return `Pagamento falhou: ${failureMessage.trim()}`;
  }

  return "Pagamento falhou ou expirou";
}

function buildWebhookStatusHistoryNote(params: {
  event: Stripe.Event;
  fromOrderStatus: OrderStatus;
  toOrderStatus: OrderStatus;
  fromPaymentStatus: PaymentStatus;
  toPaymentStatus: PaymentStatus;
  reason?: string;
  lookupSource?: FailureOrderLookupResult["lookupSource"];
}) {
  const noteParts = [
    "source:webhook",
    `eventType:${params.event.type}`,
    `eventId:${params.event.id}`,
    `orderStatusTransition:${params.fromOrderStatus}->${params.toOrderStatus}`,
    `paymentStatusTransition:${params.fromPaymentStatus}->${params.toPaymentStatus}`,
  ];

  if (params.lookupSource) {
    noteParts.push(`lookupSource:${params.lookupSource}`);
  }

  if (params.reason?.trim()) {
    noteParts.push(`reason:${params.reason.trim()}`);
  }

  return noteParts.join("; ");
}

function resolveFailureEventContext(event: Stripe.Event): FailureEventContext {
  if (event.type === "charge.failed") {
    const failedCharge = event.data.object as Stripe.Charge;

    return {
      orderId: resolveOrderId(failedCharge.metadata?.orderId),
      paymentIntentId: resolvePaymentIntentId(failedCharge.payment_intent),
      checkoutSessionId: null,
      cancelReason: resolveFailureCancelReason(
        event.type,
        failedCharge.failure_message,
      ),
    };
  }

  const failedSession = event.data.object as Stripe.Checkout.Session;

  return {
    orderId: resolveOrderId(failedSession.metadata?.orderId),
    paymentIntentId: resolvePaymentIntentId(failedSession.payment_intent),
    checkoutSessionId: failedSession.id,
    cancelReason: resolveFailureCancelReason(event.type),
  };
}

async function resolveFailureOrder(
  database: WebhookMutationClient,
  failureContext: FailureEventContext,
): Promise<FailureOrderLookupResult> {
  if (failureContext.orderId !== null) {
    const orderByMetadata = await database.order.findUnique({
      where: { id: failureContext.orderId },
      select: { id: true, status: true, paymentStatus: true },
    });

    if (orderByMetadata) {
      return {
        order: orderByMetadata,
        lookupSource: "metadata",
      };
    }
  }

  if (failureContext.paymentIntentId) {
    const orderByPaymentIntent = await database.order.findFirst({
      where: {
        stripePaymentIntentId: failureContext.paymentIntentId,
      },
      select: { id: true, status: true, paymentStatus: true },
      orderBy: { createdAt: "desc" },
    });

    if (orderByPaymentIntent) {
      return {
        order: orderByPaymentIntent,
        lookupSource: "payment_intent",
      };
    }
  }

  if (failureContext.checkoutSessionId) {
    const orderBySession = await database.order.findFirst({
      where: {
        stripeCheckoutSessionId: failureContext.checkoutSessionId,
      },
      select: { id: true, status: true, paymentStatus: true },
      orderBy: { createdAt: "desc" },
    });

    if (orderBySession) {
      return {
        order: orderBySession,
        lookupSource: "checkout_session",
      };
    }
  }

  return {
    order: null,
    lookupSource: "none",
  };
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

function resolveProcessingTimeoutMs(logger: StructuredLogger) {
  const timeoutFromEnv = process.env.STRIPE_WEBHOOK_PROCESSING_TIMEOUT_MS;

  if (!timeoutFromEnv) {
    return DEFAULT_PROCESSING_TIMEOUT_MS;
  }

  const parsedTimeout = Number(timeoutFromEnv);

  if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
    logger.warn("webhooks.stripe.processing_timeout_invalid", {
      data: {
        timeoutFromEnv,
        fallbackTimeoutMs: DEFAULT_PROCESSING_TIMEOUT_MS,
      },
    });

    return DEFAULT_PROCESSING_TIMEOUT_MS;
  }

  return parsedTimeout;
}

async function registerOrShortCircuitEvent(
  event: Stripe.Event,
  payload: string,
  logger: StructuredLogger,
): Promise<EventRegistrationResult> {
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

    return { claimed: true };
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error)) {
      throw error;
    }

    const existingEvent = await db.stripeWebhookEvent.findUnique({
      where: { eventId: event.id },
      select: { status: true, updatedAt: true },
    });

    if (!existingEvent) {
      throw error;
    }

    if (existingEvent.status === "COMPLETED") {
      return {
        claimed: false,
        response: NextResponse.json({ received: true, deduplicated: true }),
      };
    }

    if (existingEvent.status === "FAILED") {
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

      if (retryClaim.count === 1) {
        return { claimed: true };
      }

      return {
        claimed: false,
        response: NextResponse.json({ received: true, processing: true }),
      };
    }

    const processingTimeoutMs = resolveProcessingTimeoutMs(logger);
    const staleProcessingBefore = new Date(now.getTime() - processingTimeoutMs);

    const staleClaim = await db.stripeWebhookEvent.updateMany({
      where: {
        eventId: event.id,
        status: "PROCESSING",
        updatedAt: {
          lte: staleProcessingBefore,
        },
      },
      data: {
        payload,
        lastReceivedAt: now,
        processedAt: null,
        lastError: null,
        attemptCount: { increment: 1 },
      },
    });

    if (staleClaim.count === 1) {
      return { claimed: true };
    }

    return {
      claimed: false,
      response: NextResponse.json({ received: true, processing: true }),
    };
  }
}

async function markWebhookEventFailed(eventId: string, failureReason: string) {
  await db.stripeWebhookEvent.updateMany({
    where: {
      eventId,
      status: "PROCESSING",
    },
    data: {
      status: "FAILED",
      lastError: failureReason,
      processedAt: null,
    },
  });
}

async function clearUserCartAfterPaidOrder(
  database: WebhookMutationClient,
  userId: string | null | undefined,
) {
  if (!userId) {
    return;
  }

  await database.cart.deleteMany({
    where: { userId },
  });
}

async function processWebhookEvent(
  database: WebhookMutationClient,
  event: Stripe.Event,
  logger: StructuredLogger,
): Promise<WebhookProcessResult> {
  const eventLogger = logger.child({
    eventId: event.id,
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const rawOrderId = session.metadata?.orderId;
      const parsedOrderId = resolveOrderId(rawOrderId);
      const checkoutSessionId = session.id;
      const paymentIntentId = resolvePaymentIntentId(session.payment_intent);

      eventLogger.info("webhooks.stripe.checkout_completed_received", {
        context: {
          orderId: parsedOrderId,
        },
        data: {
          eventType: event.type,
          paymentStatus: session.payment_status,
          checkoutSessionId,
          paymentIntentId,
          hasMetadataOrderId: Boolean(rawOrderId),
        },
      });

      if (!parsedOrderId) {
        eventLogger.warn(
          "webhooks.stripe.checkout_completed_missing_order_id",
          {
            data: {
              eventType: event.type,
              checkoutSessionId,
              paymentIntentId,
            },
          },
        );
        return {
          completed: true,
          response: NextResponse.json({
            received: true,
            warning: "No order ID found",
          }),
        };
      }

      const existingOrder = await database.order.findUnique({
        where: {
          id: parsedOrderId,
        },
        include: {
          store: { select: { slug: true } },
        },
      });

      if (!existingOrder) {
        eventLogger.error(
          "webhooks.stripe.checkout_completed_order_not_found",
          {
            context: {
              orderId: parsedOrderId,
            },
            data: {
              eventType: event.type,
              checkoutSessionId,
              paymentIntentId,
            },
          },
        );

        return {
          completed: false,
          failureReason: `Order ${parsedOrderId} not found`,
          response: NextResponse.json(
            {
              error: "Order not found",
              orderId: rawOrderId ?? String(parsedOrderId),
            },
            { status: 404 },
          ),
        };
      }

      const orderLogger = eventLogger.child({
        orderId: existingOrder.id,
      });

      orderLogger.info("webhooks.stripe.checkout_completed_order_loaded", {
        data: {
          eventType: event.type,
          currentOrderStatus: existingOrder.status,
          currentPaymentStatus: existingOrder.paymentStatus,
        },
      });

      const paidTransition = validateOrderStateTransition({
        from: {
          orderStatus: existingOrder.status,
          paymentStatus: existingOrder.paymentStatus,
        },
        to: {
          orderStatus: "PAID",
          paymentStatus: "PAID",
        },
      });

      if (!paidTransition.valid) {
        const transitionFailureReason = `${paidTransition.reason} (orderId: ${existingOrder.id})`;

        orderLogger.warn(
          "webhooks.stripe.checkout_completed_transition_rejected",
          {
            data: {
              eventType: event.type,
              currentOrderStatus: existingOrder.status,
              currentPaymentStatus: existingOrder.paymentStatus,
              targetOrderStatus: "PAID",
              targetPaymentStatus: "PAID",
              reason: paidTransition.reason,
            },
          },
        );

        return {
          completed: false,
          failureReason: transitionFailureReason,
          response: NextResponse.json(
            {
              error: "Invalid state transition for order payment confirmation",
              orderId: existingOrder.id,
              reason: paidTransition.reason,
            },
            { status: 409 },
          ),
        };
      }

      if (paidTransition.isNoop) {
        orderLogger.info("webhooks.stripe.checkout_completed_transition_noop", {
          data: {
            eventType: event.type,
            currentOrderStatus: existingOrder.status,
            currentPaymentStatus: existingOrder.paymentStatus,
          },
        });

        return {
          completed: true,
          response: NextResponse.json({ received: true }),
        };
      }

      const paymentReference = paymentIntentId ?? checkoutSessionId;
      const paidResult = await database.order.updateMany({
        where: {
          id: existingOrder.id,
          status: existingOrder.status,
          paymentStatus: existingOrder.paymentStatus,
        },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          stripeCheckoutSessionId:
            existingOrder.stripeCheckoutSessionId ?? checkoutSessionId,
          stripePaymentIntentId: paymentIntentId,
          stripePaymentId: paymentReference,
        },
      });

      if (paidResult.count === 0) {
        orderLogger.info(
          "webhooks.stripe.checkout_completed_concurrent_state_change",
          {
            data: {
              eventType: event.type,
              currentOrderStatus: existingOrder.status,
              currentPaymentStatus: existingOrder.paymentStatus,
            },
          },
        );

        return {
          completed: true,
          response: NextResponse.json({ received: true }),
        };
      }

      orderLogger.info("webhooks.stripe.checkout_completed_order_paid", {
        data: {
          eventType: event.type,
          newStatus: "PAID",
          newPaymentStatus: "PAID",
          stripeCheckoutSessionId:
            existingOrder.stripeCheckoutSessionId ?? checkoutSessionId,
          stripePaymentIntentId: paymentIntentId,
        },
      });

      await database.orderStatusHistory.create({
        data: {
          orderId: existingOrder.id,
          status: "PAID",
          notes: buildWebhookStatusHistoryNote({
            event,
            fromOrderStatus: existingOrder.status,
            toOrderStatus: "PAID",
            fromPaymentStatus: existingOrder.paymentStatus,
            toPaymentStatus: "PAID",
            reason: "Pagamento confirmado",
          }),
        },
      });

      const payment = await database.payment.create({
        data: {
          orderId: existingOrder.id,
          method: "stripe",
          amount: existingOrder.total,
          status: "PAID",
          stripePaymentId: paymentIntentId ?? undefined,
          paidAt: new Date(),
        },
      });

      orderLogger.info("webhooks.stripe.checkout_completed_payment_created", {
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          status: payment.status,
        },
      });

      await clearUserCartAfterPaidOrder(database, existingOrder.userId);

      return {
        completed: true,
        response: NextResponse.json({ received: true }),
      };
    }

    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
    case "charge.failed": {
      const failureContext = resolveFailureEventContext(event);
      const failureOrder = await resolveFailureOrder(database, failureContext);
      const failureLogger = eventLogger.child({
        orderId: failureContext.orderId,
      });

      if (!failureOrder.order) {
        failureLogger.warn("webhooks.stripe.failure_event_order_not_found", {
          data: {
            eventType: event.type,
            lookupSource: failureOrder.lookupSource,
            paymentIntentId: failureContext.paymentIntentId,
            checkoutSessionId: failureContext.checkoutSessionId,
          },
        });

        return {
          completed: true,
          response: NextResponse.json({ received: true }),
        };
      }

      const { order } = failureOrder;
      const orderLogger = eventLogger.child({
        orderId: order.id,
      });

      const cancellationTransition = validateOrderStateTransition({
        from: {
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
        },
        to: {
          orderStatus: "CANCELLED",
          paymentStatus: "FAILED",
        },
      });

      if (!cancellationTransition.valid) {
        orderLogger.info("webhooks.stripe.failure_event_transition_invalid", {
          data: {
            eventType: event.type,
            lookupSource: failureOrder.lookupSource,
            currentOrderStatus: order.status,
            currentPaymentStatus: order.paymentStatus,
          },
        });

        return {
          completed: true,
          response: NextResponse.json({ received: true }),
        };
      }

      if (cancellationTransition.isNoop) {
        orderLogger.info("webhooks.stripe.failure_event_transition_noop", {
          data: {
            eventType: event.type,
            lookupSource: failureOrder.lookupSource,
            currentOrderStatus: order.status,
            currentPaymentStatus: order.paymentStatus,
          },
        });

        return {
          completed: true,
          response: NextResponse.json({ received: true }),
        };
      }

      const cancellationResult = await database.order.updateMany({
        where: {
          id: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
          cancelledAt: new Date(),
          cancelReason: failureContext.cancelReason,
        },
      });

      if (cancellationResult.count === 1) {
        await database.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "CANCELLED",
            notes: buildWebhookStatusHistoryNote({
              event,
              fromOrderStatus: order.status,
              toOrderStatus: "CANCELLED",
              fromPaymentStatus: order.paymentStatus,
              toPaymentStatus: "FAILED",
              reason: failureContext.cancelReason,
              lookupSource: failureOrder.lookupSource,
            }),
          },
        });

        orderLogger.info("webhooks.stripe.failure_event_order_cancelled", {
          data: {
            eventType: event.type,
            lookupSource: failureOrder.lookupSource,
            cancelReason: failureContext.cancelReason,
          },
        });
      } else {
        orderLogger.info(
          "webhooks.stripe.failure_event_concurrent_state_change",
          {
            data: {
              eventType: event.type,
              lookupSource: failureOrder.lookupSource,
            },
          },
        );
      }

      return {
        completed: true,
        response: NextResponse.json({ received: true }),
      };
    }

    default:
      eventLogger.info("webhooks.stripe.event_ignored", {
        data: {
          eventType: event.type,
        },
      });
      return {
        completed: true,
        response: NextResponse.json({ received: true }),
      };
  }
}

async function processWebhookEventAtomically(
  event: Stripe.Event,
  logger: StructuredLogger,
) {
  return db.$transaction(async (tx) => {
    const result = await processWebhookEvent(
      {
        order: tx.order,
        orderStatusHistory: tx.orderStatusHistory,
        payment: tx.payment,
        cart: tx.cart,
        stripeWebhookEvent: tx.stripeWebhookEvent,
      },
      event,
      logger,
    );

    const cleanupResult = await cleanupAbandonedReservations({
      database: tx,
    });

    if (cleanupResult.expiredCount > 0 || cleanupResult.releasedCount > 0) {
      logger.info("webhooks.stripe.reservations_cleanup_applied", {
        data: {
          referenceDate: cleanupResult.referenceDate.toISOString(),
          expiredCount: cleanupResult.expiredCount,
          releasedCount: cleanupResult.releasedCount,
        },
      });
    }

    if (result.completed) {
      await tx.stripeWebhookEvent.updateMany({
        where: {
          eventId: event.id,
          status: "PROCESSING",
        },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
          lastError: null,
        },
      });
    } else {
      await tx.stripeWebhookEvent.updateMany({
        where: {
          eventId: event.id,
          status: "PROCESSING",
        },
        data: {
          status: "FAILED",
          lastError:
            result.failureReason ??
            `Webhook processing failed with status ${result.response.status}`,
          processedAt: null,
        },
      });
    }

    return result.response;
  });
}

export async function POST(request: NextRequest) {
  const logger = createRequestLogger({
    headers: request.headers,
    route: "/api/webhooks/stripe",
  });

  // Verificar se as variáveis de ambiente estão configuradas
  if (!process.env.STRIPE_WEBHOOK_SECRET_KEY) {
    logger.error("webhooks.stripe.missing_webhook_secret");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Verificar se a chave secreta do Stripe está configurada
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.error("webhooks.stripe.missing_stripe_secret");
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
    logger.error("webhooks.stripe.missing_signature_header");
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;

  if (!webhookSecret) {
    logger.error("webhooks.stripe.missing_webhook_secret_after_read");
    return NextResponse.json(
      { error: "Missing Stripe webhook secret key" },
      { status: 500 },
    );
  }

  const text = await request.text();
  logger.info("webhooks.stripe.payload_received", {
    data: {
      payloadLength: text.length,
    },
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(text, signature, webhookSecret);
  } catch (error) {
    logger.error("webhooks.stripe.signature_verification_failed", { error });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventLogger = logger.child({
    eventId: event.id,
  });
  eventLogger.info("webhooks.stripe.event_received", {
    data: {
      eventType: event.type,
    },
  });

  try {
    const eventRegistration = await registerOrShortCircuitEvent(
      event,
      text,
      eventLogger,
    );

    if (!eventRegistration.claimed) {
      return eventRegistration.response;
    }

    return await processWebhookEventAtomically(event, eventLogger);
  } catch (error) {
    const errorMessage = toErrorMessage(error);

    eventLogger.error("webhooks.stripe.processing_failed", { error });

    try {
      await markWebhookEventFailed(event.id, errorMessage);
    } catch (persistError) {
      eventLogger.error("webhooks.stripe.persist_failure_failed", {
        error: persistError,
      });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
