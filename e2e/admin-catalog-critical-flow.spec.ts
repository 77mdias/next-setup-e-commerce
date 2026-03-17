import { expect, test, type Page } from "@playwright/test";

const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "e2e.admin@nextstore.local";
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "E2eAdmin#123";
const E2E_ADMIN_PRODUCT_NAME =
  process.env.E2E_ADMIN_PRODUCT_NAME ?? "E2E Checkout Headset";

async function signInAsAdmin(page: Page) {
  await page.goto("/auth/signin?callbackUrl=/admin/catalog");

  await page.getByRole("textbox", { name: /^Email$/ }).fill(E2E_ADMIN_EMAIL);
  await page
    .getByRole("textbox", { name: /^Password$/ })
    .fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Initialize Session/i }).click();

  await page.waitForURL(/\/admin\/catalog/);
}

test.describe("admin catalog critical flow", () => {
  test("@critical signs in with deterministic admin fixture and opens catalog module", async ({
    page,
  }) => {
    await signInAsAdmin(page);

    await expect(
      page.getByRole("heading", {
        name: /Catálogo admin com mídia segura e ajuste de estoque/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Produtos por loja/i }),
    ).toBeVisible();
    await expect(page.getByText(E2E_ADMIN_PRODUCT_NAME)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /CRUD administrativo/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Ajuste com trilha/i }),
    ).toBeVisible();
  });
});
