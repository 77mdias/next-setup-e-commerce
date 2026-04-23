import { describe, expect, it, vi } from "vitest";

import {
  isAdminApiAccessAllowed,
  resolveAdminActionFromMethod,
  type AdminRbacAction,
  type AdminRbacResource,
} from "@/lib/rbac";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock("@/lib/admin-store-scope", () => ({
  normalizeScopedAdminRole: vi.fn((role: unknown) => {
    if (typeof role !== "string") return null;
    const normalized = role.trim().toUpperCase();
    if (normalized === "ADMIN" || normalized === "SUPER_ADMIN" || normalized === "STORE_ADMIN") {
      return normalized;
    }
    return null;
  }),
  getAdminStoreScopeStoreIds: vi.fn(() => null),
  canAccessAdminStoreScope: vi.fn(() => false),
}));

// ---------------------------------------------------------------------------
// resolveAdminActionFromMethod
// ---------------------------------------------------------------------------

describe("resolveAdminActionFromMethod", () => {
  it("returns 'read' for GET", () => {
    expect(resolveAdminActionFromMethod("GET")).toBe("read");
  });

  it("returns 'create' for POST", () => {
    expect(resolveAdminActionFromMethod("POST")).toBe("create");
  });

  it("returns 'update' for PATCH", () => {
    expect(resolveAdminActionFromMethod("PATCH")).toBe("update");
  });

  it("returns 'update' for PUT", () => {
    expect(resolveAdminActionFromMethod("PUT")).toBe("update");
  });

  it("returns 'delete' for DELETE", () => {
    expect(resolveAdminActionFromMethod("DELETE")).toBe("delete");
  });

  it("returns null for unsupported methods", () => {
    expect(resolveAdminActionFromMethod("OPTIONS")).toBeNull();
    expect(resolveAdminActionFromMethod("HEAD")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(resolveAdminActionFromMethod("get")).toBe("read");
    expect(resolveAdminActionFromMethod("post")).toBe("create");
  });
});

// ---------------------------------------------------------------------------
// isAdminApiAccessAllowed
// ---------------------------------------------------------------------------

describe("isAdminApiAccessAllowed", () => {
  describe("with valid roles", () => {
    it("allows STORE_ADMIN to read orders", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: "STORE_ADMIN",
        }),
      ).toBe(true);
    });

    it("allows STORE_ADMIN to read catalog", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "catalog",
          role: "STORE_ADMIN",
        }),
      ).toBe(true);
    });

    it("allows STORE_ADMIN to read customers", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "customers",
          role: "STORE_ADMIN",
        }),
      ).toBe(true);
    });

    it("allows ADMIN to create orders", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "create",
          resource: "orders",
          role: "ADMIN",
        }),
      ).toBe(true);
    });

    it("allows ADMIN to delete catalog items", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "delete",
          resource: "catalog",
          role: "ADMIN",
        }),
      ).toBe(true);
    });

    it("allows SUPER_ADMIN to delete orders", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "delete",
          resource: "orders",
          role: "SUPER_ADMIN",
        }),
      ).toBe(true);
    });

    it("allows SUPER_ADMIN to delete catalog items", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "delete",
          resource: "catalog",
          role: "SUPER_ADMIN",
        }),
      ).toBe(true);
    });
  });

  describe("permission boundaries", () => {
    it("denies STORE_ADMIN from creating orders (ADMIN or SUPER_ADMIN only)", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "create",
          resource: "orders",
          role: "STORE_ADMIN",
        }),
      ).toBe(false);
    });

    it("denies STORE_ADMIN from deleting orders (SUPER_ADMIN only)", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "delete",
          resource: "orders",
          role: "STORE_ADMIN",
        }),
      ).toBe(false);
    });

    it("allows ADMIN to delete catalog items (ADMIN is in allowed list)", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "delete",
          resource: "catalog",
          role: "ADMIN",
        }),
      ).toBe(true);
    });

    it("denies STORE_ADMIN from creating catalog items (needs STORE_ADMIN)", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "create",
          resource: "catalog",
          role: "STORE_ADMIN",
        }),
      ).toBe(true); // STORE_ADMIN is allowed to create in catalog
    });
  });

  describe("edge cases: unknown or invalid roles", () => {
    it("returns false for unknown role string", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: "VIEWER",
        }),
      ).toBe(false);
    });

    it("returns false for empty string role", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: "",
        }),
      ).toBe(false);
    });

    it("returns false for null role", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: null,
        }),
      ).toBe(false);
    });

    it("returns false for undefined role", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: undefined,
        }),
      ).toBe(false);
    });

    it("returns false for numeric role", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: 123,
        }),
      ).toBe(false);
    });

    it("returns false for object role", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: { role: "ADMIN" },
        }),
      ).toBe(false);
    });

    it("handles role with extra whitespace", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: "  ADMIN  ",
        }),
      ).toBe(true);
    });

    it("handles lowercase role variant", () => {
      expect(
        isAdminApiAccessAllowed({
          action: "read",
          resource: "orders",
          role: "admin",
        }),
      ).toBe(true);
    });
  });

  describe("all resources have read permission for all admin roles", () => {
    const readResources: AdminRbacResource[] = [
      "audit",
      "dashboard",
      "orders",
      "catalog",
      "customers",
    ];

    const adminRoles = ["STORE_ADMIN", "ADMIN", "SUPER_ADMIN"];

    for (const resource of readResources) {
      for (const role of adminRoles) {
        it(`allows ${role} to read ${resource}`, () => {
          expect(
            isAdminApiAccessAllowed({
              action: "read",
              resource,
              role,
            }),
          ).toBe(true);
        });
      }
    }
  });
});