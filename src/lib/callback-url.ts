export const DEFAULT_AUTH_CALLBACK_PATH = "/products";
export const DEFAULT_ADMIN_CALLBACK_PATH = "/admin";

export function normalizeCallbackPath(
  value?: string | null,
  fallback = DEFAULT_AUTH_CALLBACK_PATH,
) {
  if (!value) {
    return fallback;
  }

  const decoded = decodeURIComponent(value).trim();
  if (!decoded) {
    return fallback;
  }

  let candidate = decoded;

  if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
    try {
      const parsed = new URL(decoded);
      candidate = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return fallback;
    }
  }

  if (!candidate.startsWith("/")) {
    return fallback;
  }

  if (candidate.startsWith("//")) {
    return fallback;
  }

  if (candidate.startsWith("/auth/signin")) {
    return fallback;
  }

  return candidate;
}

function isAdminPath(value: string): boolean {
  return value === "/admin" || value.startsWith("/admin/");
}

export function normalizeAdminCallbackPath(
  value?: string | null,
  fallback = DEFAULT_ADMIN_CALLBACK_PATH,
): string {
  const normalizedPath = normalizeCallbackPath(value, fallback);

  if (!isAdminPath(normalizedPath)) {
    return fallback;
  }

  return normalizedPath;
}
