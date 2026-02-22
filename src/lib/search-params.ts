export type PageSearchParams = Record<string, string | string[] | undefined>;

export function buildQueryString(searchParams: PageSearchParams): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "undefined") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}
