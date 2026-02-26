import { redirect } from "next/navigation";

interface OrdersSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function OrdersSuccessPage({
  searchParams,
}: OrdersSuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const querySuffix = sessionId
    ? `?session_id=${encodeURIComponent(sessionId)}`
    : "";

  redirect(`/orders${querySuffix}`);
}
