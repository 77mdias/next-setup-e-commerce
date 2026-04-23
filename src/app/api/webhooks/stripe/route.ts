import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { createRequestLogger, type StructuredLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import { processWebhookEvent, type WebhookProcessResult } from "@/lib/services/stripe-webhook-service";

type EventRegistrationResult =
  | { claimed: true }
  | { claimed: false; response: NextResponse };

const DEFAULT_PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

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

    const { cleanupAbandonedReservations } = await import("@/lib/stock-reservation");
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