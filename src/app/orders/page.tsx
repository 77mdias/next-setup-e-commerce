import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { OrdersPageContent } from "@/components/orders/orders-page-content";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      buildAccessFeedbackPath({
        reason: "auth-required",
        callbackUrl: "/orders",
        fromPath: "/orders",
      }),
    );
  }

  return <OrdersPageContent />;
}
