import { NextRequest, NextResponse } from "next/server";

import { type AdminOrdersListResponse } from "@/lib/admin/orders-contract";
import {
  ADMIN_ORDERS_INVALID_FILTERS_CODE,
  ADMIN_ORDERS_INVALID_FILTERS_ERROR,
  buildAdminOrdersListSelect,
  buildAdminOrdersWhereInput,
  parseAdminOrdersFilters,
  serializeAdminOrderListItem,
} from "@/lib/admin/orders";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
  getAuthorizedAdminStoreIds,
} from "@/lib/rbac";
import {
  consumeRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

const ADMIN_ORDERS_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const ADMIN_ORDERS_RATE_LIMIT_MESSAGE =
  "Muitas requisições no painel administrativo. Tente novamente em instantes.";

export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/orders",
  });

  const rateLimitResult = consumeRequestRateLimit({
    headers: request.headers,
    scope: "api.admin.orders",
    now: new Date(),
    ip: {
      limit: 60,
      windowMs: ADMIN_ORDERS_RATE_LIMIT_WINDOW_MS,
    },
  });

  if (!rateLimitResult.allowed) {
    requestLogger.warn("admin.orders.rate_limited", {
      data: {
        bucketKey: rateLimitResult.bucketKey,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
      },
    });

    return createRateLimitResponse({
      message: ADMIN_ORDERS_RATE_LIMIT_MESSAGE,
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  const authorization = await authorizeAdminApiRequest({
    action: "read",
    logger: requestLogger,
    request,
    resource: "orders",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;

  try {
    const { searchParams } = new URL(request.url);
    const parsedFilters = parseAdminOrdersFilters(searchParams);

    if (!parsedFilters.ok) {
      logger.warn("admin.orders.invalid_filters", {
        data: {
          invalidFilter: parsedFilters.error,
        },
      });

      return NextResponse.json(
        {
          code: ADMIN_ORDERS_INVALID_FILTERS_CODE,
          error: ADMIN_ORDERS_INVALID_FILTERS_ERROR,
        },
        { status: 400 },
      );
    }

    if (parsedFilters.filters.storeId) {
      const storeAccess = authorizeAdminStoreScopeAccess({
        authorization,
        resource: "orders",
        storeId: parsedFilters.filters.storeId,
      });

      if (!storeAccess.authorized) {
        return storeAccess.response;
      }
    }

    const scopedStoreIds = getAuthorizedAdminStoreIds(authorization);

    if (scopedStoreIds && scopedStoreIds.length === 0) {
      return NextResponse.json<AdminOrdersListResponse>({
        filters: parsedFilters.filters,
        orders: [],
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: parsedFilters.filters.limit,
          page: parsedFilters.filters.page,
          total: 0,
          totalPages: 1,
        },
        success: true,
      });
    }

    const where = buildAdminOrdersWhereInput({
      filters: parsedFilters.filters,
      storeIds: scopedStoreIds,
    });
    const skip = (parsedFilters.filters.page - 1) * parsedFilters.filters.limit;

    const [orders, total] = await db.$transaction([
      db.order.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: buildAdminOrdersListSelect(),
        skip,
        take: parsedFilters.filters.limit,
        where,
      }),
      db.order.count({
        where,
      }),
    ]);

    const totalPages = Math.max(
      1,
      Math.ceil(total / parsedFilters.filters.limit),
    );

    return NextResponse.json<AdminOrdersListResponse>({
      filters: parsedFilters.filters,
      orders: orders.map(serializeAdminOrderListItem),
      pagination: {
        hasNext: parsedFilters.filters.page < totalPages,
        hasPrev: parsedFilters.filters.page > 1,
        limit: parsedFilters.filters.limit,
        page: parsedFilters.filters.page,
        total,
        totalPages,
      },
      success: true,
    });
  } catch (error) {
    logger.error("admin.orders.list_failed", {
      data: {
        hasQuery: new URL(request.url).searchParams.has("query"),
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao carregar pedidos administrativos" },
      { status: 500 },
    );
  }
}
