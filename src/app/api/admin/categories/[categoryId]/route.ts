import { AdminAuditAction, AdminAuditResource } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import type {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/categories/[categoryId]",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "update",
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

  const { categoryId } = await params;

  if (!categoryId?.trim()) {
    return createCatalogValidationErrorResponse([
      {
        field: "categoryId",
        message: "Identificador de categoria inválido",
      },
    ]);
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
    const [currentCategory, parentCategory, duplicatedSlug] = await Promise.all(
      [
        db.category.findUnique({
          where: {
            id: categoryId,
          },
          select: {
            id: true,
            isActive: true,
            name: true,
            parentId: true,
            slug: true,
            sortOrder: true,
          },
        }),
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
        db.category.findFirst({
          where: {
            id: {
              not: categoryId,
            },
            slug: parsedPayload.value.slug,
          },
          select: {
            id: true,
          },
        }),
      ],
    );

    if (!currentCategory) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    const issues: AdminCatalogValidationIssue[] = [];

    if (parsedPayload.value.parentId === categoryId) {
      issues.push({
        field: "parentId",
        message: "Categoria não pode ser pai dela mesma",
      });
    }

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
      const updatedCategory = await transaction.category.update({
        where: {
          id: categoryId,
        },
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
        action: AdminAuditAction.UPDATE,
        actor: authorization.user,
        after: buildCategoryAuditSnapshot(updatedCategory),
        before: buildCategoryAuditSnapshot(currentCategory),
        client: transaction,
        metadata: {
          route: "/api/admin/categories/[categoryId]",
        },
        resource: AdminAuditResource.CATEGORY,
        summary: `Categoria ${currentCategory.name} atualizada no catalogo administrativo.`,
        targetId: currentCategory.id,
        targetLabel: updatedCategory.name,
      });

      return updatedCategory;
    });

    return NextResponse.json<AdminCatalogCategoryMutationResponse>({
      category: serializeAdminCatalogCategory(category),
      success: true,
    });
  } catch (error) {
    authorization.logger.error("admin.categories.update_failed", {
      context: {
        categoryId,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao atualizar categoria administrativa" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/categories/[categoryId]",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "delete",
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

  const { categoryId } = await params;

  if (!categoryId?.trim()) {
    return createCatalogValidationErrorResponse([
      {
        field: "categoryId",
        message: "Identificador de categoria inválido",
      },
    ]);
  }

  try {
    const category = await db.category.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
        id: true,
        isActive: true,
        name: true,
        parentId: true,
        slug: true,
        sortOrder: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    if (category._count.children > 0 || category._count.products > 0) {
      return NextResponse.json(
        {
          code: "ADMIN_CATALOG_CATEGORY_DELETE_BLOCKED",
          error:
            "Categoria com subcategorias ou produtos vinculados não pode ser removida",
        },
        { status: 409 },
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.category.delete({
        where: {
          id: categoryId,
        },
      });

      await writeAdminAuditLog({
        action: AdminAuditAction.DELETE,
        actor: authorization.user,
        after: null,
        before: buildCategoryAuditSnapshot(category),
        client: transaction,
        metadata: {
          route: "/api/admin/categories/[categoryId]",
        },
        resource: AdminAuditResource.CATEGORY,
        summary: `Categoria ${category.name} removida do catalogo administrativo.`,
        targetId: category.id,
        targetLabel: category.name,
      });
    });

    return NextResponse.json({
      categoryId,
      success: true,
    });
  } catch (error) {
    authorization.logger.error("admin.categories.delete_failed", {
      context: {
        categoryId,
      },
      error,
    });

    return NextResponse.json(
      { error: "Erro interno ao remover categoria administrativa" },
      { status: 500 },
    );
  }
}
