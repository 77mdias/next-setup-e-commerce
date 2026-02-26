"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FeaturedProductCard } from "@/components/home/featured-product-card";
import type { FeaturedProduct } from "@/components/home/types";
import { formatCurrency } from "@/helpers/format-currency";

type CategoryFacet = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

type ApiProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  images: string[];
  isOnSale: boolean;
  isFeatured: boolean;
  category: {
    name: string;
  } | null;
};

type ProductsFacets = {
  categories: CategoryFacet[];
  priceRange: {
    min: number;
    max: number;
  };
};

type ProductsResponse = {
  products: ApiProduct[];
  total: number | null;
  page: number;
  limit: number;
  totalPages: number | null;
  hasMore: boolean;
  filters: {
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    sort: string;
  };
  facets?: ProductsFacets | null;
};

type ProductFacetsResponse = {
  facets?: ProductsFacets | null;
};

type SearchParamsLike = {
  entries(): IterableIterator<[string, string]>;
  toString(): string;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "rating", label: "Top Rated" },
  { value: "best-selling", label: "Best Selling" },
];

const CATALOG_QUERY_KEYS = ["category", "sort", "page", "minPrice", "maxPrice"];
const CATALOG_API_QUERY_KEYS = [...CATALOG_QUERY_KEYS, "limit", "includeTotal"];

function parseNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickQueryParams(
  searchParams: SearchParamsLike,
  allowedKeys: readonly string[],
) {
  const allowed = new Set(allowedKeys);
  const params = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    if (allowed.has(key)) {
      params.append(key, value);
    }
  }

  return params;
}

export function ProductsCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minDraft, setMinDraft] = useState<number | null>(null);
  const [maxDraft, setMaxDraft] = useState<number | null>(null);
  const facetsRef = useRef<ProductsFacets | null>(null);

  const selectedCategory = searchParams.get("category") ?? "all";
  const selectedSort = searchParams.get("sort") ?? "newest";
  const currentPage = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );

  const queryMin = parseNumber(searchParams.get("minPrice"));
  const queryMax = parseNumber(searchParams.get("maxPrice"));

  useEffect(() => {
    const canonicalQuery = pickQueryParams(
      searchParams,
      CATALOG_QUERY_KEYS,
    ).toString();
    const currentQuery = searchParams.toString();

    if (currentQuery === canonicalQuery) {
      return;
    }

    router.replace(
      canonicalQuery ? `${pathname}?${canonicalQuery}` : pathname,
      {
        scroll: false,
      },
    );
  }, [pathname, router, searchParams]);

  const priceBounds = useMemo(
    () => ({
      min: data?.facets?.priceRange.min ?? 0,
      max: data?.facets?.priceRange.max ?? 0,
    }),
    [data?.facets?.priceRange.max, data?.facets?.priceRange.min],
  );

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = pickQueryParams(searchParams, CATALOG_QUERY_KEYS);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = pickQueryParams(searchParams, CATALOG_API_QUERY_KEYS);
        if (!params.get("limit")) {
          params.set("limit", "24");
        }
        params.set("includeTotal", "0");
        params.set("includeFacets", "0");

        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar produtos");
        }

        const payload = (await response.json()) as ProductsResponse;
        const mergedFacets = facetsRef.current ?? payload.facets ?? null;

        if (mergedFacets) {
          facetsRef.current = mergedFacets;

          const minValue = queryMin ?? mergedFacets.priceRange.min;
          const maxValue = queryMax ?? mergedFacets.priceRange.max;
          setMinDraft(minValue);
          setMaxDraft(maxValue);
        }

        setData({
          ...payload,
          facets: mergedFacets,
        });
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Erro ao carregar produtos",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [searchParams, queryMax, queryMin]);

  useEffect(() => {
    if (loading || !data || facetsRef.current) {
      return;
    }

    const controller = new AbortController();
    const fetchFacets = async () => {
      try {
        const response = await fetch("/api/products?facetsOnly=1", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar filtros");
        }

        const payload = (await response.json()) as ProductFacetsResponse;
        const resolvedFacets = payload.facets ?? null;

        if (!resolvedFacets) {
          return;
        }

        facetsRef.current = resolvedFacets;
        setMinDraft(queryMin ?? resolvedFacets.priceRange.min);
        setMaxDraft(queryMax ?? resolvedFacets.priceRange.max);
        setData((currentData) =>
          currentData
            ? {
                ...currentData,
                facets: resolvedFacets,
              }
            : currentData,
        );
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.warn("Erro ao carregar facets de produtos:", fetchError);
      }
    };

    fetchFacets();
    return () => controller.abort();
  }, [data, loading, queryMax, queryMin]);

  const mappedProducts: FeaturedProduct[] = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.products.map((product) => ({
      id: product.id,
      category: product.category?.name ?? "Products",
      name: product.name,
      price: formatCurrency(product.price),
      previousPrice:
        product.originalPrice && product.originalPrice > product.price
          ? formatCurrency(product.originalPrice)
          : undefined,
      rating: product.rating > 0 ? product.rating.toFixed(1) : "0.0",
      imageSrc: product.images[0] ?? "/images/home/card-razer-node.png",
      imageAlt: `Imagem do produto ${product.name}`,
      href: `/product/${product.id}`,
      badge: product.isOnSale
        ? {
            label: "Sale",
            tone: "pink",
          }
        : product.isFeatured
          ? {
              label: "New",
              tone: "blue",
            }
          : undefined,
    }));
  }, [data]);

  const applyPriceFilter = () => {
    if (!data || !data.facets || minDraft === null || maxDraft === null) {
      return;
    }

    const min = Math.min(minDraft, maxDraft);
    const max = Math.max(minDraft, maxDraft);

    const minParam =
      min <= data.facets.priceRange.min ? null : Math.floor(min).toString();
    const maxParam =
      max >= data.facets.priceRange.max ? null : Math.ceil(max).toString();

    updateQuery({
      minPrice: minParam,
      maxPrice: maxParam,
      page: null,
    });
  };

  const clearFilters = () => {
    setMinDraft(priceBounds.min);
    setMaxDraft(priceBounds.max);
    updateQuery({
      category: null,
      sort: null,
      minPrice: null,
      maxPrice: null,
      page: null,
    });
  };

  return (
    <section className="mx-auto w-full max-w-[1536px]">
      <header className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="[font-family:var(--font-space-grotesk)] text-3xl font-bold text-[#0f172a] sm:text-[30px] dark:text-[#f1f3f5]">
            All Products
          </h1>
          <p className="mt-2 [font-family:var(--font-arimo)] text-base text-[#64748b] dark:text-[#6a7282]">
            {typeof data?.total === "number"
              ? `${data.total} items found`
              : `${data?.products.length ?? 0} items loaded`}
          </p>
        </div>

        <div className="inline-flex h-[38px] items-center rounded-2xl border border-[#cdd9ff] bg-[#edf2ff] px-3 dark:border-white/10 dark:bg-[#12151a]">
          <select
            value={selectedSort}
            onChange={(event) =>
              updateQuery({
                sort:
                  event.target.value === "newest" ? null : event.target.value,
                page: null,
              })
            }
            className="h-full bg-transparent pr-4 [font-family:var(--font-arimo)] text-sm text-[#334155] outline-none dark:text-[#99a1af]"
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-[#edf2ff] text-[#334155] dark:bg-[#12151a] dark:text-[#99a1af]"
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex flex-col gap-10 lg:flex-row xl:gap-12">
        <aside className="w-full lg:w-[256px] lg:flex-shrink-0">
          <div className="space-y-10">
            <section>
              <h2 className="mb-4 [font-family:var(--font-space-grotesk)] text-base font-bold text-[#0f172a] dark:text-[#f1f3f5]">
                Categories
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => updateQuery({ category: null, page: null })}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#ff2e63]">
                    {selectedCategory === "all" && (
                      <span className="h-2 w-2 rounded-full bg-[#ff2e63]" />
                    )}
                  </span>
                  <span
                    className={`[font-family:var(--font-arimo)] text-sm ${
                      selectedCategory === "all"
                        ? "text-[#0f172a] dark:text-[#f1f3f5]"
                        : "text-[#64748b] dark:text-[#6a7282]"
                    }`}
                  >
                    All Products
                  </span>
                </button>

                {data?.facets?.categories.map((category) => {
                  const isActive = selectedCategory === category.slug;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        updateQuery({
                          category: category.slug,
                          page: null,
                        })
                      }
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#94a3b8] dark:border-[#6a7282]">
                        {isActive && (
                          <span className="h-2 w-2 rounded-full bg-[#5c7cfa]" />
                        )}
                      </span>
                      <span
                        className={`[font-family:var(--font-arimo)] text-sm ${
                          isActive
                            ? "text-[#0f172a] dark:text-[#f1f3f5]"
                            : "text-[#64748b] dark:text-[#6a7282]"
                        }`}
                      >
                        {category.name} ({category.count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-4 [font-family:var(--font-space-grotesk)] text-base font-bold text-[#0f172a] dark:text-[#f1f3f5]">
                Price Range
              </h2>
              <div className="rounded-xl border border-[#dbe4ff] bg-[#edf2ff] px-3 py-3 dark:border-white/10 dark:bg-[#12151a]">
                <div className="space-y-3">
                  <input
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    value={minDraft ?? priceBounds.min}
                    onChange={(event) =>
                      setMinDraft(Number(event.target.value))
                    }
                    className="w-full accent-[#5c7cfa]"
                  />
                  <input
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    value={maxDraft ?? priceBounds.max}
                    onChange={(event) =>
                      setMaxDraft(Number(event.target.value))
                    }
                    className="w-full accent-[#ff2e63]"
                  />

                  <div className="flex items-center justify-between [font-family:var(--font-arimo)] text-xs text-[#64748b] dark:text-[#6a7282]">
                    <span>{formatCurrency(minDraft ?? priceBounds.min)}</span>
                    <span>{formatCurrency(maxDraft ?? priceBounds.max)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyPriceFilter}
                  className="mt-3 w-full rounded-xl bg-[#5c7cfa] px-3 py-2 [font-family:var(--font-arimo)] text-sm font-bold text-white transition-colors hover:bg-[#4a6ff0] dark:hover:bg-[#8fa3ff]"
                >
                  Apply
                </button>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 [font-family:var(--font-arimo)] text-sm text-[#475569] hover:text-[#0f172a] dark:text-[#99a1af] dark:hover:text-[#f1f3f5]"
              >
                Clear filters
              </button>
            </section>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`product-skeleton-${index}`}
                  className="h-[420px] animate-pulse rounded-2xl border border-[#dbe4ff] bg-[#edf2ff] dark:border-white/10 dark:bg-[#171a21]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-6 [font-family:var(--font-arimo)] text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : mappedProducts.length === 0 ? (
            <div className="rounded-2xl border border-[#dbe4ff] bg-[#edf2ff] p-8 text-center dark:border-white/10 dark:bg-[#171a21]">
              <p className="[font-family:var(--font-arimo)] text-[#475569] dark:text-[#99a1af]">
                Nenhum produto encontrado com os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {mappedProducts.map((product) => (
                  <FeaturedProductCard key={product.id} product={product} />
                ))}
              </div>

              {((data?.totalPages ?? 1) > 1 || Boolean(data?.hasMore)) && (
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      updateQuery({
                        page:
                          currentPage <= 1
                            ? null
                            : String(Math.max(1, currentPage - 1)),
                      })
                    }
                    className="rounded-xl border border-[#cdd9ff] bg-[#edf2ff] px-3 py-2 [font-family:var(--font-arimo)] text-sm text-[#334155] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#12151a] dark:text-[#99a1af]"
                  >
                    Previous
                  </button>
                  <span className="[font-family:var(--font-arimo)] text-sm text-[#64748b] dark:text-[#6a7282]">
                    {typeof data?.totalPages === "number"
                      ? `Page ${data.page} of ${data.totalPages}`
                      : `Page ${data?.page ?? 1}`}
                  </span>
                  <button
                    type="button"
                    disabled={
                      typeof data?.totalPages === "number"
                        ? currentPage >= data.totalPages
                        : !data?.hasMore
                    }
                    onClick={() =>
                      updateQuery({
                        page:
                          (typeof data?.totalPages === "number" &&
                            currentPage >= data.totalPages) ||
                          (typeof data?.totalPages !== "number" &&
                            !data?.hasMore)
                            ? String(currentPage)
                            : String(currentPage + 1),
                      })
                    }
                    className="rounded-xl border border-[#cdd9ff] bg-[#edf2ff] px-3 py-2 [font-family:var(--font-arimo)] text-sm text-[#334155] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#12151a] dark:text-[#99a1af]"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
