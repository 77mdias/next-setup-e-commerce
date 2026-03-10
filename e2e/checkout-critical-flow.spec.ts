import { expect, test } from "@playwright/test";

const E2E_USER_EMAIL =
  process.env.E2E_USER_EMAIL ?? "e2e.customer@nextstore.local";
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? "E2eCheckout#123";
const E2E_PRODUCT_QUERY =
  process.env.E2E_PRODUCT_QUERY ?? "E2E Checkout Headset";

async function signIn(page: any) {
  await page.goto("/auth/signin?callbackUrl=/products");

  await page.getByRole("textbox", { name: /^Email$/ }).fill(E2E_USER_EMAIL);
  await page
    .getByRole("textbox", { name: /^Password$/ })
    .fill(E2E_USER_PASSWORD);
  await page.getByRole("button", { name: /Initialize Session/i }).click();

  await page.waitForURL(/\/products/);
  await expect(
    page.getByRole("heading", { name: /All Products/i }),
  ).toBeVisible();
}

async function clearCart(page: any) {
  await page.request.delete("/api/cart");
}

async function resolveProductPath(page: any) {
  const buildQuery = (query?: string) => {
    const params = new URLSearchParams({
      includeFacets: "0",
      includeTotal: "0",
      limit: "1",
      sort: "newest",
    });

    if (query) {
      params.set("query", query);
    }

    return params.toString();
  };

  const tryResolve = async (query?: string) => {
    const response = await page.request.get(
      `/api/products?${buildQuery(query)}`,
    );
    if (!response.ok()) {
      return null;
    }

    const payload = await response.json();
    const productId = payload?.products?.[0]?.id;

    if (typeof productId !== "string" || productId.trim().length === 0) {
      return null;
    }

    return `/product/${productId}`;
  };

  const preferredProductPath = await tryResolve(E2E_PRODUCT_QUERY);
  if (preferredProductPath) {
    return preferredProductPath;
  }

  const fallbackProductPath = await tryResolve();
  if (fallbackProductPath) {
    return fallbackProductPath;
  }

  throw new Error(
    `No product available for E2E checkout flow (query='${E2E_PRODUCT_QUERY}')`,
  );
}

async function addProductToCart(page: any) {
  const productPath = await resolveProductPath(page);

  await page.goto(productPath);
  await page.waitForURL(/\/product\/.+/);

  const addToCartButton = page.getByRole("button", { name: /Add to Cart/i });
  await expect(addToCartButton).toBeVisible({ timeout: 15_000 });
  await addToCartButton.click();
  await page.waitForURL(/\/carrinho/);
  await expect(
    page.getByRole("button", { name: /Proceed to Checkout/i }),
  ).toBeVisible();
}

async function proceedToCheckout(page: any) {
  await page.getByRole("button", { name: /Proceed to Checkout/i }).click();
  await page.waitForURL(/\/checkout/);
  await expect(
    page.getByRole("heading", { name: /Finalizar Compra/i }),
  ).toBeVisible();
}

async function completeCheckout(page: any, outcome: "success" | "failed") {
  if (outcome === "failed") {
    await page.route("**/api/checkout", async (route: any) => {
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
  }: {
    page: any;
  }) => {
    await signIn(page);
    await clearCart(page);
    await addProductToCart(page);
    await proceedToCheckout(page);

    const { orderId, checkoutFailed } = await completeCheckout(page, "success");
    expect(checkoutFailed).toBe(false);

    await expect(
      page.getByRole("heading", { name: /My Orders/i }),
    ).toBeVisible();
    await expect(
      page.getByText(`ORD-${orderId.padStart(5, "0")}`),
    ).toBeVisible();
    await expect(page.getByText("Payment approved")).toBeVisible();
  });

  test("@critical executes failed-payment fallback and keeps cancellation context visible", async ({
    page,
  }: {
    page: any;
  }) => {
    await signIn(page);
    await clearCart(page);
    await addProductToCart(page);
    await proceedToCheckout(page);

    const { orderId, checkoutFailed } = await completeCheckout(page, "failed");
    expect(checkoutFailed).toBe(true);

    await expect(
      page.getByRole("heading", { name: /My Orders/i }),
    ).toBeVisible();
    await expect(
      page.getByText(`ORD-${orderId.padStart(5, "0")}`),
    ).toBeVisible();
    await expect(page.getByText(/Cancellation reason:/i)).toBeVisible();
  });
});
