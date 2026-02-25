import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import {
  buildAccessFeedbackPath,
  resolveRuntimeAccessReason,
} from "@/lib/access-feedback";
import type { AccessFeedbackReason } from "@/lib/access-feedback";

const protectedRoutePattern =
  /^\/(?:orders(?:\/|$)|(?:[^/]+\/)?(?:perfil|wishlist|carrinho|checkout|pedido)(?:\/|$))/;
const adminRoutePattern = /^\/(?:admin(?:\/|$)|[^/]+\/admin(?:\/|$))/;

function normalizeRoutePrefix(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const normalized =
    withLeadingSlash !== "/" && withLeadingSlash.endsWith("/")
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;

  return normalized;
}

function parseRoutePrefixes(value?: string): string[] {
  if (!value) {
    return [];
  }

  const uniquePrefixes = new Set<string>();

  for (const rawPrefix of value.split(",")) {
    const normalizedPrefix = normalizeRoutePrefix(rawPrefix);
    if (normalizedPrefix) {
      uniquePrefixes.add(normalizedPrefix);
    }
  }

  return [...uniquePrefixes];
}

function matchesRoutePrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => {
    if (prefix === "/") {
      return pathname === "/";
    }

    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

const developmentRoutePrefixes = parseRoutePrefixes(
  process.env.APP_DEVELOPMENT_ROUTES,
);
const maintenanceRoutePrefixes = parseRoutePrefixes(
  process.env.APP_MAINTENANCE_ROUTES,
);
const unavailableRoutePrefixes = parseRoutePrefixes(
  process.env.APP_UNAVAILABLE_ROUTES,
);

function resolveScopedRouteReason(
  pathname: string,
): AccessFeedbackReason | null {
  if (matchesRoutePrefix(pathname, maintenanceRoutePrefixes)) {
    return "maintenance";
  }

  if (matchesRoutePrefix(pathname, developmentRoutePrefixes)) {
    return "development";
  }

  if (matchesRoutePrefix(pathname, unavailableRoutePrefixes)) {
    return "unavailable";
  }

  return null;
}

function getPathWithSearch(pathname: string, search: string): string {
  return `${pathname}${search || ""}`;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const pathname = req.nextUrl.pathname;
    const pathWithSearch = getPathWithSearch(pathname, req.nextUrl.search);
    const isAuthPage = pathname.startsWith("/auth");
    const isStatusPage = pathname.startsWith("/status");
    const isProtectedPage = protectedRoutePattern.test(pathname);
    const isAdminPage = adminRoutePattern.test(pathname);

    // Modo global da aplicação: maintenance | outage | development | unavailable
    const runtimeReason = resolveRuntimeAccessReason(
      process.env.APP_ACCESS_MODE,
    );
    if (runtimeReason && !isStatusPage) {
      const feedbackUrl = new URL(
        buildAccessFeedbackPath({
          reason: runtimeReason,
          fromPath: pathWithSearch,
        }),
        req.url,
      );
      return NextResponse.redirect(feedbackUrl);
    }

    const scopedRouteReason = resolveScopedRouteReason(pathname);
    if (scopedRouteReason && !isStatusPage) {
      const feedbackUrl = new URL(
        buildAccessFeedbackPath({
          reason: scopedRouteReason,
          fromPath: pathWithSearch,
        }),
        req.url,
      );
      return NextResponse.redirect(feedbackUrl);
    }

    // Redirecionar usuários autenticados das páginas de auth
    // Mas não redirecionar durante o processo de OAuth ou páginas de erro
    if (
      isAuthPage &&
      isAuth &&
      !req.nextUrl.searchParams.has("callbackUrl") &&
      !pathname.includes("/error")
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Proteger páginas que requerem autenticação
    if (!isAuth && isProtectedPage) {
      const feedbackUrl = new URL(
        buildAccessFeedbackPath({
          reason: "auth-required",
          callbackUrl: pathWithSearch,
          fromPath: pathWithSearch,
        }),
        req.url,
      );
      return NextResponse.redirect(feedbackUrl);
    }

    // Proteger páginas de admin
    if (isAdminPage && !isAuth) {
      const feedbackUrl = new URL(
        buildAccessFeedbackPath({
          reason: "auth-required",
          callbackUrl: pathWithSearch,
          fromPath: pathWithSearch,
        }),
        req.url,
      );
      return NextResponse.redirect(feedbackUrl);
    }

    if (isAdminPage && token?.role !== "ADMIN") {
      const feedbackUrl = new URL(
        buildAccessFeedbackPath({
          reason: "forbidden",
          fromPath: pathWithSearch,
        }),
        req.url,
      );
      return NextResponse.redirect(feedbackUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // Deixar o middleware handle a lógica
    },
  },
);

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
