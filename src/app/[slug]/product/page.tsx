import { redirect } from "next/navigation";

interface LegacySlugProductListPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function buildProductsQuerySuffix(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "storeSlug") {
        continue;
      }

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

export default async function LegacySlugProductListPage({
  searchParams,
}: LegacySlugProductListPageProps) {
  const resolvedSearchParams = await searchParams;
  const querySuffix = buildProductsQuerySuffix(resolvedSearchParams);

  redirect(`/products${querySuffix}`);
}
