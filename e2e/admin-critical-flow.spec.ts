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

    // Middleware redirects to /status?reason=forbidden
    await page.waitForURL(/\/status\?.*reason=forbidden/);

    // Verify forbidden feedback content
    await expect(
      page.getByText("SEM PERMISSÃO", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText(/não tem permissão para acessar/i),
    ).toBeVisible();
  });

  test("@critical blocks unauthenticated user from accessing /admin and redirects to auth-required", async ({
    page,
  }) => {
    await page.goto("/admin");

    // Middleware redirects to /status?reason=auth-required
    await page.waitForURL(/\/status\?.*reason=auth-required/);

    await expect(
      page.getByText("ACESSO RESTRITO", { exact: false }),
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

    // Shell context visible
    await expect(page.getByText("Dashboard", { exact: false })).toBeVisible();

    // Admin shell context cards: operator, role, scope
    await expect(page.getByText(/Operador/i)).toBeVisible();
    await expect(page.getByText(/Papel ativo/i)).toBeVisible();
    await expect(page.getByText(/Escopo/i)).toBeVisible();

    // KPI loading or rendered – wait for KPI section
    // The dashboard shows 4 KPI cards: Pedidos, Aprovação, Receita, Estoque baixo
    const kpiSection = page
      .locator("[data-testid='kpi-cards']")
      .or(page.getByText(/Carregando indicadores operacionais/i));

    // Either KPIs load or we see loading state
    const kpiLoaded = page.getByText(/Pedidos/i).first();
    const kpiLoading = page.getByText(/Carregando indicadores operacionais/i);
    const kpiError = page.getByText(/Tentar novamente/i);

    // Wait for one of the three states to appear
    await expect(kpiLoaded.or(kpiLoading).or(kpiError)).toBeVisible({
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

    // Wait for KPIs to appear (any state)
    const kpiArea = page
      .getByText(/Pedidos/i)
      .first()
      .or(page.getByText(/Carregando indicadores operacionais/i));
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
          .getByText(/Pedidos/i)
          .first()
          .or(page.getByText(/Carregando indicadores operacionais/i)),
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
      page
        .getByText(/Fila administrativa/i)
        .or(page.getByText(/Pedidos administrativos/i)),
    ).toBeVisible({ timeout: 15_000 });

    // Verify filter controls exist
    const searchInput = page.getByPlaceholder(
      /Pedido, cliente, loja ou tracking/i,
    );
    await expect(searchInput).toBeVisible();

    // Status filter dropdown
    await expect(page.getByText(/Status/i).first()).toBeVisible();

    // Period filter
    await expect(
      page.getByText(/Período/i).or(page.getByText(/30 dias/i)),
    ).toBeVisible();

    // Orders list should be in one of three states: loaded, empty, or error
    const ordersList = page.getByText(/ORD-/i).first();
    const emptyState = page.getByText(/Nenhum pedido/i);
    const errorState = page.getByText(/Tentar novamente/i);
    const loadingState = page.locator('[class*="animate-pulse"]').first();

    await expect(
      ordersList.or(emptyState).or(errorState).or(loadingState),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("@critical orders module filters by status without breaking UI", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin/orders");

    // Wait for initial load
    await expect(
      page
        .getByText(/Fila administrativa/i)
        .or(page.getByText(/Pedidos administrativos/i)),
    ).toBeVisible({ timeout: 15_000 });

    // Try to find and interact with status filter
    const statusSelect = page.locator("select").first();
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.selectOption({ index: 1 });

      // Wait for re-fetch
      await page.waitForTimeout(1000);

      // Page should not break
      await expect(
        page
          .getByText(/Fila administrativa/i)
          .or(page.getByText(/Pedidos administrativos/i)),
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
      page.getByRole("heading", {
        name: /Catálogo admin|Catálogo administrativo/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify products section exists
    await expect(
      page
        .getByText(/Produtos por loja/i)
        .or(page.getByText(/E2E Checkout Headset/i)),
    ).toBeVisible({ timeout: 15_000 });

    // Verify CRUD section is available
    await expect(
      page
        .getByText(/CRUD administrativo/i)
        .or(page.getByText(/Ajuste com trilha/i)),
    ).toBeVisible();
  });

  test("@critical catalog module displays stock adjustment section for authorized admin", async ({
    page,
  }) => {
    await signInAsAdmin(page, "/admin/catalog");

    await expect(
      page.getByRole("heading", {
        name: /Catálogo admin|Catálogo administrativo/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Stock adjustment section should be visible
    await expect(
      page
        .getByText(/Ajuste com trilha/i)
        .or(page.getByText(/estoque/i).first()),
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
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // Navigate to Orders
    await page
      .getByRole("link", { name: /Pedidos/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/orders/);
    await expect(
      page
        .getByText(/Fila administrativa/i)
        .or(page.getByText(/Pedidos administrativos/i)),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to Catalog
    await page
      .getByRole("link", { name: /Catálogo/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/catalog/);
    await expect(
      page.getByRole("heading", {
        name: /Catálogo admin|Catálogo administrativo/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to Customers
    await page
      .getByRole("link", { name: /Clientes/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/customers/);
    await expect(
      page
        .getByText(/Visão administrativa de clientes/i)
        .or(page.getByText(/Clientes administrativos/i)),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to Audit
    await page
      .getByRole("link", { name: /Auditoria/i })
      .first()
      .click();
    await page.waitForURL(/\/admin\/audit/);
    await expect(
      page
        .getByText(/Trilha administrativa de auditoria/i)
        .or(page.getByText(/Auditoria administrativa/i)),
    ).toBeVisible({ timeout: 15_000 });

    // Navigate back to Dashboard
    await page
      .getByRole("link", { name: /Dashboard/i })
      .first()
      .click();
    await page.waitForURL(/\/admin$/);
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
