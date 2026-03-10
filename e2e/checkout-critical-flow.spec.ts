import { expect, test, type Page, type Route } from "@playwright/test";

const E2E_USER_EMAIL =
  process.env.E2E_USER_EMAIL ?? "e2e.customer@nextstore.local";
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? "E2eCheckout#123";
const E2E_PRODUCT_QUERY =
  process.env.E2E_PRODUCT_QUERY ?? "E2E Checkout Headset";

type CheckoutOutcome = "success" | "failed";

type ProductSummary = {
  id: string;
};

type ProductsListResponse = {
  products: ProductSummary[];
};

function isProductsListResponse(
  payload: unknown,
): payload is ProductsListResponse {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const maybeProducts = (payload as { products?: unknown }).products;
  if (!Array.isArray(maybeProducts)) {
    return false;
  }

  return maybeProducts.every((product) => {
    if (typeof product !== "object" || product === null) {
      return false;
    }

    return typeof (product as { id?: unknown }).id === "string";
  });
}

async function signIn(page: Page) {
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

async function clearCart(page: Page) {
  await page.request.delete("/api/cart");
}

async function resolveProductPath(page: Page) {
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

    const payload: unknown = await response.json();
    if (!isProductsListResponse(payload) || payload.products.length === 0) {
      return null;
    }

    const productId = payload.products[0].id.trim();
    if (productId.length === 0) {
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

async function addProductToCart(page: Page) {
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

async function proceedToCheckout(page: Page) {
  await page.getByRole("button", { name: /Proceed to Checkout/i }).click();
  await page.waitForURL(/\/checkout/);
  await expect(
    page.getByRole("heading", { name: /Finalizar Compra/i }),
  ).toBeVisible();
}

async function completeCheckout(page: Page, outcome: CheckoutOutcome) {
  const checkoutRoutePattern = "**/api/checkout";

  if (outcome === "failed") {
    await page.route(checkoutRoutePattern, async (route: Route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          "x-e2e-checkout-outcome": "failed",
        },
      });
    });
  }

  try {
    const submitButton = page.getByRole("button", {
      name: /Finalizar Compra/i,
    });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    const targetUrlPattern =
      outcome === "failed"
        ? /\/orders\?orderId=\d+&checkout=failed/
        : /\/orders\?orderId=\d+$/;

    await page.waitForURL(targetUrlPattern, { timeout: 30_000 });

    const url = new URL(page.url());
    const orderId = url.searchParams.get("orderId");
    expect(orderId).toBeTruthy();

    return {
      orderId: orderId as string,
      checkoutFailed: url.searchParams.get("checkout") === "failed",
    };
  } finally {
    if (outcome === "failed") {
      await page.unroute(checkoutRoutePattern);
    }
  }
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
