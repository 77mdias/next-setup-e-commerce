import { redirect } from "next/navigation";

interface OrderDetailsRedirectPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderDetailsRedirectPage({
  params,
}: OrderDetailsRedirectPageProps) {
  const { orderId } = await params;
  redirect(`/orders?orderId=${encodeURIComponent(orderId)}`);
}
