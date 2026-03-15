import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    store: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import {
  canAccessAdminStoreScope,
  getAdminStoreScopeStoreIds,
  normalizeScopedAdminRole,
  resolveAdminStoreScopeForUser,
} from "@/lib/admin-store-scope";

describe("admin-store-scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes supported admin roles", () => {
    expect(normalizeScopedAdminRole("admin")).toBe("ADMIN");
    expect(normalizeScopedAdminRole("SUPER_ADMIN")).toBe("SUPER_ADMIN");
    expect(normalizeScopedAdminRole(" store_admin ")).toBe("STORE_ADMIN");
    expect(normalizeScopedAdminRole("CUSTOMER")).toBeNull();
  });

  it("returns global scope for non-store admin roles", async () => {
    const scope = await resolveAdminStoreScopeForUser({
      role: "ADMIN",
      userId: "admin-1",
    });

    expect(scope).toEqual({
      kind: "global",
    });
    expect(mockDb.store.findMany).not.toHaveBeenCalled();
  });

  it("loads owned stores for store admin scope", async () => {
    mockDb.store.findMany.mockResolvedValue([
      { id: "store-1" },
      { id: "store-2" },
    ]);

    const scope = await resolveAdminStoreScopeForUser({
      role: "STORE_ADMIN",
      userId: "store-admin-1",
    });

    expect(scope).toEqual({
      kind: "stores",
      storeIds: ["store-1", "store-2"],
    });
    expect(mockDb.store.findMany).toHaveBeenCalledWith({
      where: {
        ownerId: "store-admin-1",
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  });

  it("evaluates store access against scoped ids", () => {
    const scope = {
      kind: "stores" as const,
      storeIds: ["store-1"],
    };

    expect(getAdminStoreScopeStoreIds(scope)).toEqual(["store-1"]);
    expect(canAccessAdminStoreScope(scope, "store-1")).toBe(true);
    expect(canAccessAdminStoreScope(scope, " store-1 ")).toBe(true);
    expect(canAccessAdminStoreScope(scope, "store-2")).toBe(false);
    expect(canAccessAdminStoreScope(scope, null)).toBe(false);
  });
});
