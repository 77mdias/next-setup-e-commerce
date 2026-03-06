import { beforeEach, describe, expect, it, vi } from "vitest";

import LegacySlugCartPage from "@/app/[slug]/carrinho/page";
import LegacySlugCheckoutPage from "@/app/[slug]/checkout/page";
import OfertasRedirectPage from "@/app/[slug]/ofertas/page";
import LegacySlugOrderDetailsPage from "@/app/[slug]/pedido/[orderId]/page";
import LegacySlugOrderFailurePage from "@/app/[slug]/pedido/falha/page";
import LegacySlugOrdersPage from "@/app/[slug]/pedido/page";
import LegacySlugOrderSuccessPage from "@/app/[slug]/pedido/sucesso/page";
import LegacyProductDetailRedirectPage from "@/app/[slug]/product/[productId]/page";
import LegacySlugWishlistPage from "@/app/[slug]/wishlist/page";
import {
  resolveCanonicalCartPath,
  resolveCanonicalProductHref,
} from "@/lib/routes";
import type { PageSearchParams } from "@/lib/search-params";

type RedirectError = Error & { destination?: string };

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn((destination: string) => {
    const redirectError = new Error("NEXT_REDIRECT_TEST") as RedirectError;
    redirectError.destination = destination;
    throw redirectError;
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

async function expectRedirectTo(
  promise: Promise<unknown>,
  destination: string,
) {
  await expect(promise).rejects.toMatchObject({
    message: "NEXT_REDIRECT_TEST",
    destination,
  });
}

function makeSearchParams(params: PageSearchParams = {}) {
  return Promise.resolve(params);
}

describe("legacy slug route bridge redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves querystring when redirecting /[slug]/carrinho", async () => {
    await expectRedirectTo(
      LegacySlugCartPage({
        searchParams: makeSearchParams({ coupon: "save10", utm_source: "ads" }),
      }),
      "/carrinho?coupon=save10&utm_source=ads",
    );
  });

  it("preserves querystring when redirecting /[slug]/checkout", async () => {
    await expectRedirectTo(
      LegacySlugCheckoutPage({
        searchParams: makeSearchParams({ step: "payment" }),
      }),
      "/checkout?step=payment",
    );
  });

  it("preserves querystring when redirecting /[slug]/wishlist", async () => {
    await expectRedirectTo(
      LegacySlugWishlistPage({
        searchParams: makeSearchParams({ highlight: "mouse-1" }),
      }),
      "/wishlist?highlight=mouse-1",
    );
  });

  it("preserves querystring when redirecting /[slug]/pedido", async () => {
    await expectRedirectTo(
      LegacySlugOrdersPage({
        searchParams: makeSearchParams({ orderId: "123" }),
      }),
      "/orders?orderId=123",
    );
  });

  it("preserves querystring when redirecting legacy product detail route", async () => {
    await expectRedirectTo(
      LegacyProductDetailRedirectPage({
        params: Promise.resolve({ productId: "prod-001" }),
        searchParams: makeSearchParams({ ref: "hero" }),
      }),
      "/product/prod-001?ref=hero",
    );
  });

  it("preserves querystring when redirecting legacy order detail route", async () => {
    await expectRedirectTo(
      LegacySlugOrderDetailsPage({
        params: Promise.resolve({ orderId: "ord-001" }),
        searchParams: makeSearchParams({ tab: "summary" }),
      }),
      "/orders/ord-001?tab=summary",
    );
  });

  it("preserves full querystring when redirecting /[slug]/pedido/sucesso", async () => {
    await expectRedirectTo(
      LegacySlugOrderSuccessPage({
        searchParams: makeSearchParams({
          session_id: "cs_test_123",
          checkout: "retry",
        }),
      }),
      "/orders/success?session_id=cs_test_123&checkout=retry",
    );
  });

  it("preserves full querystring when redirecting /[slug]/pedido/falha", async () => {
    await expectRedirectTo(
      LegacySlugOrderFailurePage({
        searchParams: makeSearchParams({
          session_id: "cs_test_123",
          reason: "payment",
        }),
      }),
      "/orders/failure?session_id=cs_test_123&reason=payment",
    );
  });

  it("preserves querystring when redirecting /[slug]/ofertas", async () => {
    await expectRedirectTo(
      OfertasRedirectPage({
        params: Promise.resolve({ slug: "store-x" }),
        searchParams: makeSearchParams({ source: "banner" }),
      }),
      "/explore?source=banner",
    );
  });
});

describe("canonical route normalization helpers", () => {
  it("normalizes /cart and slug cart aliases to canonical cart route", () => {
    expect(resolveCanonicalCartPath("/cart?coupon=save10")).toBe(
      "/carrinho?coupon=save10",
    );
    expect(resolveCanonicalCartPath("/minha-loja/carrinho?coupon=save10")).toBe(
      "/carrinho?coupon=save10",
    );
  });

  it("uses canonical cart fallback for unsupported redirect targets", () => {
    expect(resolveCanonicalCartPath("/orders")).toBe("/carrinho");
    expect(resolveCanonicalCartPath("https://example.com/cart")).toBe(
      "/carrinho",
    );
  });

  it("normalizes legacy product href to canonical product detail", () => {
    expect(
      resolveCanonicalProductHref(
        "/store-a/product/prod-123?ref=hero",
        "fallback",
      ),
    ).toBe("/product/prod-123?ref=hero");
  });

  it("normalizes legacy category href to canonical products listing", () => {
    expect(
      resolveCanonicalProductHref(
        "/store-a/categorias/teclados?storeSlug=store-a&sort=rating",
        "fallback",
      ),
    ).toBe("/products?sort=rating&category=teclados");
  });

  it("falls back to canonical product path when href is invalid", () => {
    expect(
      resolveCanonicalProductHref("https://example.com/product/123", "prod-1"),
    ).toBe("/product/prod-1");
    expect(resolveCanonicalProductHref("", "prod-2")).toBe("/product/prod-2");
  });
});
