import { redirect } from "next/navigation";

interface LegacySlugOrderSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function LegacySlugOrderSuccessPage({
  searchParams,
}: LegacySlugOrderSuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const querySuffix = sessionId
    ? `?session_id=${encodeURIComponent(sessionId)}`
    : "";

  redirect(`/orders/success${querySuffix}`);
}
