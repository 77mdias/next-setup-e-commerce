import { redirect } from "next/navigation";

interface LegacySlugHomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function buildQuerySuffix(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") {
        params.append(key, value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") {
            params.append(key, item);
          }
        }
      }
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export default async function LegacySlugHomePage({
  searchParams,
}: LegacySlugHomePageProps) {
  const resolvedSearchParams = await searchParams;
  const querySuffix = buildQuerySuffix(resolvedSearchParams);
  redirect(`/${querySuffix}`);
}
