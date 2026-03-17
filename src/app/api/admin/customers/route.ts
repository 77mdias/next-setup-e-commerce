import { type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import type { AdminCustomersListResponse } from "@/lib/admin/customers-contract";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
  getAuthorizedAdminStoreIds,
} from "@/lib/rbac";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

function parsePositiveInt(
  value: string | null,
  fallbackValue: number,
  maxValue: number,
) {
  if (!value) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallbackValue;
  }

  return Math.min(parsedValue, maxValue);
}

function parseOptionalString(value: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function buildOrderCode(orderId: number) {
  return `ORD-${String(orderId).padStart(5, "0")}`;
}

function buildCustomerOrderScope(params: {
  requestedStoreId: string | null;
  scopedStoreIds: string[] | null;
}): Prisma.OrderWhereInput {
  if (params.requestedStoreId) {
    return {
      storeId: params.requestedStoreId,
    };
  }

  if (params.scopedStoreIds) {
    return {
      storeId: {
        in: params.scopedStoreIds,
      },
    };
  }

  return {};
}

async function loadAccessibleStores(scopedStoreIds: string[] | null) {
  return db.store.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
    where: scopedStoreIds
      ? {
          id: {
            in: scopedStoreIds,
          },
        }
      : undefined,
  });
}

export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/customers",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "read",
    logger: requestLogger,
    request,
    resource: "customers",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;

  try {
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(
      searchParams.get("page"),
      DEFAULT_PAGE,
      10_000,
    );
    const limit = parsePositiveInt(
      searchParams.get("limit"),
      DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const query = parseOptionalString(searchParams.get("query")) ?? "";
    const requestedStoreId = parseOptionalString(searchParams.get("storeId"));
    const scopedStoreIds = getAuthorizedAdminStoreIds(authorization);

    if (requestedStoreId) {
      const storeAccess = authorizeAdminStoreScopeAccess({
        authorization,
        resource: "customers",
        storeId: requestedStoreId,
      });

      if (!storeAccess.authorized) {
        return storeAccess.response;
      }
    }

    const stores = await loadAccessibleStores(scopedStoreIds);

    if (scopedStoreIds && scopedStoreIds.length === 0) {
      return NextResponse.json<AdminCustomersListResponse>({
        customers: [],
        filters: {
          limit,
          page,
          query,
          storeId: requestedStoreId,
        },
        meta: {
          stores,
        },
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit,
          page,
          total: 0,
          totalPages: 1,
        },
        success: true,
      });
    }

    const orderScope = buildCustomerOrderScope({
      requestedStoreId,
      scopedStoreIds,
    });
    const trimmedQuery = query.trim();
    const where: Prisma.UserWhereInput = {
      orders: {
        some: orderScope,
      },
      role: "CUSTOMER",
    };

    if (trimmedQuery.length > 0) {
      where.AND = [
        {
          OR: [
            {
              email: {
                contains: trimmedQuery,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: trimmedQuery,
                mode: "insensitive",
              },
            },
            {
              orders: {
                some: {
                  ...orderScope,
                  OR: [
                    {
                      customerEmail: {
                        contains: trimmedQuery,
                        mode: "insensitive",
                      },
                    },
                    {
                      customerName: {
                        contains: trimmedQuery,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      ];
    }

    const skip = (page - 1) * limit;
    const [customers, total] = await db.$transaction([
      db.user.findMany({
        orderBy: [{ name: "asc" }, { email: "asc" }],
        select: {
          createdAt: true,
          email: true,
          id: true,
          isActive: true,
          name: true,
          orders: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              _count: {
                select: {
                  items: true,
                },
              },
              createdAt: true,
              id: true,
              status: true,
              store: {
                select: {
                  id: true,
                  name: true,
                },
              },
              total: true,
              trackingCode: true,
            },
            take: 5,
            where: orderScope,
          },
        },
        skip,
        take: limit,
        where,
      }),
      db.user.count({
        where,
      }),
    ]);

    const customerIds = customers.map((customer) => customer.id);
    const orderMetrics =
      customerIds.length > 0
        ? await db.order.groupBy({
            _count: {
              _all: true,
            },
            _max: {
              createdAt: true,
            },
            _sum: {
              total: true,
            },
            by: ["userId"],
            where: {
              ...orderScope,
              userId: {
                in: customerIds,
              },
            },
          })
        : [];
    const metricsByUserId = new Map(
      orderMetrics.flatMap((metric) =>
        metric.userId
          ? [
              [
                metric.userId,
                {
                  lastOrderAt: metric._max.createdAt,
                  orderCount: metric._count._all,
                  totalSpent: metric._sum.total ?? 0,
                },
              ] as const,
            ]
          : [],
      ),
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json<AdminCustomersListResponse>({
      customers: customers.map((customer) => {
        const metrics = metricsByUserId.get(customer.id);

        return {
          createdAt: customer.createdAt.toISOString(),
          email: customer.email,
          id: customer.id,
          isActive: customer.isActive,
          lastOrderAt: metrics?.lastOrderAt?.toISOString() ?? null,
          name: customer.name,
          orderCount: metrics?.orderCount ?? customer.orders.length,
          recentOrders: customer.orders.map((order) => ({
            code: buildOrderCode(order.id),
            createdAt: order.createdAt.toISOString(),
            id: order.id,
            itemCount: order._count.items,
            status: order.status,
            store: order.store,
            total: order.total,
            trackingCode: order.trackingCode,
          })),
          stores: Array.from(
            new Map(
              customer.orders.map((order) => [
                order.store.id,
                {
                  id: order.store.id,
                  name: order.store.name,
                },
              ]),
            ).values(),
          ),
          totalSpent: metrics?.totalSpent ?? 0,
        };
      }),
      filters: {
        limit,
        page,
        query,
        storeId: requestedStoreId,
      },
      meta: {
        stores,
      },
      pagination: {
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit,
        page,
        total,
        totalPages,
      },
      success: true,
    });
  } catch (error) {
    logger.error("admin.customers.list_failed", {
      data: {
        hasQuery: new URL(request.url).searchParams.has("query"),
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao carregar clientes administrativos" },
      { status: 500 },
    );
  }
}
