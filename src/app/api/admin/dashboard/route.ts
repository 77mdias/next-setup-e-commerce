import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDashboardMetrics,
  parseAdminDashboardFilters,
} from "@/lib/admin/dashboard-metrics";
import { createRequestLogger } from "@/lib/logger";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
} from "@/lib/rbac";

const ADMIN_DASHBOARD_INVALID_FILTERS_CODE = "ADMIN_DASHBOARD_INVALID_FILTERS";
const ADMIN_DASHBOARD_INVALID_FILTERS_ERROR =
  "Parâmetros inválidos para métricas administrativas";

export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/dashboard",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "read",
    logger: requestLogger,
    request,
    resource: "dashboard",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const { searchParams } = new URL(request.url);
  const parsedFilters = parseAdminDashboardFilters(searchParams);

  if (!parsedFilters.ok) {
    authorization.logger.warn("admin.dashboard.invalid_filters", {
      data: {
        invalidFilter: parsedFilters.error,
      },
    });

    return NextResponse.json(
      {
        code: ADMIN_DASHBOARD_INVALID_FILTERS_CODE,
        error: ADMIN_DASHBOARD_INVALID_FILTERS_ERROR,
      },
      { status: 400 },
    );
  }

  if (parsedFilters.filters.storeId) {
    const storeAccess = authorizeAdminStoreScopeAccess({
      authorization,
      resource: "dashboard",
      storeId: parsedFilters.filters.storeId,
    });

    if (!storeAccess.authorized) {
      return storeAccess.response;
    }
  }

  try {
    // AIDEV-CRITICAL: o dashboard deve reaproveitar RBAC e escopo por loja
    // já existentes para não introduzir vazamento cross-store no painel.
    const metrics = await getAdminDashboardMetrics({
      ...parsedFilters.filters,
      storeScope: authorization.storeScope,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    authorization.logger.error("admin.dashboard.metrics_failed", {
      data: {
        lowStockLimit: parsedFilters.filters.lowStockLimit,
        storeId: parsedFilters.filters.storeId,
        window: parsedFilters.filters.window,
      },
      error,
    });

    return NextResponse.json(
      {
        error: "Erro interno ao carregar métricas administrativas",
      },
      { status: 500 },
    );
  }
}
