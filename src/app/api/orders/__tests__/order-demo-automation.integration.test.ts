import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb, mockTransactionClient } = vi.hoisted(() => {
  const transactionClient = {
    order: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    orderStatusHistory: {
      create: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    cart: {
      deleteMany: vi.fn(),
    },
  };

  return {
    mockTransactionClient: transactionClient,
    mockDb: {
      $transaction: vi.fn(
        async (
          callback: (client: typeof transactionClient) => Promise<unknown>,
        ) => callback(transactionClient),
      ),
      order: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { runDemoOrderAutomationForOrder } from "@/lib/order-demo-automation";

const mutableEnv = process.env as Record<string, string | undefined>;

function createAutomationOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    userId: "user-owner",
    status: "PENDING",
    paymentStatus: "PENDING",
    total: 119.9,
    paymentMethod: "stripe",
    stripePaymentId: "cs_test_42",
    stripePaymentIntentId: null,
    trackingCode: null,
    createdAt: new Date(Date.now() - 3 * 60 * 1000),
    estimatedDelivery: null,
    shippedAt: null,
    deliveredAt: null,
    ...overrides,
  };
}

describe("order-demo-automation integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableEnv.DEMO_ORDER_AUTOMATION_ENABLED = "true";
    delete mutableEnv.DEMO_ORDER_PAYMENT_CONFIRMED_AFTER_MINUTES;
    delete mutableEnv.DEMO_ORDER_PROCESSING_AFTER_MINUTES;
    delete mutableEnv.DEMO_ORDER_SHIPPED_AFTER_MINUTES;
    delete mutableEnv.DEMO_ORDER_DELIVERED_AFTER_MINUTES;
  });

  it("does not run transitions when feature flag is disabled", async () => {
    mutableEnv.DEMO_ORDER_AUTOMATION_ENABLED = "false";

    const result = await runDemoOrderAutomationForOrder(42);

    expect(result).toEqual({
      updated: false,
      transitionsApplied: 0,
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("auto-confirms pending payment and creates paid payment record", async () => {
    mockTransactionClient.order.findUnique.mockResolvedValue(
      createAutomationOrder(),
    );
    mockTransactionClient.order.updateMany.mockResolvedValue({ count: 1 });
    mockTransactionClient.payment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockTransactionClient.payment.create.mockResolvedValue({ id: "pay-1" });

    const result = await runDemoOrderAutomationForOrder(42);

    expect(result).toEqual({
      updated: true,
      transitionsApplied: 1,
    });
    expect(mockTransactionClient.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PAID",
          paymentStatus: "PAID",
        }),
      }),
    );
    expect(
      mockTransactionClient.orderStatusHistory.create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 42,
          status: "PAID",
          notes: expect.stringContaining("source:demo_automation"),
        }),
      }),
    );
    expect(mockTransactionClient.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 42,
          status: "PAID",
        }),
      }),
    );
    expect(mockTransactionClient.cart.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-owner",
      },
    });
  });

  it("applies full demo delivery timeline for aged pending orders", async () => {
    mockTransactionClient.order.findUnique.mockResolvedValue(
      createAutomationOrder({
        createdAt: new Date(Date.now() - 9 * 60 * 1000),
      }),
    );
    mockTransactionClient.order.updateMany.mockResolvedValue({ count: 1 });
    mockTransactionClient.payment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockTransactionClient.payment.create.mockResolvedValue({ id: "pay-2" });

    const result = await runDemoOrderAutomationForOrder(42);

    expect(result).toEqual({
      updated: true,
      transitionsApplied: 4,
    });
    expect(
      mockTransactionClient.orderStatusHistory.create,
    ).toHaveBeenCalledTimes(4);
    expect(
      mockTransactionClient.orderStatusHistory.create.mock.calls.map(
        (call) => (call[0] as { data: { status: string } }).data.status,
      ),
    ).toEqual(["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]);
    expect(mockTransactionClient.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SHIPPED",
          trackingCode: expect.stringContaining("DEMO-"),
        }),
      }),
    );
    expect(mockTransactionClient.cart.deleteMany).toHaveBeenCalledTimes(1);
  });
});
