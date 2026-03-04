import { redirect } from "next/navigation";

import { ROUTE_PATHS } from "@/lib/routes";
import { buildQueryString, PageSearchParams } from "@/lib/search-params";

interface OfertasRedirectPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<PageSearchParams>;
}

export default async function OfertasRedirectPage({
  params,
  searchParams,
}: OfertasRedirectPageProps) {
  await params;
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`${ROUTE_PATHS.explore}${queryString}`);
}
