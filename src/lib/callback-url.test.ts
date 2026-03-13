import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_CALLBACK_PATH,
  normalizeAdminCallbackPath,
  normalizeCallbackPath,
} from "@/lib/callback-url";

describe("callback-url helpers", () => {
  it("keeps safe relative callbacks", () => {
    expect(normalizeCallbackPath("/checkout")).toBe("/checkout");
  });

  it("normalizes admin callback for nested admin paths", () => {
    expect(normalizeAdminCallbackPath("/admin/remove-bg?page=2")).toBe(
      "/admin/remove-bg?page=2",
    );
  });

  it("accepts absolute URL only when normalized path remains in admin scope", () => {
    expect(
      normalizeAdminCallbackPath("https://example.com/admin/orders?tab=open"),
    ).toBe("/admin/orders?tab=open");
  });

  it("falls back to /admin for non-admin callback targets", () => {
    expect(normalizeAdminCallbackPath("/checkout")).toBe(
      DEFAULT_ADMIN_CALLBACK_PATH,
    );
    expect(normalizeAdminCallbackPath("https://example.com/products")).toBe(
      DEFAULT_ADMIN_CALLBACK_PATH,
    );
  });
});
