import { describe, expect, it } from "vitest";

import { isAdminRole } from "@/lib/admin-role";

describe("admin-role helpers", () => {
  it("accepts supported admin roles", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("STORE_ADMIN")).toBe(true);
    expect(isAdminRole("super_admin")).toBe(true);
  });

  it("rejects unknown or empty roles", () => {
    expect(isAdminRole("CUSTOMER")).toBe(false);
    expect(isAdminRole("")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});
