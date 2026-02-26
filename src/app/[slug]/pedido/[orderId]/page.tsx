import { redirect } from "next/navigation";

interface LegacySlugOrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function LegacySlugOrderDetailsPage({
  params,
}: LegacySlugOrderDetailsPageProps) {
  const { orderId } = await params;
  redirect(`/orders/${encodeURIComponent(orderId)}`);
}
