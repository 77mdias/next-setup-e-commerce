import { redirect } from "next/navigation";

interface OrdersFailurePageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function OrdersFailurePage({
  searchParams,
}: OrdersFailurePageProps) {
  const { session_id: sessionId } = await searchParams;
  const querySuffix = sessionId
    ? `?checkout=failed&session_id=${encodeURIComponent(sessionId)}`
    : "?checkout=failed";

  redirect(`/carrinho${querySuffix}`);
}
