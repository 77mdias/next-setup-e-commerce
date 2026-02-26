import { redirect } from "next/navigation";

interface LegacySlugCategoryPageProps {
  params: Promise<{
    slug: string;
    categorySlug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function buildProductsCategoryQuerySuffix(
  categorySlug: string,
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "storeSlug" || key === "category") {
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

  params.set("category", categorySlug);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export default async function LegacySlugCategoryPage({
  params,
  searchParams,
}: LegacySlugCategoryPageProps) {
  const { categorySlug } = await params;
  const resolvedSearchParams = await searchParams;
  const querySuffix = buildProductsCategoryQuerySuffix(
    categorySlug,
    resolvedSearchParams,
  );

  redirect(`/products${querySuffix}`);
}
