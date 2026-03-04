import { redirect } from "next/navigation";

import { ROUTE_PATHS } from "@/lib/routes";
import { buildQueryString, PageSearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type LegacySlugCheckoutPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

export default async function LegacySlugCheckoutPage({
  searchParams,
}: LegacySlugCheckoutPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`${ROUTE_PATHS.checkout}${queryString}`);
}
