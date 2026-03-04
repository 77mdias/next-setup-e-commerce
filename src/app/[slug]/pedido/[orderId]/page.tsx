import { redirect } from "next/navigation";

import { ROUTE_PATHS } from "@/lib/routes";
import { buildQueryString, PageSearchParams } from "@/lib/search-params";

interface LegacySlugOrderDetailsPageProps {
  params: Promise<{
    orderId: string;
  }>;
  searchParams?: Promise<PageSearchParams>;
}

export default async function LegacySlugOrderDetailsPage({
  params,
  searchParams,
}: LegacySlugOrderDetailsPageProps) {
  const { orderId } = await params;
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);
  const orderDetailsPath = `${ROUTE_PATHS.orders}/${encodeURIComponent(orderId)}`;

  redirect(`${orderDetailsPath}${queryString}`);
}
