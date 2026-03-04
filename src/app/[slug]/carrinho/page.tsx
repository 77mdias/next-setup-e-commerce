import { redirect } from "next/navigation";

import { ROUTE_PATHS } from "@/lib/routes";
import { buildQueryString, PageSearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type LegacySlugCartPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

export default async function LegacySlugCartPage({
  searchParams,
}: LegacySlugCartPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`${ROUTE_PATHS.cart}${queryString}`);
}
