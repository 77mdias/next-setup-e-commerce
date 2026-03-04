import { redirect } from "next/navigation";

import { ROUTE_PATHS } from "@/lib/routes";
import { buildQueryString, PageSearchParams } from "@/lib/search-params";

interface LegacySlugOrderSuccessPageProps {
  searchParams?: Promise<PageSearchParams>;
}

export default async function LegacySlugOrderSuccessPage({
  searchParams,
}: LegacySlugOrderSuccessPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`${ROUTE_PATHS.ordersSuccess}${queryString}`);
}
