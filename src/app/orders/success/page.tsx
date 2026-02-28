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

interface OrdersSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

const ORDERS_PAGE_PATH = "/orders";
const ORDERS_SUCCESS_PATH = "/orders/success";

export const dynamic = "force-dynamic";

export default async function OrdersSuccessPage({
  searchParams,
}: OrdersSuccessPageProps) {
  const { session_id: rawSessionId } = await searchParams;
  const sessionId = normalizeOrderSessionId(rawSessionId ?? "");

  if (!sessionId) {
    redirect(ORDERS_PAGE_PATH);
  }

  const sessionCallbackPath = buildOrderSessionCallbackPath(
    ORDERS_SUCCESS_PATH,
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
        callbackUrl: ORDERS_PAGE_PATH,
        fromPath: ORDERS_SUCCESS_PATH,
      }),
    );
  }

  if (!orderId) {
    redirect(
      buildAccessFeedbackPath({
        reason: "forbidden",
        callbackUrl: ORDERS_PAGE_PATH,
        fromPath: sessionCallbackPath,
      }),
    );
  }

  redirect(`${ORDERS_PAGE_PATH}?orderId=${orderId}`);
}
