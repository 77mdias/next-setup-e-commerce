import { redirect } from "next/navigation";

import { ROUTE_PATHS } from "@/lib/routes";
import { buildQueryString, PageSearchParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type LegacySlugWishlistPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

export default async function LegacySlugWishlistPage({
  searchParams,
}: LegacySlugWishlistPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`${ROUTE_PATHS.wishlist}${queryString}`);
}
