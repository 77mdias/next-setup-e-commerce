import { beforeEach, describe, expect, it, vi } from "vitest";

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

import LegacyCartPage from "@/app/cart/page";

async function expectRedirectTo(
  promise: Promise<unknown>,
  destination: string,
) {
  await expect(promise).rejects.toMatchObject({
    message: "NEXT_REDIRECT_TEST",
    destination,
  });
}

describe("/cart legacy canonical redirect integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to canonical /carrinho when there is no querystring", async () => {
    await expectRedirectTo(LegacyCartPage({}), "/carrinho");
  });

  it("preserves full querystring when redirecting from /cart to /carrinho", async () => {
    await expectRedirectTo(
      LegacyCartPage({
        searchParams: Promise.resolve({
          coupon: "save10",
          utm_source: "campaign",
          item: ["1", "2"],
        }),
      }),
      "/carrinho?coupon=save10&utm_source=campaign&item=1&item=2",
    );
  });
});
