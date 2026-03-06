export const ROUTE_PATHS = {
  home: "/",
  products: "/products",
  productRoot: "/product",
  explore: "/explore",
  orders: "/orders",
  ordersSuccess: "/orders/success",
  ordersFailure: "/orders/failure",
  cart: "/carrinho",
  cartLegacy: "/cart",
  checkout: "/checkout",
  wishlist: "/wishlist",
  profile: "/perfil",
  status: "/status",
} as const;

const INTERNAL_BASE_URL = "https://next-setup-e-commerce.local";
const legacySlugRoutePattern = /^\/[^/]+\/(.+)$/;
const productDetailRoutePattern = /^\/product\/[^/]+$/;

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return ROUTE_PATHS.home;
  }

  if (pathname !== ROUTE_PATHS.home && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function parseInternalPath(path: string): URL | null {
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return null;
  }

  try {
    const parsedPath = new URL(trimmedPath, INTERNAL_BASE_URL);

    if (parsedPath.origin !== INTERNAL_BASE_URL) {
      return null;
    }

    return parsedPath;
  } catch {
    return null;
  }
}

function buildPath(
  pathname: string,
  searchParams: URLSearchParams,
  hash: string,
) {
  const queryString = searchParams.toString();
  const querySuffix = queryString ? `?${queryString}` : "";
  return `${pathname}${querySuffix}${hash || ""}`;
}

function extractLegacySlugPath(pathname: string): string | null {
  const match = pathname.match(legacySlugRoutePattern);
  if (!match) {
    return null;
  }

  return normalizePathname(`/${match[1]}`);
}

export function buildProductPath(productId: string): string {
  return `${ROUTE_PATHS.productRoot}/${encodeURIComponent(productId)}`;
}

export function resolveCanonicalCartPath(redirectPath?: string): string {
  if (!redirectPath) {
    return ROUTE_PATHS.cart;
  }

  const parsedPath = parseInternalPath(redirectPath);
  if (!parsedPath) {
    return ROUTE_PATHS.cart;
  }

  const pathname = normalizePathname(parsedPath.pathname);
  const legacySlugPath = extractLegacySlugPath(pathname);
  const isCanonicalCartPath = pathname === ROUTE_PATHS.cart;
  const isLegacyCartAlias = pathname === ROUTE_PATHS.cartLegacy;
  const isLegacySlugCartPath = legacySlugPath === ROUTE_PATHS.cart;

  if (!isCanonicalCartPath && !isLegacyCartAlias && !isLegacySlugCartPath) {
    return ROUTE_PATHS.cart;
  }

  return buildPath(ROUTE_PATHS.cart, parsedPath.searchParams, parsedPath.hash);
}

export function resolveCanonicalProductHref(
  href: string | undefined,
  fallbackProductId: string,
): string {
  const fallbackPath = buildProductPath(fallbackProductId);

  if (!href) {
    return fallbackPath;
  }

  const parsedPath = parseInternalPath(href);
  if (!parsedPath) {
    return fallbackPath;
  }

  const searchParams = new URLSearchParams(parsedPath.searchParams);
  const pathname = normalizePathname(parsedPath.pathname);

  if (pathname === ROUTE_PATHS.products) {
    searchParams.delete("storeSlug");
    return buildPath(ROUTE_PATHS.products, searchParams, parsedPath.hash);
  }

  if (productDetailRoutePattern.test(pathname)) {
    return buildPath(pathname, searchParams, parsedPath.hash);
  }

  const legacySlugPath = extractLegacySlugPath(pathname);
  if (!legacySlugPath) {
    return fallbackPath;
  }

  if (legacySlugPath === "/product" || legacySlugPath === "/categorias") {
    searchParams.delete("storeSlug");
    return buildPath(ROUTE_PATHS.products, searchParams, parsedPath.hash);
  }

  if (legacySlugPath.startsWith("/product/")) {
    const legacyProductId = legacySlugPath.replace("/product/", "");
    if (!legacyProductId) {
      return fallbackPath;
    }

    return buildPath(
      buildProductPath(legacyProductId),
      searchParams,
      parsedPath.hash,
    );
  }

  if (legacySlugPath.startsWith("/categorias/")) {
    const categorySlug = legacySlugPath.replace("/categorias/", "");
    if (!categorySlug) {
      return fallbackPath;
    }

    searchParams.delete("storeSlug");
    searchParams.set("category", categorySlug);
    return buildPath(ROUTE_PATHS.products, searchParams, parsedPath.hash);
  }

  return fallbackPath;
}
