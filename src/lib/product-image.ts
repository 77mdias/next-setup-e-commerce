const NEXT_IMAGE_PROXY_PATH = "/_next/image";

const TIMEOUT_PRONE_HOST_SUFFIXES = [
  "kabum.com.br",
  "mlstatic.com",
  "dooca.store",
  "media-amazon.com",
  "pichau.com.br",
];

const isRemoteUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

const hasTimeoutProneHost = (hostname: string) =>
  TIMEOUT_PRONE_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );

const decodeNextImageProxyUrl = (value: string) => {
  let current = value;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (!isRemoteUrl(current)) break;

    try {
      const parsed = new URL(current);
      const isNextProxyRoute =
        parsed.pathname === NEXT_IMAGE_PROXY_PATH ||
        parsed.pathname.endsWith(NEXT_IMAGE_PROXY_PATH);

      if (!isNextProxyRoute) break;

      const nestedUrl = parsed.searchParams.get("url");
      if (!nestedUrl) break;

      const decodedUrl = decodeURIComponent(nestedUrl);
      if (!decodedUrl || decodedUrl === current) break;

      current = decodedUrl.startsWith("//")
        ? `https:${decodedUrl}`
        : decodedUrl;
    } catch {
      break;
    }
  }

  return current;
};

export const normalizeProductImageSrc = (
  value?: string | null,
  fallback = "/placeholder-product.jpg",
) => {
  const raw = value?.trim();
  if (!raw) return fallback;

  const withProtocol = raw.startsWith("//") ? `https:${raw}` : raw;
  const normalized = decodeNextImageProxyUrl(withProtocol);

  return normalized || fallback;
};

export const shouldUseUnoptimizedImage = (src: string) => {
  if (src.startsWith("data:")) return true;
  if (!isRemoteUrl(src)) return false;

  try {
    const { hostname } = new URL(src);
    return hasTimeoutProneHost(hostname);
  } catch {
    return true;
  }
};
