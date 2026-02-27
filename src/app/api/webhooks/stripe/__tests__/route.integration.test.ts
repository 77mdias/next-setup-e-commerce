import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockConstructEvent, mockStripeCtor, mockDb } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockStripeCtor: vi.fn(),
  mockDb: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
  },
}));

vi.mock("stripe", () => {
  class StripeMock {
    webhooks = {
      constructEvent: mockConstructEvent,
    };

    constructor(...args: unknown[]) {
      mockStripeCtor(...args);
    }
  }

  return {
    default: StripeMock,
  };
});

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function createWebhookRequest(payload: unknown) {
  return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": "t=12345,v1=fake-signature",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/webhooks/stripe integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET_KEY = "whsec_test_123";

    mockDb.order.findUnique.mockResolvedValue({
      id: 123,
      status: "PENDING",
      paymentStatus: "PENDING",
      total: 115,
      stripeCheckoutSessionId: null,
      store: { slug: "nextstore" },
    });

    mockDb.order.update.mockResolvedValue({
      id: 123,
      status: "PAID",
      paymentStatus: "PAID",
      total: 115,
      stripeCheckoutSessionId: "cs_test_123",
      stripePaymentIntentId: "pi_test_123",
      items: [],
      store: { slug: "nextstore" },
    });

    mockDb.payment.create.mockResolvedValue({
      id: "pay-1",
      amount: 115,
      status: "PAID",
    });
  });

  it("stores checkoutSessionId and paymentIntentId separately for completed checkout", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          metadata: { orderId: "123" },
          payment_status: "paid",
          payment_intent: "pi_test_123",
        },
      },
    });

    const response = await POST(createWebhookRequest({ example: true }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });

    expect(mockStripeCtor).toHaveBeenCalledTimes(1);
    expect(mockDb.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 123 },
        data: expect.objectContaining({
          stripeCheckoutSessionId: "cs_test_123",
          stripePaymentIntentId: "pi_test_123",
          stripePaymentId: "pi_test_123",
          status: "PAID",
          paymentStatus: "PAID",
        }),
      }),
    );

    expect(mockDb.payment.create).toHaveBeenCalledWith({
      data: {
        orderId: 123,
        method: "stripe",
        amount: 115,
        status: "PAID",
        stripePaymentId: "pi_test_123",
        paidAt: expect.any(Date),
      },
    });
  });

  it("keeps checkoutSessionId as fallback when payment intent is unavailable", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          metadata: { orderId: "123" },
          payment_status: "paid",
          payment_intent: null,
        },
      },
    });

    const response = await POST(createWebhookRequest({ example: true }));

    expect(response.status).toBe(200);
    expect(mockDb.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripeCheckoutSessionId: "cs_test_123",
          stripePaymentIntentId: null,
          stripePaymentId: "cs_test_123",
        }),
      }),
    );
  });
});
