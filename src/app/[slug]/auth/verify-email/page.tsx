import { redirect } from "next/navigation";

import { buildQueryString, PageSearchParams } from "@/lib/search-params";

type LegacyVerifyEmailAuthPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

export default async function LegacyVerifyEmailAuthPage({
  searchParams,
}: LegacyVerifyEmailAuthPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`/auth/verify-email${queryString}`);
}
