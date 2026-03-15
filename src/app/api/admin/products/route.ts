import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
  getAuthorizedAdminStoreIds,
} from "@/lib/rbac";

type AdminProductsResponse = {
  success: true;
  products: {
    id: string;
    images: string[];
    name: string;
    storeId: string;
  }[];
  total: number;
  page: number;
  totalPages: number;
};

function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number,
): number {
  const parsedValue = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(parsedValue, max);
}

function parseStringParam(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/products",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "read",
    logger: requestLogger,
    request,
    resource: "catalog",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;

  try {
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1, 10_000);
    const limit = parsePositiveInt(searchParams.get("limit"), 12, 60);
    const searchQuery = parseStringParam(searchParams.get("query"));
    const requestedStoreId = parseStringParam(searchParams.get("storeId"));
    const scopedStoreIds = getAuthorizedAdminStoreIds(authorization);

    if (requestedStoreId) {
      const storeAccess = authorizeAdminStoreScopeAccess({
        authorization,
        resource: "catalog",
        storeId: requestedStoreId,
      });

      if (!storeAccess.authorized) {
        return storeAccess.response;
      }
    }

    if (scopedStoreIds && scopedStoreIds.length === 0) {
      return NextResponse.json<AdminProductsResponse>({
        success: true,
        products: [],
        total: 0,
        page,
        totalPages: 1,
      });
    }

    const where: Prisma.ProductWhereInput = {};

    if (requestedStoreId) {
      where.storeId = requestedStoreId;
    } else if (scopedStoreIds) {
      where.storeId = {
        in: scopedStoreIds,
      };
    }

    if (searchQuery) {
      where.name = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await db.$transaction([
      db.product.findMany({
        where,
        select: {
          id: true,
          images: true,
          name: true,
          storeId: true,
        },
        orderBy: [{ name: "asc" }, { createdAt: "asc" }],
        skip,
        take: limit,
      }),
      db.product.count({
        where,
      }),
    ]);

    return NextResponse.json<AdminProductsResponse>({
      success: true,
      products,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    logger.error("admin.products.list_failed", {
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao carregar produtos administrativos" },
      { status: 500 },
    );
  }
}
