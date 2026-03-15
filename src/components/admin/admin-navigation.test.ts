import { describe, expect, it } from "vitest";

import {
  ADMIN_NAV_ITEMS,
  getAdminBreadcrumbs,
  getAdminRouteMeta,
  isAdminNavigationItemActive,
} from "@/components/admin/admin-navigation";
import { ROUTE_PATHS } from "@/lib/routes";

describe("admin navigation helpers", () => {
  it("keeps the expected shell links available", () => {
    expect(ADMIN_NAV_ITEMS.map((item) => item.href)).toEqual([
      ROUTE_PATHS.admin,
      ROUTE_PATHS.adminOrders,
      ROUTE_PATHS.adminCatalog,
      ROUTE_PATHS.adminCustomers,
      ROUTE_PATHS.adminAudit,
    ]);
  });

  it("detects active route for nested admin modules", () => {
    expect(
      isAdminNavigationItemActive(ROUTE_PATHS.adminOrders, "/admin/orders/123"),
    ).toBe(true);
    expect(
      isAdminNavigationItemActive(ROUTE_PATHS.admin, "/admin/orders"),
    ).toBe(false);
  });

  it("returns dashboard metadata as fallback for unknown admin paths", () => {
    expect(getAdminRouteMeta("/admin/unknown").href).toBe(ROUTE_PATHS.admin);
  });

  it("builds breadcrumbs for nested modules", () => {
    expect(getAdminBreadcrumbs("/admin/customers")).toEqual([
      { href: ROUTE_PATHS.admin, label: "Dashboard" },
      { href: ROUTE_PATHS.adminCustomers, label: "Clientes" },
    ]);
  });
});
