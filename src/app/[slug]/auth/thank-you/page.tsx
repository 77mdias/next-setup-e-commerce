import { redirect } from "next/navigation";

import { buildQueryString, PageSearchParams } from "@/lib/search-params";

type LegacyThankYouAuthPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

export default async function LegacyThankYouAuthPage({
  searchParams,
}: LegacyThankYouAuthPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const queryString = buildQueryString(resolvedSearchParams);

  redirect(`/auth/thank-you${queryString}`);
}
