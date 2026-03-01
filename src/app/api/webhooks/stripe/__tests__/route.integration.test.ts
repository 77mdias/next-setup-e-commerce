import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockConstructEvent, mockStripeCtor, mockDb } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockStripeCtor: vi.fn(),
  mockDb: {
    $transaction: vi.fn(),
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    orderStatusHistory: {
      create: vi.fn(),
    },
    stripeWebhookEvent: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
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
    delete process.env.STRIPE_WEBHOOK_PROCESSING_TIMEOUT_MS;

    mockDb.$transaction.mockImplementation(
      async (callback: (tx: typeof mockDb) => Promise<unknown>) =>
        callback(mockDb),
    );

    mockDb.order.findUnique.mockResolvedValue({
      id: 123,
      status: "PENDING",
      paymentStatus: "PENDING",
      total: 115,
      stripeCheckoutSessionId: null,
      store: { slug: "nextstore" },
    });
    mockDb.order.findFirst.mockResolvedValue(null);

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
    mockDb.order.updateMany.mockResolvedValue({ count: 1 });

    mockDb.payment.create.mockResolvedValue({
      id: "pay-1",
      amount: 115,
      status: "PAID",
    });
    mockDb.orderStatusHistory.create.mockResolvedValue({
      id: "history-1",
      orderId: 123,
      status: "PAID",
    });

    mockDb.stripeWebhookEvent.create.mockResolvedValue({ id: "evt-log-1" });
    mockDb.stripeWebhookEvent.findUnique.mockResolvedValue(null);
    mockDb.stripeWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
  });

  it("processes checkout completed atomically and marks event as completed", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_test_123",
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
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);

    expect(mockDb.stripeWebhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "evt_test_123",
          eventType: "checkout.session.completed",
          status: "PROCESSING",
          payload: JSON.stringify({ example: true }),
        }),
      }),
    );

    expect(mockDb.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 123,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      data: expect.objectContaining({
        stripeCheckoutSessionId: "cs_test_123",
        stripePaymentIntentId: "pi_test_123",
        stripePaymentId: "pi_test_123",
        status: "PAID",
        paymentStatus: "PAID",
      }),
    });

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
    expect(mockDb.orderStatusHistory.create).toHaveBeenCalledWith({
      data: {
        orderId: 123,
        status: "PAID",
        notes: expect.stringContaining("source:webhook"),
      },
    });

    expect(mockDb.stripeWebhookEvent.updateMany).toHaveBeenCalledWith({
      where: {
        eventId: "evt_test_123",
        status: "PROCESSING",
      },
      data: expect.objectContaining({
        status: "COMPLETED",
        processedAt: expect.any(Date),
        lastError: null,
      }),
    });
  });

  it("keeps checkoutSessionId as fallback when payment intent is unavailable", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_test_124",
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
    expect(mockDb.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 123,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      data: expect.objectContaining({
        stripeCheckoutSessionId: "cs_test_123",
        stripePaymentIntentId: null,
        stripePaymentId: "cs_test_123",
      }),
    });
  });

  it("creates payment only once when checkout.session.completed is redelivered with the same event id", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_duplicate_123",
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

    const firstResponse = await POST(createWebhookRequest({ first: true }));
    const firstBody = await firstResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(firstBody).toEqual({ received: true });

    mockDb.stripeWebhookEvent.create.mockRejectedValueOnce({ code: "P2002" });
    mockDb.stripeWebhookEvent.findUnique.mockResolvedValueOnce({
      status: "COMPLETED",
      updatedAt: new Date(),
    });

    const secondResponse = await POST(createWebhookRequest({ second: true }));
    const secondBody = await secondResponse.json();

    expect(secondResponse.status).toBe(200);
    expect(secondBody).toEqual({ received: true, deduplicated: true });

    expect(mockDb.payment.create).toHaveBeenCalledTimes(1);
    expect(mockDb.orderStatusHistory.create).toHaveBeenCalledTimes(1);
    expect(mockDb.order.updateMany).toHaveBeenCalledTimes(1);
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  });

  it("reclaims stale processing events and retries business logic safely", async () => {
    mockDb.stripeWebhookEvent.create.mockRejectedValueOnce({ code: "P2002" });
    mockDb.stripeWebhookEvent.findUnique.mockResolvedValueOnce({
      status: "PROCESSING",
      updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    });

    mockConstructEvent.mockReturnValue({
      id: "evt_stale_123",
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

    expect(response.status).toBe(200);
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);

    expect(mockDb.stripeWebhookEvent.updateMany).toHaveBeenCalledTimes(2);

    expect(mockDb.stripeWebhookEvent.updateMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: expect.objectContaining({
          eventId: "evt_stale_123",
          status: "PROCESSING",
          updatedAt: expect.objectContaining({
            lte: expect.any(Date),
          }),
        }),
        data: expect.objectContaining({
          attemptCount: { increment: 1 },
          processedAt: null,
          lastError: null,
        }),
      }),
    );

    expect(mockDb.stripeWebhookEvent.updateMany.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        where: {
          eventId: "evt_stale_123",
          status: "PROCESSING",
        },
        data: expect.objectContaining({
          status: "COMPLETED",
          processedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("returns stable processing response when a redelivery arrives while event is still processing", async () => {
    mockDb.stripeWebhookEvent.create.mockRejectedValueOnce({ code: "P2002" });
    mockDb.stripeWebhookEvent.findUnique.mockResolvedValueOnce({
      status: "PROCESSING",
      updatedAt: new Date(),
    });
    mockDb.stripeWebhookEvent.updateMany.mockResolvedValueOnce({ count: 0 });

    mockConstructEvent.mockReturnValue({
      id: "evt_processing_redelivery_123",
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
    expect(body).toEqual({ received: true, processing: true });

    expect(mockDb.$transaction).not.toHaveBeenCalled();
    expect(mockDb.order.updateMany).not.toHaveBeenCalled();
    expect(mockDb.payment.create).not.toHaveBeenCalled();
    expect(mockDb.orderStatusHistory.create).not.toHaveBeenCalled();
    expect(mockDb.stripeWebhookEvent.updateMany).toHaveBeenCalledTimes(1);
    expect(mockDb.stripeWebhookEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eventId: "evt_processing_redelivery_123",
          status: "PROCESSING",
          updatedAt: expect.objectContaining({
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it("retries a previously failed event redelivery before marking it as completed", async () => {
    mockDb.stripeWebhookEvent.create.mockRejectedValueOnce({ code: "P2002" });
    mockDb.stripeWebhookEvent.findUnique.mockResolvedValueOnce({
      status: "FAILED",
      updatedAt: new Date(),
    });

    mockConstructEvent.mockReturnValue({
      id: "evt_failed_redelivery_123",
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

    const response = await POST(createWebhookRequest({ retry: true }));

    expect(response.status).toBe(200);
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);

    expect(mockDb.stripeWebhookEvent.updateMany).toHaveBeenCalledTimes(2);

    expect(mockDb.stripeWebhookEvent.updateMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: {
          eventId: "evt_failed_redelivery_123",
          status: "FAILED",
        },
        data: expect.objectContaining({
          status: "PROCESSING",
          attemptCount: { increment: 1 },
          processedAt: null,
          lastError: null,
          payload: JSON.stringify({ retry: true }),
        }),
      }),
    );

    expect(mockDb.stripeWebhookEvent.updateMany.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        where: {
          eventId: "evt_failed_redelivery_123",
          status: "PROCESSING",
        },
        data: expect.objectContaining({
          status: "COMPLETED",
          processedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("cancels order only once when the same failure event id is redelivered", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_failure_duplicate_123",
      type: "checkout.session.expired",
      data: {
        object: {
          id: "cs_test_123",
          metadata: { orderId: "123" },
          payment_intent: "pi_test_123",
        },
      },
    });

    const firstResponse = await POST(createWebhookRequest({ first: true }));
    const firstBody = await firstResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(firstBody).toEqual({ received: true });

    mockDb.stripeWebhookEvent.create.mockRejectedValueOnce({ code: "P2002" });
    mockDb.stripeWebhookEvent.findUnique.mockResolvedValueOnce({
      status: "COMPLETED",
      updatedAt: new Date(),
    });

    const secondResponse = await POST(createWebhookRequest({ second: true }));
    const secondBody = await secondResponse.json();

    expect(secondResponse.status).toBe(200);
    expect(secondBody).toEqual({ received: true, deduplicated: true });

    expect(mockDb.order.updateMany).toHaveBeenCalledTimes(1);
    expect(mockDb.orderStatusHistory.create).toHaveBeenCalledTimes(1);
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  });

  it("cancels an order only once across distinct failure events for the same order", async () => {
    mockDb.order.findUnique
      .mockResolvedValueOnce({
        id: 123,
        status: "PENDING",
        paymentStatus: "PENDING",
      })
      .mockResolvedValueOnce({
        id: 123,
        status: "CANCELLED",
        paymentStatus: "FAILED",
      });

    mockConstructEvent
      .mockReturnValueOnce({
        id: "evt_failure_first_123",
        type: "checkout.session.async_payment_failed",
        data: {
          object: {
            id: "cs_test_123",
            metadata: { orderId: "123" },
            payment_intent: "pi_test_123",
          },
        },
      })
      .mockReturnValueOnce({
        id: "evt_failure_second_123",
        type: "checkout.session.expired",
        data: {
          object: {
            id: "cs_test_123",
            metadata: { orderId: "123" },
            payment_intent: "pi_test_123",
          },
        },
      });

    const firstResponse = await POST(createWebhookRequest({ first: true }));
    const secondResponse = await POST(createWebhookRequest({ second: true }));

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);

    expect(mockDb.order.updateMany).toHaveBeenCalledTimes(1);
    expect(mockDb.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 123,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      data: expect.objectContaining({
        status: "CANCELLED",
        paymentStatus: "FAILED",
        cancelledAt: expect.any(Date),
      }),
    });
    expect(mockDb.orderStatusHistory.create).toHaveBeenCalledTimes(1);
    expect(mockDb.orderStatusHistory.create).toHaveBeenCalledWith({
      data: {
        orderId: 123,
        status: "CANCELLED",
        notes: expect.stringContaining("source:webhook"),
      },
    });
  });

  it("ignores failure event when order is already in a non-cancellable state", async () => {
    mockDb.order.findUnique.mockResolvedValueOnce({
      id: 123,
      status: "PAID",
      paymentStatus: "PAID",
    });

    mockConstructEvent.mockReturnValue({
      id: "evt_failure_paid_123",
      type: "checkout.session.async_payment_failed",
      data: {
        object: {
          id: "cs_test_123",
          metadata: { orderId: "123" },
          payment_intent: "pi_test_123",
        },
      },
    });

    const response = await POST(createWebhookRequest({ example: true }));

    expect(response.status).toBe(200);
    expect(mockDb.order.updateMany).not.toHaveBeenCalled();
    expect(mockDb.orderStatusHistory.create).not.toHaveBeenCalled();
  });

  it("resolves charge.failed by payment intent when orderId metadata is missing", async () => {
    mockDb.order.findFirst.mockResolvedValueOnce({
      id: 123,
      status: "PENDING",
      paymentStatus: "PENDING",
    });

    mockConstructEvent.mockReturnValue({
      id: "evt_charge_failed_123",
      type: "charge.failed",
      data: {
        object: {
          id: "ch_test_123",
          metadata: {},
          payment_intent: "pi_test_123",
          failure_message: "Cartão recusado",
        },
      },
    });

    const response = await POST(createWebhookRequest({ example: true }));

    expect(response.status).toBe(200);
    expect(mockDb.order.findFirst).toHaveBeenCalledWith({
      where: {
        stripePaymentIntentId: "pi_test_123",
      },
      select: { id: true, status: true, paymentStatus: true },
      orderBy: { createdAt: "desc" },
    });
    expect(mockDb.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 123,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      data: expect.objectContaining({
        status: "CANCELLED",
        paymentStatus: "FAILED",
        cancelReason: "Pagamento falhou: Cartão recusado",
      }),
    });
    expect(mockDb.orderStatusHistory.create).toHaveBeenCalledWith({
      data: {
        orderId: 123,
        status: "CANCELLED",
        notes: expect.stringContaining("source:webhook"),
      },
    });
  });

  it("blocks invalid checkout success transition and marks webhook event as failed", async () => {
    mockDb.order.findUnique.mockResolvedValueOnce({
      id: 123,
      status: "CANCELLED",
      paymentStatus: "FAILED",
      total: 115,
      stripeCheckoutSessionId: "cs_test_123",
      stripePaymentIntentId: "pi_test_123",
      stripePaymentId: "pi_test_123",
      store: { slug: "nextstore" },
    });

    mockConstructEvent.mockReturnValue({
      id: "evt_invalid_transition_123",
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

    expect(response.status).toBe(409);
    expect(body).toEqual(
      expect.objectContaining({
        error: "Invalid state transition for order payment confirmation",
        orderId: 123,
      }),
    );

    expect(mockDb.order.updateMany).not.toHaveBeenCalled();
    expect(mockDb.payment.create).not.toHaveBeenCalled();
    expect(mockDb.orderStatusHistory.create).not.toHaveBeenCalled();
    expect(mockDb.stripeWebhookEvent.updateMany).toHaveBeenCalledWith({
      where: {
        eventId: "evt_invalid_transition_123",
        status: "PROCESSING",
      },
      data: expect.objectContaining({
        status: "FAILED",
        lastError: expect.stringContaining(
          "Invalid OrderStatus transition: CANCELLED -> PAID",
        ),
      }),
    });
  });

  it("marks webhook event as failed when order is not found", async () => {
    mockDb.order.findUnique.mockResolvedValueOnce(null);

    mockConstructEvent.mockReturnValue({
      id: "evt_missing_order_123",
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

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Order not found", orderId: "123" });

    expect(mockDb.payment.create).not.toHaveBeenCalled();
    expect(mockDb.orderStatusHistory.create).not.toHaveBeenCalled();

    expect(mockDb.stripeWebhookEvent.updateMany).toHaveBeenCalledWith({
      where: {
        eventId: "evt_missing_order_123",
        status: "PROCESSING",
      },
      data: {
        status: "FAILED",
        lastError: "Order 123 not found",
        processedAt: null,
      },
    });
  });

  it("returns 500 and marks event as failed when transaction throws", async () => {
    mockDb.payment.create.mockRejectedValueOnce(new Error("database offline"));

    mockConstructEvent.mockReturnValue({
      id: "evt_tx_fail_123",
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

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });

    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);

    expect(mockDb.stripeWebhookEvent.updateMany).toHaveBeenCalledWith({
      where: {
        eventId: "evt_tx_fail_123",
        status: "PROCESSING",
      },
      data: {
        status: "FAILED",
        lastError: "database offline",
        processedAt: null,
      },
    });
  });
});
