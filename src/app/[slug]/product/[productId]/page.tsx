import { redirect } from "next/navigation";

import { buildProductPath } from "@/lib/routes";
import { buildQueryString, PageSearchParams } from "@/lib/search-params";

interface LegacyProductDetailRedirectPageProps {
  params: Promise<{ productId: string }>;
  searchParams?: Promise<PageSearchParams>;
}

export default async function LegacyProductDetailRedirectPage({
  params,
  searchParams,
}: LegacyProductDetailRedirectPageProps) {
  const { productId } = await params;
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`${buildProductPath(productId)}${queryString}`);
}
