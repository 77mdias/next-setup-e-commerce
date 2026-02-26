import { redirect } from "next/navigation";

interface LegacySlugOrderFailurePageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function LegacySlugOrderFailurePage({
  searchParams,
}: LegacySlugOrderFailurePageProps) {
  const { session_id: sessionId } = await searchParams;
  const querySuffix = sessionId
    ? `?session_id=${encodeURIComponent(sessionId)}`
    : "";

  redirect(`/orders/failure${querySuffix}`);
}
