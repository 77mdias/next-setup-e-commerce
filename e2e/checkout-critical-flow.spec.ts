import { expect, test } from "@playwright/test";

const E2E_USER_EMAIL =
  process.env.E2E_USER_EMAIL ?? "e2e.customer@nextstore.local";
const E2E_USER_PASSWORD =
  process.env.E2E_USER_PASSWORD ?? "E2eCheckout#123";

async function signIn(page: Parameters<typeof test>[0]["page"]) {
  await page.goto("/auth/signin?callbackUrl=/products");

  await page.getByLabel("Email").fill(E2E_USER_EMAIL);
  await page.getByLabel("Password").fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: /Initialize Session/i }).click();

  await page.waitForURL(/\/products/);
  await expect(page.getByRole("heading", { name: /All Products/i })).toBeVisible();
}

async function clearCart(page: Parameters<typeof test>[0]["page"]) {
  await page.request.delete("/api/cart");
}

async function addProductToCart(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: /View Product/i }).first().click();
  await page.waitForURL(/\/product\/.+/);

  await page.getByRole("button", { name: /Add to Cart/i }).click();
  await page.waitForURL(/\/carrinho/);
  await expect(
    page.getByRole("button", { name: /Proceed to Checkout/i }),
  ).toBeVisible();
}

async function proceedToCheckout(page: Parameters<typeof test>[0]["page"]) {
  await page.getByRole("button", { name: /Proceed to Checkout/i }).click();
  await page.waitForURL(/\/checkout/);
  await expect(
    page.getByRole("heading", { name: /Finalizar Compra/i }),
  ).toBeVisible();
}

async function completeCheckout(
  page: Parameters<typeof test>[0]["page"],
  outcome: "success" | "failed",
) {
  if (outcome === "failed") {
    await page.route("**/api/checkout", async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          "x-e2e-checkout-outcome": "failed",
        },
      });
    });
  }

  const submitButton = page.getByRole("button", { name: /Finalizar Compra/i });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  const targetUrlPattern =
    outcome === "failed"
      ? /\/orders\?orderId=\d+&checkout=failed/
      : /\/orders\?orderId=\d+$/;

  await page.waitForURL(targetUrlPattern, { timeout: 30_000 });

  if (outcome === "failed") {
    await page.unroute("**/api/checkout");
  }

  const url = new URL(page.url());
  const orderId = url.searchParams.get("orderId");
  expect(orderId).toBeTruthy();

  return {
    orderId: orderId as string,
    checkoutFailed: url.searchParams.get("checkout") === "failed",
  };
}

test.describe("checkout critical flow", () => {
  test("@critical completes purchase journey and exposes order status after return", async ({
    page,
  }) => {
    await signIn(page);
    await clearCart(page);
    await addProductToCart(page);
    await proceedToCheckout(page);

    const { orderId, checkoutFailed } = await completeCheckout(page, "success");
    expect(checkoutFailed).toBe(false);

    await expect(page.getByRole("heading", { name: /My Orders/i })).toBeVisible();
    await expect(page.getByText(`ORD-${orderId.padStart(5, "0")}`)).toBeVisible();
    await expect(page.getByText("Payment approved")).toBeVisible();
  });

  test("@critical executes failed-payment fallback and keeps cancellation context visible", async ({
    page,
  }) => {
    await signIn(page);
    await clearCart(page);
    await addProductToCart(page);
    await proceedToCheckout(page);

    const { orderId, checkoutFailed } = await completeCheckout(page, "failed");
    expect(checkoutFailed).toBe(true);

    await expect(page.getByRole("heading", { name: /My Orders/i })).toBeVisible();
    await expect(page.getByText(`ORD-${orderId.padStart(5, "0")}`)).toBeVisible();
    await expect(page.getByText(/Cancellation reason:/i)).toBeVisible();
  });
});
