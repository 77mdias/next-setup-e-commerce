import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { checkoutService } from "@/lib/services/checkout-service";
import {
  CheckoutValidationError,
} from "@/lib/services/checkout-service";
import {
  consumeRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

const CHECKOUT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CHECKOUT_RATE_LIMIT_MESSAGE =
  "Muitas tentativas de checkout. Tente novamente em instantes.";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = consumeRequestRateLimit({
      headers: request.headers,
      scope: "api.checkout",
      now: new Date(),
      ip: {
        limit: 10,
        windowMs: CHECKOUT_RATE_LIMIT_WINDOW_MS,
      },
    });

    if (!rateLimitResult.allowed) {
      console.warn("checkout.rate_limited", {
        bucketKey: rateLimitResult.bucketKey,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
      });

      return createRateLimitResponse({
        message: CHECKOUT_RATE_LIMIT_MESSAGE,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    // Auth check
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    const requestOrigin = request.nextUrl.origin;

    // Delegate to service
    const result = await checkoutService.createCheckoutSession({
      request,
      requestOrigin,
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
    });

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.url,
      orderId: result.orderId,
    });
  } catch (error) {
    // Handle service-level errors
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.issues ? { issues: error.issues } : {}),
        },
        { status: error.statusCode },
      );
    }

    // Log and return generic error
    console.error("checkout.internal_error", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
