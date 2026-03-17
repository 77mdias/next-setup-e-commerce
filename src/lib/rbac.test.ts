import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminAccess } = vi.hoisted(() => ({
  mockRequireAdminAccess: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
  ADMIN_API_FORBIDDEN_CODE,
  ADMIN_API_FORBIDDEN_ERROR,
  ADMIN_API_UNAUTHORIZED_CODE,
  ADMIN_API_UNAUTHORIZED_ERROR,
  getAuthorizedAdminStoreIds,
  isAdminApiAccessAllowed,
  resolveAdminActionFromMethod,
} from "@/lib/rbac";

function createRequest(method: string) {
  return new NextRequest(`http://localhost:3000/api/admin/test`, {
    method,
  });
}

function createMockLogger() {
  const childLogger = {
    child: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  childLogger.child.mockReturnValue(childLogger);

  const logger = {
    child: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  logger.child.mockReturnValue(childLogger);

  return {
    childLogger,
    logger,
  };
}

describe("rbac", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolve action from HTTP method with deny-by-default fallback", () => {
    expect(resolveAdminActionFromMethod("GET")).toBe("read");
    expect(resolveAdminActionFromMethod("POST")).toBe("create");
    expect(resolveAdminActionFromMethod("PATCH")).toBe("update");
    expect(resolveAdminActionFromMethod("DELETE")).toBe("delete");
    expect(resolveAdminActionFromMethod("OPTIONS")).toBeNull();
  });

  it("applies RBAC policy by resource and action", () => {
    expect(
      isAdminApiAccessAllowed({
        action: "read",
        resource: "customers",
        role: "STORE_ADMIN",
      }),
    ).toBe(true);
    expect(
      isAdminApiAccessAllowed({
        action: "read",
        resource: "audit",
        role: "ADMIN",
      }),
    ).toBe(true);
    expect(
      isAdminApiAccessAllowed({
        action: "delete",
        resource: "catalog",
        role: "STORE_ADMIN",
      }),
    ).toBe(false);
  });

  it("returns uniform 401 contract when session is missing", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: false,
      status: 401,
    });
    const { childLogger, logger } = createMockLogger();

    const result = await authorizeAdminApiRequest({
      logger,
      request: createRequest("GET"),
      resource: "dashboard",
    });

    expect(result.authorized).toBe(false);
    if (result.authorized) {
      throw new Error("Expected denied result");
    }

    const body = await result.response.json();

    expect(result.response.status).toBe(401);
    expect(body).toEqual({
      code: ADMIN_API_UNAUTHORIZED_CODE,
      error: ADMIN_API_UNAUTHORIZED_ERROR,
    });
    expect(logger.child).toHaveBeenCalledWith(
      expect.objectContaining({
        adminAction: "read",
        adminResource: "dashboard",
        securityDomain: "admin_rbac",
      }),
    );
    expect(childLogger.warn).toHaveBeenCalledWith(
      "admin.authorization.denied",
      expect.objectContaining({
        data: expect.objectContaining({
          reason: "auth_required",
          status: 401,
        }),
      }),
    );
  });

  it("returns uniform 403 contract when RBAC blocks the action", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        adminStoreScope: {
          kind: "stores",
          storeIds: ["store-1"],
        },
        id: "store-admin-1",
        role: "STORE_ADMIN",
      },
    });
    const { childLogger, logger } = createMockLogger();

    const result = await authorizeAdminApiRequest({
      action: "delete",
      logger,
      request: createRequest("DELETE"),
      resource: "catalog",
    });

    expect(result.authorized).toBe(false);
    if (result.authorized) {
      throw new Error("Expected denied result");
    }

    const body = await result.response.json();

    expect(result.response.status).toBe(403);
    expect(body).toEqual({
      code: ADMIN_API_FORBIDDEN_CODE,
      error: ADMIN_API_FORBIDDEN_ERROR,
    });
    expect(childLogger.warn).toHaveBeenCalledWith(
      "admin.authorization.denied",
      expect.objectContaining({
        data: expect.objectContaining({
          reason: "rbac_denied",
          status: 403,
        }),
      }),
    );
  });

  it("returns scoped logger and role when access is allowed", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        adminStoreScope: {
          kind: "global",
        },
        id: "admin-1",
        role: "ADMIN",
      },
    });
    const { childLogger, logger } = createMockLogger();

    const result = await authorizeAdminApiRequest({
      action: "update",
      logger,
      request: createRequest("PUT"),
      resource: "catalog",
    });

    expect(result.authorized).toBe(true);
    if (!result.authorized) {
      throw new Error("Expected granted result");
    }

    expect(result.role).toBe("ADMIN");
    expect(result.storeScope).toEqual({
      kind: "global",
    });
    expect(result.user).toEqual({
      adminStoreScope: {
        kind: "global",
      },
      id: "admin-1",
      role: "ADMIN",
    });
    expect(result.logger).toBe(childLogger);
    expect(logger.child).toHaveBeenCalledWith(
      expect.objectContaining({
        adminAction: "update",
        adminResource: "catalog",
        adminRole: "ADMIN",
        securityDomain: "admin_rbac",
        userId: "admin-1",
      }),
    );
  });

  it("blocks cross-store resource access for scoped admins", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        adminStoreScope: {
          kind: "stores",
          storeIds: ["store-1"],
        },
        id: "store-admin-1",
        role: "STORE_ADMIN",
      },
    });
    const { childLogger, logger } = createMockLogger();

    const authorization = await authorizeAdminApiRequest({
      action: "update",
      logger,
      request: createRequest("PUT"),
      resource: "catalog",
    });

    expect(authorization.authorized).toBe(true);
    if (!authorization.authorized) {
      throw new Error("Expected granted result");
    }

    const scopedStoreIds = getAuthorizedAdminStoreIds(authorization);
    const storeAccess = authorizeAdminStoreScopeAccess({
      authorization,
      resource: "catalog",
      resourceId: "product-1",
      storeId: "store-2",
    });

    expect(scopedStoreIds).toEqual(["store-1"]);
    expect(storeAccess.authorized).toBe(false);
    if (storeAccess.authorized) {
      throw new Error("Expected store scope denial");
    }

    expect(storeAccess.response.status).toBe(403);
    expect(childLogger.warn).toHaveBeenCalledWith(
      "admin.store_scope.denied",
      expect.objectContaining({
        context: expect.objectContaining({
          resourceId: "product-1",
          scopedStoreIds: ["store-1"],
          securityDomain: "admin_store_scope",
          storeId: "store-2",
        }),
        data: expect.objectContaining({
          reason: "cross_store_access",
          resource: "catalog",
        }),
      }),
    );
  });
});
