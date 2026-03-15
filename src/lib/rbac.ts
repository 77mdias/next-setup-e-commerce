import { NextRequest, NextResponse } from "next/server";

import {
  canAccessAdminStoreScope,
  getAdminStoreScopeStoreIds,
  normalizeScopedAdminRole,
  type AdminStoreScope,
} from "@/lib/admin-store-scope";
import { requireAdminAccess, type AdminAccessResult } from "@/lib/auth";
import { type StructuredLogger } from "@/lib/logger";

export type AdminRbacResource =
  | "dashboard"
  | "orders"
  | "catalog"
  | "customers";

export type AdminRbacAction = "read" | "create" | "update" | "delete";

export type AdminRbacRole = "ADMIN" | "SUPER_ADMIN" | "STORE_ADMIN";

type AdminApiAuthorizationStatus = 401 | 403;

type AdminApiAuthorizationDenied = {
  authorized: false;
  response: NextResponse;
};

type AuthorizedAdminUser = Extract<
  AdminAccessResult,
  { authorized: true }
>["user"];

type AdminApiAuthorizationGranted = {
  authorized: true;
  action: AdminRbacAction;
  logger: StructuredLogger;
  role: AdminRbacRole;
  storeScope: AdminStoreScope;
  user: AuthorizedAdminUser;
};

export type AdminApiAuthorizationResult =
  | AdminApiAuthorizationDenied
  | AdminApiAuthorizationGranted;

export const ADMIN_API_UNAUTHORIZED_ERROR = "Usuário não autenticado";
export const ADMIN_API_FORBIDDEN_ERROR = "Ação administrativa não autorizada";
export const ADMIN_API_UNAUTHORIZED_CODE = "ADMIN_AUTH_REQUIRED";
export const ADMIN_API_FORBIDDEN_CODE = "ADMIN_ACCESS_DENIED";

const ADMIN_API_METHOD_ACTIONS = {
  DELETE: "delete",
  GET: "read",
  PATCH: "update",
  POST: "create",
  PUT: "update",
} as const satisfies Record<string, AdminRbacAction>;

const ADMIN_RBAC_POLICY: Record<
  AdminRbacResource,
  Partial<Record<AdminRbacAction, readonly AdminRbacRole[]>>
> = {
  dashboard: {
    read: ["STORE_ADMIN", "ADMIN", "SUPER_ADMIN"],
  },
  orders: {
    create: ["ADMIN", "SUPER_ADMIN"],
    delete: ["SUPER_ADMIN"],
    read: ["STORE_ADMIN", "ADMIN", "SUPER_ADMIN"],
    update: ["STORE_ADMIN", "ADMIN", "SUPER_ADMIN"],
  },
  catalog: {
    create: ["STORE_ADMIN", "ADMIN", "SUPER_ADMIN"],
    delete: ["ADMIN", "SUPER_ADMIN"],
    read: ["STORE_ADMIN", "ADMIN", "SUPER_ADMIN"],
    update: ["STORE_ADMIN", "ADMIN", "SUPER_ADMIN"],
  },
  customers: {
    read: ["STORE_ADMIN", "ADMIN", "SUPER_ADMIN"],
  },
};

function normalizeAdminRbacRole(role: unknown): AdminRbacRole | null {
  return normalizeScopedAdminRole(role);
}

export function resolveAdminActionFromMethod(
  method: string,
): AdminRbacAction | null {
  const normalizedMethod =
    method.toUpperCase() as keyof typeof ADMIN_API_METHOD_ACTIONS;
  return ADMIN_API_METHOD_ACTIONS[normalizedMethod] ?? null;
}

export function isAdminApiAccessAllowed(params: {
  action: AdminRbacAction;
  resource: AdminRbacResource;
  role: unknown;
}): boolean {
  const normalizedRole = normalizeAdminRbacRole(params.role);

  if (!normalizedRole) {
    return false;
  }

  const allowedRoles = ADMIN_RBAC_POLICY[params.resource][params.action];
  return allowedRoles?.includes(normalizedRole) ?? false;
}

export function createAdminAuthorizationErrorResponse(
  status: AdminApiAuthorizationStatus,
) {
  if (status === 401) {
    return NextResponse.json(
      {
        code: ADMIN_API_UNAUTHORIZED_CODE,
        error: ADMIN_API_UNAUTHORIZED_ERROR,
      },
      { status },
    );
  }

  return NextResponse.json(
    {
      code: ADMIN_API_FORBIDDEN_CODE,
      error: ADMIN_API_FORBIDDEN_ERROR,
    },
    { status },
  );
}

function logAuthorizationDenied(params: {
  action: AdminRbacAction | null;
  logger: StructuredLogger;
  reason:
    | "auth_required"
    | "invalid_role"
    | "rbac_denied"
    | "unsupported_method";
  resource: AdminRbacResource;
  role?: AdminRbacRole | null;
  status: AdminApiAuthorizationStatus;
  userId?: string;
}) {
  const scopedLogger = params.logger.child({
    adminAction: params.action,
    adminResource: params.resource,
    adminRole: params.role ?? null,
    securityDomain: "admin_rbac",
    userId: params.userId ?? null,
  });

  scopedLogger.warn("admin.authorization.denied", {
    data: {
      reason: params.reason,
      status: params.status,
    },
  });
}

function logStoreScopeDenied(params: {
  authorization: AdminApiAuthorizationGranted;
  resource: AdminRbacResource;
  resourceId?: number | string | null;
  storeId: string | null;
}) {
  params.authorization.logger.warn("admin.store_scope.denied", {
    context: {
      resourceId: params.resourceId ?? null,
      scopedStoreIds: getAdminStoreScopeStoreIds(
        params.authorization.storeScope,
      ),
      securityDomain: "admin_store_scope",
      storeId: params.storeId,
    },
    data: {
      reason: params.storeId ? "cross_store_access" : "store_scope_missing",
      resource: params.resource,
    },
  });
}

export function getAuthorizedAdminStoreIds(
  authorization: Pick<AdminApiAuthorizationGranted, "storeScope">,
): string[] | null {
  return getAdminStoreScopeStoreIds(authorization.storeScope);
}

export function authorizeAdminStoreScopeAccess(params: {
  authorization: AdminApiAuthorizationGranted;
  resource: AdminRbacResource;
  resourceId?: number | string | null;
  storeId: string | null;
}):
  | {
      authorized: true;
    }
  | {
      authorized: false;
      response: NextResponse;
    } {
  if (
    canAccessAdminStoreScope(params.authorization.storeScope, params.storeId)
  ) {
    return {
      authorized: true,
    };
  }

  logStoreScopeDenied(params);

  return {
    authorized: false,
    response: createAdminAuthorizationErrorResponse(403),
  };
}

// AIDEV-CRITICAL: autorização administrativa de API deve negar por padrão e
// reaproveitar o mesmo contrato 401/403 para evitar divergência entre rotas.
export async function authorizeAdminApiRequest(params: {
  action?: AdminRbacAction;
  logger: StructuredLogger;
  request: NextRequest;
  resource: AdminRbacResource;
}): Promise<AdminApiAuthorizationResult> {
  const action =
    params.action ?? resolveAdminActionFromMethod(params.request.method);

  if (!action) {
    logAuthorizationDenied({
      action: null,
      logger: params.logger,
      reason: "unsupported_method",
      resource: params.resource,
      status: 403,
    });

    return {
      authorized: false,
      response: createAdminAuthorizationErrorResponse(403),
    };
  }

  const access = await requireAdminAccess();

  if (!access.authorized) {
    logAuthorizationDenied({
      action,
      logger: params.logger,
      reason: access.status === 401 ? "auth_required" : "invalid_role",
      resource: params.resource,
      status: access.status,
    });

    return {
      authorized: false,
      response: createAdminAuthorizationErrorResponse(access.status),
    };
  }

  const normalizedRole = normalizeAdminRbacRole(access.user.role);
  const scopedLogger = params.logger.child({
    adminAction: action,
    adminResource: params.resource,
    adminRole: normalizedRole,
    securityDomain: "admin_rbac",
    userId: access.user.id,
  });

  if (
    !normalizedRole ||
    !isAdminApiAccessAllowed({
      action,
      resource: params.resource,
      role: normalizedRole,
    })
  ) {
    logAuthorizationDenied({
      action,
      logger: params.logger,
      reason: "rbac_denied",
      resource: params.resource,
      role: normalizedRole,
      status: 403,
      userId: access.user.id,
    });

    return {
      authorized: false,
      response: createAdminAuthorizationErrorResponse(403),
    };
  }

  return {
    authorized: true,
    action,
    logger: scopedLogger,
    role: normalizedRole,
    storeScope: access.user.adminStoreScope,
    user: access.user,
  };
}
