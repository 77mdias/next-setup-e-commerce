import { redirect } from "next/navigation";

import { ROUTE_PATHS } from "@/lib/routes";
import { buildQueryString, PageSearchParams } from "@/lib/search-params";

type LegacySlugOrdersPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

export default async function LegacySlugOrdersPage({
  searchParams,
}: LegacySlugOrdersPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`${ROUTE_PATHS.orders}${queryString}`);
}
