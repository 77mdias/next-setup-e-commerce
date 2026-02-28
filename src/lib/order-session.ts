import type { Prisma } from "@prisma/client";

type BuildOrderSessionLookupWhereParams = {
  userId: string;
  sessionId: string;
};

export function normalizeOrderSessionId(sessionId: string): string {
  return sessionId.trim();
}

export function buildOrderSessionLookupWhere({
  userId,
  sessionId,
}: BuildOrderSessionLookupWhereParams): Prisma.OrderWhereInput {
  return {
    userId,
    OR: [
      { stripeCheckoutSessionId: sessionId },
      // Compatibilidade temporaria durante rollout do schema Stripe separado.
      { stripePaymentId: sessionId },
    ],
  };
}

export function buildOrderSessionCallbackPath(
  pathname: string,
  sessionId: string,
): string {
  const params = new URLSearchParams({ session_id: sessionId });
  return `${pathname}?${params.toString()}`;
}
