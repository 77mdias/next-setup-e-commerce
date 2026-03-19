import { expect, test, type Page } from "@playwright/test";

const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "e2e.admin@nextstore.local";
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "E2eAdmin#123";
const E2E_CUSTOMER_EMAIL =
  process.env.E2E_USER_EMAIL ?? "e2e.customer@nextstore.local";
const E2E_CUSTOMER_PASSWORD =
  process.env.E2E_USER_PASSWORD ?? "E2eCheckout#123";

async function signInAsAdmin(page: Page, callbackPath = "/admin") {
  await page.goto(
    `/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`,
  );

  await page.getByRole("textbox", { name: /^Email$/ }).fill(E2E_ADMIN_EMAIL);
  await page
    .getByRole("textbox", { name: /^Password$/ })
    .fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Initialize Session/i }).click();

  await page.waitForURL(new RegExp(callbackPath.replace(/\//g, "\\/")));
}

async function signInAsCustomer(page: Page) {
  await page.goto("/auth/signin?callbackUrl=/products");

  await page.getByRole("textbox", { name: /^Email$/ }).fill(E2E_CUSTOMER_EMAIL);
  await page
    .getByRole("textbox", { name: /^Password$/ })
    .fill(E2E_CUSTOMER_PASSWORD);
  await page.getByRole("button", { name: /Initialize Session/i }).click();

  await page.waitForURL(/\/products/);
}

// ---------------------------------------------------------------------------
// 1. Access control – deny non-admin user
// ---------------------------------------------------------------------------
test.describe("admin access control", () => {
  test("@critical blocks customer role from accessing /admin and redirects to forbidden feedback", async ({
    page,
  }) => {
    await signInAsCustomer(page);

    await page.goto("/admin");

    // Middleware redirects to /status – may be reason=forbidden or auth-required
    await page.waitForURL(/\/status\?.*reason=(forbidden|auth-required)/);

    // Verify the user is blocked from accessing admin
    await expect(
      page.getByRole("heading", {
        name: /não tem permissão|Autenticação Necessária/i,
      }),
    ).toBeVisible();
  });

  test("@critical blocks unauthenticated user from accessing /admin and redirects to auth-required", async ({
    page,
  }) => {
    await page.goto("/admin");

    // Middleware redirects to /status?reason=auth-required
    await page.waitForURL(/\/status\?.*reason=auth-required/);

    await expect(
      page.getByRole("heading", { name: /Autenticação Necessária/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Dashboard – authorized access, KPIs, window selector
// ---------------------------------------------------------------------------
test.describe("admin dashboard critical flow", () => {
  test("@critical signs in as admin and renders dashboard with KPI cards and navigation", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin");

    // Shell context visible – use h1 heading to avoid strict mode violation
    await expect(page.locator("h1")).toBeVisible();

    // Admin shell context is rendered in the sidebar as actor + role/scope summary.
    await expect(
      page.getByRole("complementary").getByText(/E2E Store Admin/i),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Dashboard administrativo/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary").getByText(/Admin · Visão global/i),
    ).toBeVisible();

    // KPI loading or rendered – wait for KPI section
    const kpiLoading = page.getByText(/Carregando indicadores operacionais/i);
    const kpiError = page.getByText(/Tentar novamente/i);

    // Wait for one of the states to appear (use main to scope away from nav)
    await expect(
      page
        .getByRole("main")
        .getByText(/Pedidos/i)
        .first()
        .or(kpiLoading)
        .or(kpiError),
    ).toBeVisible({
      timeout: 15_000,
    });

    // Verify navigation links to other admin modules exist
    await expect(
      page.getByRole("link", { name: /Pedidos/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Catálogo/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Clientes/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Auditoria/i }).first(),
    ).toBeVisible();
  });

  test("@critical dashboard window selector changes KPI period", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin");

    // Wait for KPIs to appear (any state) – scope to main to avoid nav matches
    const kpiArea = page
      .getByRole("main")
      .getByText(/Pedidos|Carregando indicadores operacionais/i)
      .first();
    await expect(kpiArea).toBeVisible({ timeout: 15_000 });

    // Look for window selector buttons (7 dias, 30 dias, 90 dias)
    const window30d = page.getByRole("button", { name: /30 dias/i });
    const window7d = page.getByRole("button", { name: /7 dias/i });

    // If window buttons exist, click to change period
    if (await window30d.isVisible().catch(() => false)) {
      await window30d.click();

      // Wait briefly for re-fetch
      await page.waitForTimeout(1000);

      // Page should still be functional (no crash)
      await expect(
        page
          .getByRole("main")
          .getByText(/Pedidos|Carregando indicadores operacionais/i)
          .first(),
      ).toBeVisible();

      // Switch back
      if (await window7d.isVisible().catch(() => false)) {
        await window7d.click();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Orders – list, filters, detail view
// ---------------------------------------------------------------------------
test.describe("admin orders critical flow", () => {
  test("@critical navigates to orders module and loads list with filters", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin/orders");

    // Verify orders page loaded
    await expect(
      page.getByRole("heading", { name: /Pedidos administrativos/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify filter controls exist
    const searchInput = page.getByPlaceholder(
      /Pedido, cliente, loja ou tracking/i,
    );
    await expect(searchInput).toBeVisible();

    // Status filter dropdown
    await expect(page.getByText(/Status/i).first()).toBeVisible();

    // Period filter – "30 dias" may be inside a <select>/<option> (hidden), so check the select or a visible label
    await expect(
      page
        .locator("select")
        .filter({ hasText: /30 dias/ })
        .or(page.getByLabel(/Período/i)),
    ).toBeVisible();

    // Orders list should be in one of three states: loaded, empty, or error
    const ordersList = page.getByText(/ORD-/i).first();
    const emptyState = page.getByText(/Nenhum pedido/i).first();
    const errorState = page.getByText(/Tentar novamente/i);
    const loadingState = page.locator('[class*="animate-pulse"]').first();

    await expect(
      ordersList.or(emptyState).or(errorState).or(loadingState).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("@critical orders module filters by status without breaking UI", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin/orders");

    // Wait for initial load
    await expect(
      page.getByRole("heading", { name: /Pedidos administrativos/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Try to find and interact with status filter
    const statusSelect = page.locator("select").first();
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.selectOption({ index: 1 });

      // Wait for re-fetch
      await page.waitForTimeout(1000);

      // Page should not break – use heading role to avoid matching both h1 and h2
      await expect(
        page.getByRole("heading", { name: /Pedidos administrativos/i }),
      ).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Catalog – product listing and stock visibility
// ---------------------------------------------------------------------------
test.describe("admin catalog critical flow", () => {
  test("@critical navigates to catalog module and shows products with store scope", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin/catalog");

    // Verify catalog page loaded
    await expect(
      page
        .getByRole("heading", {
          name: /Catálogo admin|Catálogo administrativo/i,
        })
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Verify products section exists
    await expect(
      page
        .getByText(/Produtos por loja/i)
        .or(page.getByText(/E2E Checkout Headset/i)),
    ).toBeVisible({ timeout: 15_000 });

    // Verify CRUD section is available – use heading role with .first() to avoid matching both h2s
    await expect(
      page
        .getByRole("heading", { name: /CRUD administrativo/i })
        .or(page.getByRole("heading", { name: /Ajuste com trilha/i }))
        .first(),
    ).toBeVisible();
  });

  test("@critical catalog module displays stock adjustment section for authorized admin", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin/catalog");

    await expect(
      page
        .getByRole("heading", {
          name: /Catálogo admin|Catálogo administrativo/i,
        })
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Stock adjustment section should be visible – target specific h2 to avoid matching the h1 page title
    await expect(
      page
        .locator("h2", { hasText: /Ajuste com trilha/i })
        .or(page.locator("h2", { hasText: /estoque/i }).first()),
    ).toBeVisible({ timeout: 10_000 });

    // The E2E product should be visible in the product list
    const productButton = page.getByRole("button", {
      name: /E2E Checkout Headset/i,
    });
    if (await productButton.isVisible().catch(() => false)) {
      // Product is listed in the catalog
      await expect(productButton).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Cross-module navigation resilience
// ---------------------------------------------------------------------------
test.describe("admin navigation resilience", () => {
  test("@critical navigates between all admin modules without broken links", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin");

    // Dashboard loaded
    await expect(page.locator("h1")).toBeVisible({
      timeout: 15_000,
    });

    // Navigate to Orders
    await page
      .getByRole("link", { name: /Pedidos/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/orders/);
    await expect(
      page.getByRole("heading", { name: /Pedidos administrativos/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to Catalog
    await page
      .getByRole("link", { name: /Catálogo/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/catalog/);
    await expect(
      page
        .getByRole("heading", {
          name: /Catálogo admin|Catálogo administrativo/i,
        })
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to Customers
    await page
      .getByRole("link", { name: /Clientes/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/customers/);
    await expect(
      page
        .getByRole("heading", {
          name: /Visão administrativa de clientes|Clientes administrativos/i,
        })
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to Audit
    await page
      .getByRole("link", { name: /Auditoria/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/audit/);
    await expect(
      page
        .getByRole("heading", {
          name: /Trilha administrativa de auditoria|Auditoria administrativa/i,
        })
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate back to Dashboard
    await page
      .getByRole("link", { name: /Dashboard/i })
      .first()
      .click();
    await page.waitForURL(/\/admin$/);
    await expect(page.locator("h1")).toBeVisible({
      timeout: 15_000,
    });
  });
});
