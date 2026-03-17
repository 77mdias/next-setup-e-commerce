import { type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_AUDIT_ACTION_VALUES,
  ADMIN_AUDIT_RESOURCE_VALUES,
  type AdminAuditActionFilter,
  type AdminAuditListResponse,
  type AdminAuditResourceFilter,
} from "@/lib/admin/audit-contract";
import { serializeAdminAuditLogEntry } from "@/lib/audit-log";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
  getAuthorizedAdminStoreIds,
} from "@/lib/rbac";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
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

function parseAuditActionFilter(value: string | null): AdminAuditActionFilter {
  if (
    value &&
    ADMIN_AUDIT_ACTION_VALUES.includes(value as AdminAuditActionFilter)
  ) {
    return value as AdminAuditActionFilter;
  }

  return "ALL";
}

function parseAuditResourceFilter(
  value: string | null,
): AdminAuditResourceFilter {
  if (
    value &&
    ADMIN_AUDIT_RESOURCE_VALUES.includes(value as AdminAuditResourceFilter)
  ) {
    return value as AdminAuditResourceFilter;
  }

  return "ALL";
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
    route: "/api/admin/audit",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "read",
    logger: requestLogger,
    request,
    resource: "audit",
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
    const action = parseAuditActionFilter(searchParams.get("action"));
    const resource = parseAuditResourceFilter(searchParams.get("resource"));
    const scopedStoreIds = getAuthorizedAdminStoreIds(authorization);

    if (requestedStoreId) {
      const storeAccess = authorizeAdminStoreScopeAccess({
        authorization,
        resource: "audit",
        storeId: requestedStoreId,
      });

      if (!storeAccess.authorized) {
        return storeAccess.response;
      }
    }

    const stores = await loadAccessibleStores(scopedStoreIds);

    if (scopedStoreIds && scopedStoreIds.length === 0) {
      return NextResponse.json<AdminAuditListResponse>({
        events: [],
        filters: {
          action,
          limit,
          page,
          query,
          resource,
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

    const where: Prisma.AdminAuditLogWhereInput = {};

    if (action !== "ALL") {
      where.action = action;
    }

    if (resource !== "ALL") {
      where.resource = resource;
    }

    if (requestedStoreId) {
      where.storeId = requestedStoreId;
    } else if (scopedStoreIds) {
      where.storeId = {
        in: scopedStoreIds,
      };
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length > 0) {
      where.AND = [
        {
          OR: [
            {
              actorLabel: {
                contains: trimmedQuery,
                mode: "insensitive",
              },
            },
            {
              summary: {
                contains: trimmedQuery,
                mode: "insensitive",
              },
            },
            {
              targetId: {
                contains: trimmedQuery,
                mode: "insensitive",
              },
            },
            {
              targetLabel: {
                contains: trimmedQuery,
                mode: "insensitive",
              },
            },
          ],
        },
      ];
    }

    const skip = (page - 1) * limit;
    const [events, total] = await db.$transaction([
      db.adminAuditLog.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          action: true,
          actorLabel: true,
          actorRole: true,
          actorUserId: true,
          after: true,
          before: true,
          createdAt: true,
          id: true,
          metadata: true,
          resource: true,
          storeId: true,
          summary: true,
          targetId: true,
          targetLabel: true,
        },
        skip,
        take: limit,
        where,
      }),
      db.adminAuditLog.count({
        where,
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json<AdminAuditListResponse>({
      events: events.map(serializeAdminAuditLogEntry),
      filters: {
        action,
        limit,
        page,
        query,
        resource,
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
    logger.error("admin.audit.list_failed", {
      data: {
        hasQuery: new URL(request.url).searchParams.has("query"),
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao carregar trilha administrativa" },
      { status: 500 },
    );
  }
}
