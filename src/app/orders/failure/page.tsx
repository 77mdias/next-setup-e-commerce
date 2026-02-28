import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { db } from "@/lib/prisma";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";
import { authOptions } from "@/lib/auth";
import {
  buildOrderSessionCallbackPath,
  buildOrderSessionLookupWhere,
  normalizeOrderSessionId,
} from "@/lib/order-session";

interface OrdersFailurePageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

const CART_PAGE_PATH = "/carrinho";
const ORDERS_PAGE_PATH = "/orders";
const ORDERS_FAILURE_PATH = "/orders/failure";

function buildCartFailurePath() {
  return `${CART_PAGE_PATH}?checkout=failed`;
}

export const dynamic = "force-dynamic";

export default async function OrdersFailurePage({
  searchParams,
}: OrdersFailurePageProps) {
  const { session_id: rawSessionId } = await searchParams;
  const sessionId = normalizeOrderSessionId(rawSessionId ?? "");

  if (!sessionId) {
    redirect(buildCartFailurePath());
  }

  const sessionCallbackPath = buildOrderSessionCallbackPath(
    ORDERS_FAILURE_PATH,
    sessionId,
  );
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      buildAccessFeedbackPath({
        reason: "auth-required",
        callbackUrl: sessionCallbackPath,
        fromPath: sessionCallbackPath,
      }),
    );
  }

  let orderId: number | null = null;

  try {
    const order = await db.order.findFirst({
      where: buildOrderSessionLookupWhere({
        userId: session.user.id,
        sessionId,
      }),
      select: { id: true },
    });

    orderId = order?.id ?? null;
  } catch {
    redirect(
      buildAccessFeedbackPath({
        reason: "outage",
        callbackUrl: buildCartFailurePath(),
        fromPath: ORDERS_FAILURE_PATH,
      }),
    );
  }

  if (!orderId) {
    redirect(
      buildAccessFeedbackPath({
        reason: "forbidden",
        callbackUrl: buildCartFailurePath(),
        fromPath: sessionCallbackPath,
      }),
    );
  }

  redirect(`${ORDERS_PAGE_PATH}?orderId=${orderId}&checkout=failed`);
}
