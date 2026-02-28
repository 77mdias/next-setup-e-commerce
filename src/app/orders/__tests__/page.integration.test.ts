import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildAccessFeedbackPath } from "@/lib/access-feedback";

type RedirectError = Error & { destination?: string };

const { mockGetServerSession, mockRedirect, mockDb } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockRedirect: vi.fn((destination: string) => {
    const redirectError = new Error("NEXT_REDIRECT_TEST") as RedirectError;
    redirectError.destination = destination;
    throw redirectError;
  }),
  mockDb: {
    order: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import OrdersFailurePage from "@/app/orders/failure/page";
import OrdersSuccessPage from "@/app/orders/success/page";

function makeSearchParams(sessionId?: string) {
  if (typeof sessionId === "undefined") {
    return Promise.resolve({});
  }

  return Promise.resolve({ session_id: sessionId });
}

async function expectRedirectTo(promise: Promise<unknown>, destination: string) {
  await expect(promise).rejects.toMatchObject({
    message: "NEXT_REDIRECT_TEST",
    destination,
  });
}

describe("orders success/failure pages integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });

    mockDb.order.findFirst.mockResolvedValue({ id: 321 });
  });

  it("redirects anonymous user from success page to auth flow preserving session_id", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const callbackUrl = "/orders/success?session_id=cs_owner_1";
    await expectRedirectTo(
      OrdersSuccessPage({ searchParams: makeSearchParams("cs_owner_1") }),
      buildAccessFeedbackPath({
        reason: "auth-required",
        callbackUrl,
        fromPath: callbackUrl,
      }),
    );
  });

  it("redirects success page to specific order when owner session exists", async () => {
    await expectRedirectTo(
      OrdersSuccessPage({ searchParams: makeSearchParams("cs_owner_1") }),
      "/orders?orderId=321",
    );

    expect(mockDb.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-owner",
          OR: [
            { stripeCheckoutSessionId: "cs_owner_1" },
            { stripePaymentId: "cs_owner_1" },
          ],
        },
        select: { id: true },
      }),
    );
  });

  it("redirects success page to safe forbidden feedback when order is not found", async () => {
    mockDb.order.findFirst.mockResolvedValue(null);

    const fromPath = "/orders/success?session_id=cs_owner_1";
    await expectRedirectTo(
      OrdersSuccessPage({ searchParams: makeSearchParams("cs_owner_1") }),
      buildAccessFeedbackPath({
        reason: "forbidden",
        callbackUrl: "/orders",
        fromPath,
      }),
    );
  });

  it("redirects failure page to cart when session_id is missing", async () => {
    await expectRedirectTo(
      OrdersFailurePage({ searchParams: makeSearchParams() }),
      "/carrinho?checkout=failed",
    );
  });

  it("redirects anonymous user from failure page to auth flow preserving session_id", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const callbackUrl = "/orders/failure?session_id=cs_owner_1";
    await expectRedirectTo(
      OrdersFailurePage({ searchParams: makeSearchParams("cs_owner_1") }),
      buildAccessFeedbackPath({
        reason: "auth-required",
        callbackUrl,
        fromPath: callbackUrl,
      }),
    );
  });

  it("redirects failure page to owner order with failed checkout marker", async () => {
    await expectRedirectTo(
      OrdersFailurePage({ searchParams: makeSearchParams("cs_owner_1") }),
      "/orders?orderId=321&checkout=failed",
    );
  });

  it("redirects failure page to safe forbidden feedback when order is not found", async () => {
    mockDb.order.findFirst.mockResolvedValue(null);

    const fromPath = "/orders/failure?session_id=cs_owner_1";
    await expectRedirectTo(
      OrdersFailurePage({ searchParams: makeSearchParams("cs_owner_1") }),
      buildAccessFeedbackPath({
        reason: "forbidden",
        callbackUrl: "/carrinho?checkout=failed",
        fromPath,
      }),
    );
  });
});
