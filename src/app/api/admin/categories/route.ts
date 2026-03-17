import { AdminAuditAction, AdminAuditResource } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import type {
  AdminCatalogCategoryListResponse,
  AdminCatalogCategoryMutationResponse,
  AdminCatalogCategoryPayload,
  AdminCatalogValidationIssue,
} from "@/lib/admin/catalog-contract";
import {
  createCatalogValidationErrorResponse,
  parseAdminCatalogCategoryPayload,
  serializeAdminCatalogCategory,
} from "@/lib/admin/catalog";
import { writeAdminAuditLog } from "@/lib/audit-log";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  createAdminAuthorizationErrorResponse,
} from "@/lib/rbac";

function requireGlobalCategoryWriteAccess(role: string) {
  if (role === "STORE_ADMIN") {
    return createAdminAuthorizationErrorResponse(403);
  }

  return null;
}

function buildCategoryAuditSnapshot(params: {
  id: string;
  isActive: boolean;
  name: string;
  parentId: string | null;
  slug: string;
  sortOrder: number;
}) {
  return {
    id: params.id,
    isActive: params.isActive,
    name: params.name,
    parentId: params.parentId,
    slug: params.slug,
    sortOrder: params.sortOrder,
  };
}

export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/categories",
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

  try {
    const categories = await db.category.findMany({
      select: {
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
        description: true,
        id: true,
        isActive: true,
        name: true,
        parentId: true,
        slug: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json<AdminCatalogCategoryListResponse>({
      categories: categories.map(serializeAdminCatalogCategory),
      success: true,
    });
  } catch (error) {
    authorization.logger.error("admin.categories.list_failed", {
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao carregar categorias administrativas" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/categories",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "create",
    logger: requestLogger,
    request,
    resource: "catalog",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const roleResponse = requireGlobalCategoryWriteAccess(authorization.role);

  if (roleResponse) {
    return roleResponse;
  }

  let payload: AdminCatalogCategoryPayload;

  try {
    payload = (await request.json()) as AdminCatalogCategoryPayload;
  } catch {
    return createCatalogValidationErrorResponse([
      {
        field: "payload",
        message: "Payload JSON inválido",
      },
    ]);
  }

  const parsedPayload = parseAdminCatalogCategoryPayload(payload);

  if (!parsedPayload.ok) {
    return createCatalogValidationErrorResponse(parsedPayload.issues);
  }

  try {
    const [parentCategory, duplicatedSlug] = await Promise.all([
      parsedPayload.value.parentId
        ? db.category.findUnique({
            where: {
              id: parsedPayload.value.parentId,
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
      db.category.findUnique({
        where: {
          slug: parsedPayload.value.slug,
        },
        select: {
          id: true,
        },
      }),
    ]);

    const issues: AdminCatalogValidationIssue[] = [];

    if (parsedPayload.value.parentId && !parentCategory) {
      issues.push({
        field: "parentId",
        message: "Categoria pai informada não foi encontrada",
      });
    }

    if (duplicatedSlug) {
      issues.push({
        field: "slug",
        message: "Já existe uma categoria com este slug",
      });
    }

    if (issues.length > 0) {
      return createCatalogValidationErrorResponse(issues);
    }

    const category = await db.$transaction(async (transaction) => {
      const createdCategory = await transaction.category.create({
        data: {
          description: parsedPayload.value.description ?? null,
          iconUrl: parsedPayload.value.iconUrl ?? null,
          imageUrl: parsedPayload.value.imageUrl ?? null,
          isActive: parsedPayload.value.isActive,
          name: parsedPayload.value.name,
          parentId: parsedPayload.value.parentId ?? null,
          slug: parsedPayload.value.slug,
          sortOrder: parsedPayload.value.sortOrder,
        },
        select: {
          _count: {
            select: {
              children: true,
              products: true,
            },
          },
          description: true,
          id: true,
          isActive: true,
          name: true,
          parentId: true,
          slug: true,
          sortOrder: true,
        },
      });

      await writeAdminAuditLog({
        action: AdminAuditAction.CREATE,
        actor: authorization.user,
        after: buildCategoryAuditSnapshot(createdCategory),
        before: null,
        client: transaction,
        metadata: {
          route: "/api/admin/categories",
        },
        resource: AdminAuditResource.CATEGORY,
        summary: `Categoria ${createdCategory.name} criada no catalogo administrativo.`,
        targetId: createdCategory.id,
        targetLabel: createdCategory.name,
      });

      return createdCategory;
    });

    return NextResponse.json<AdminCatalogCategoryMutationResponse>({
      category: serializeAdminCatalogCategory(category),
      success: true,
    });
  } catch (error) {
    authorization.logger.error("admin.categories.create_failed", {
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao criar categoria administrativa" },
      { status: 500 },
    );
  }
}
