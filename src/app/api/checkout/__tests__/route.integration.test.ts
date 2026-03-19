import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetServerSession,
  mockCreateStripeCheckoutSession,
  mockExpireStripeCheckoutSession,
  mockDb,
} = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockCreateStripeCheckoutSession: vi.fn(),
  mockExpireStripeCheckoutSession: vi.fn(),
  mockDb: {
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    store: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    address: {
      findFirst: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
    },
    inventory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockReservation: {
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    cart: {
      deleteMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/stripe-config", () => ({
  createStripeCheckoutSession: mockCreateStripeCheckoutSession,
  expireStripeCheckoutSession: mockExpireStripeCheckoutSession,
}));

import { POST } from "@/app/api/checkout/route";

const baseStore = {
  id: "store-1",
  name: "NeXT Store",
  slug: "nextstore",
  shippingFee: 15,
  freeShipping: 199,
};

const baseCustomer = {
  email: "customer@example.com",
  name: "Customer",
  phone: "11999999999",
  cpf: "12345678900",
};

const baseProduct = {
  id: "product-1",
  storeId: "store-1",
  isActive: true,
  name: "Notebook Gamer",
  description: "Notebook potente",
  price: 100,
  images: ["https://cdn.example.com/product.png"],
  specifications: { ram: "16GB" },
};

type StructuredLogEntry = {
  message: string;
  route: string | null;
  orderId: number | string | null;
  error?: {
    message?: string | null;
  } | null;
};

function parseStructuredLogEntry(logCall: unknown[]): StructuredLogEntry {
  const [serializedLog] = logCall;

  if (typeof serializedLog !== "string") {
    throw new Error("Structured log must be a JSON string");
  }

  return JSON.parse(serializedLog) as StructuredLogEntry;
}

function createCheckoutRequest(
  payload: unknown,
  headers?: Record<string, string>,
) {
  return new NextRequest("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/checkout integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.E2E_CHECKOUT_MOCK_MODE;

    mockGetServerSession.mockResolvedValue({
      user: {
        id: "user-1",
        email: "customer@example.com",
        name: "Customer",
      },
    });

    mockDb.store.findUnique.mockResolvedValue(baseStore);
    mockDb.user.findUnique.mockResolvedValue(baseCustomer);
    mockDb.address.findFirst.mockResolvedValue(null);
    mockDb.product.findMany.mockResolvedValue([baseProduct]);
    mockDb.productVariant.findMany.mockResolvedValue([]);
    mockDb.inventory.findMany.mockResolvedValue([
      {
        id: "inv-1",
        productId: "product-1",
        variantId: null,
        quantity: 10,
        reserved: 0,
        minStock: 1,
      },
    ]);
    mockDb.$executeRaw.mockResolvedValue(1);
    mockDb.inventory.findUnique.mockResolvedValue({
      id: "inv-1",
      quantity: 10,
      reserved: 9,
      minStock: 1,
    });
    mockDb.inventory.update.mockResolvedValue({});
    mockDb.stockReservation.create.mockResolvedValue({
      id: "res-1",
      inventoryId: "inv-1",
      orderId: 123,
      orderItemId: "item-1",
      quantity: 1,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDb.stockReservation.findMany.mockResolvedValue([]);
    mockDb.stockReservation.updateMany.mockResolvedValue({ count: 1 });
    mockDb.order.create.mockResolvedValue({
      id: 123,
      items: [{ id: "item-1", productId: "product-1", variantId: null }],
    });
    mockDb.order.update.mockResolvedValue({ id: 123 });
    mockDb.order.delete.mockResolvedValue({ id: 123 });
    mockDb.cart.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.$transaction.mockImplementation(async (operation: unknown) => {
      if (typeof operation === "function") {
        return operation(mockDb);
      }

      throw new Error("Unsupported transaction operation in test");
    });

    mockCreateStripeCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      url: "https://stripe.test/session/cs_test_123",
    });
    mockExpireStripeCheckoutSession.mockResolvedValue(undefined);
  });

  it("rejects adulterated payload with sensitive item fields", async () => {
    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [
          {
            productId: "product-1",
            quantity: 1,
            price: 1,
          },
        ],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Dados inválidos para checkout");
    expect(mockDb.store.findUnique).not.toHaveBeenCalled();
    expect(mockDb.order.create).not.toHaveBeenCalled();
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it("recalculates totals from canonical DB data and propagates values to Stripe", async () => {
    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sessionId).toBe("cs_test_123");

    expect(mockDb.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 100,
          shippingFee: 15,
          total: 115,
          status: "PENDING",
          paymentStatus: "PENDING",
          statusHistory: {
            create: expect.objectContaining({
              status: "PENDING",
              changedBy: "user-1",
              notes: expect.stringContaining("source:checkout"),
            }),
          },
        }),
      }),
    );

    const stripePayload = mockCreateStripeCheckoutSession.mock.calls[0][0];
    expect(stripePayload.line_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          quantity: 1,
          price_data: expect.objectContaining({
            unit_amount: 10000,
          }),
        }),
        expect.objectContaining({
          quantity: 1,
          price_data: expect.objectContaining({
            unit_amount: 1500,
          }),
        }),
      ]),
    );
    expect(stripePayload.metadata).toMatchObject({
      subtotalCents: "10000",
      shippingFeeCents: "1500",
      totalCents: "11500",
    });

    expect(mockDb.order.update).toHaveBeenCalledWith({
      where: { id: 123 },
      data: {
        stripeCheckoutSessionId: "cs_test_123",
        stripePaymentId: "cs_test_123",
        paymentMethod: "stripe",
      },
    });
    expect(mockDb.stockReservation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        inventoryId: "inv-1",
        orderId: 123,
        orderItemId: "item-1",
        quantity: 1,
        status: "ACTIVE",
      }),
    });
    expect(mockDb.cart.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("simulates successful checkout flow for E2E mode without calling Stripe", async () => {
    process.env.E2E_CHECKOUT_MOCK_MODE = "true";
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.orderId).toBe(123);
    expect(body.sessionId).toMatch(/^cs_e2e_123_/);
    expect(body.url).toContain("/orders/success?session_id=cs_e2e_123_");
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
    expect(mockDb.order.update).toHaveBeenCalledWith({
      where: { id: 123 },
      data: expect.objectContaining({
        status: "PAID",
        paymentStatus: "PAID",
        stripeCheckoutSessionId: expect.stringMatching(/^cs_e2e_123_/),
        stripePaymentIntentId: expect.stringMatching(/^cs_e2e_123_/),
        stripePaymentId: expect.stringMatching(/^cs_e2e_123_/),
        paymentMethod: "stripe",
        cancelReason: null,
      }),
    });
  });

  it("simulates failed checkout flow for E2E mode when outcome header is provided", async () => {
    process.env.E2E_CHECKOUT_MOCK_MODE = "true";
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

    const response = await POST(
      createCheckoutRequest(
        {
          storeId: "store-1",
          items: [{ productId: "product-1", quantity: 1 }],
          shippingMethod: "STANDARD",
        },
        {
          "x-e2e-checkout-outcome": "failed",
        },
      ),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.orderId).toBe(123);
    expect(body.sessionId).toMatch(/^cs_e2e_123_/);
    expect(body.url).toContain("/orders/failure?session_id=cs_e2e_123_");
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
    expect(mockDb.order.update).toHaveBeenCalledWith({
      where: { id: 123 },
      data: expect.objectContaining({
        status: "CANCELLED",
        paymentStatus: "FAILED",
        stripeCheckoutSessionId: expect.stringMatching(/^cs_e2e_123_/),
        stripePaymentIntentId: expect.stringMatching(/^cs_e2e_123_/),
        stripePaymentId: expect.stringMatching(/^cs_e2e_123_/),
        cancelledAt: expect.any(Date),
        cancelReason: "Pagamento falhou (simulação E2E).",
      }),
    });
  });

  it("persists addressId when selected address belongs to the authenticated user", async () => {
    mockDb.address.findFirst.mockResolvedValueOnce({ id: "address-1" });

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
        addressId: "address-1",
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.address.findFirst).toHaveBeenCalledWith({
      where: {
        id: "address-1",
        userId: "user-1",
      },
      select: { id: true },
    });
    expect(mockDb.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          addressId: "address-1",
        }),
      }),
    );
  });

  it("returns 400 when provided addressId is invalid for authenticated user", async () => {
    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
        addressId: "address-404",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Endereço inválido");
    expect(mockDb.order.create).not.toHaveBeenCalled();
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns 404 for missing product and does not create order", async () => {
    mockDb.product.findMany.mockResolvedValue([]);
    mockDb.inventory.findMany.mockResolvedValue([]);

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-unknown", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain("Produto não encontrado");
    expect(mockDb.order.create).not.toHaveBeenCalled();
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns 400 for inactive product and does not create order", async () => {
    mockDb.product.findMany.mockResolvedValue([
      {
        ...baseProduct,
        isActive: false,
      },
    ]);

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Produto inativo");
    expect(mockDb.order.create).not.toHaveBeenCalled();
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns 400 when product does not belong to selected store", async () => {
    mockDb.product.findMany.mockResolvedValue([
      {
        ...baseProduct,
        storeId: "store-2",
      },
    ]);

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Produto não pertence à loja selecionada");
    expect(mockDb.order.create).not.toHaveBeenCalled();
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns 409 when requested quantity violates min stock protection", async () => {
    mockDb.inventory.findMany.mockResolvedValue([
      {
        id: "inv-1",
        productId: "product-1",
        variantId: null,
        quantity: 14,
        reserved: 0,
        minStock: 5,
      },
    ]);

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 10 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("estoque mínimo");
    expect(mockDb.order.create).not.toHaveBeenCalled();
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it("returns 409 when atomic reservation detects concurrent stock exhaustion", async () => {
    mockDb.$executeRaw.mockResolvedValueOnce(0);
    mockDb.inventory.findUnique.mockResolvedValueOnce({
      id: "inv-1",
      quantity: 1,
      reserved: 1,
      minStock: 0,
    });

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("Estoque insuficiente");
    expect(mockCreateStripeCheckoutSession).not.toHaveBeenCalled();
    expect(mockDb.order.update).not.toHaveBeenCalled();
  });

  it("rolls back order and items when Stripe session creation fails", async () => {
    mockCreateStripeCheckoutSession.mockRejectedValueOnce(
      new Error("Stripe indisponível"),
    );

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Erro interno do servidor");
    expect(mockDb.order.create).toHaveBeenCalledTimes(1);
    expect(mockDb.order.update).not.toHaveBeenCalled();
    expect(mockExpireStripeCheckoutSession).not.toHaveBeenCalled();
    expect(mockDb.order.delete).toHaveBeenCalledWith({
      where: { id: 123 },
    });
  });

  it("rolls back order when persisting Stripe session identifiers fails", async () => {
    mockDb.order.update.mockRejectedValueOnce(
      new Error("Falha ao atualizar identificadores Stripe"),
    );

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Erro interno do servidor");
    expect(mockCreateStripeCheckoutSession).toHaveBeenCalledTimes(1);
    expect(mockDb.order.update).toHaveBeenCalledTimes(1);
    expect(mockExpireStripeCheckoutSession).toHaveBeenCalledWith("cs_test_123");
    expect(mockDb.order.delete).toHaveBeenCalledWith({
      where: { id: 123 },
    });
  });

  it("logs rollback failure when deleting orphan order also fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockDb.order.update.mockRejectedValueOnce(
      new Error("Falha ao atualizar identificadores Stripe"),
    );
    mockDb.order.delete.mockRejectedValueOnce(
      new Error("Falha ao deletar pedido"),
    );

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Erro interno do servidor");
    expect(mockExpireStripeCheckoutSession).toHaveBeenCalledWith("cs_test_123");
    expect(mockDb.order.delete).toHaveBeenCalledWith({
      where: { id: 123 },
    });

    const structuredLogs = consoleErrorSpy.mock.calls.map(
      parseStructuredLogEntry,
    );
    const rollbackFailureLog = structuredLogs.find(
      (logEntry) =>
        logEntry.message === "checkout.rollback_order_delete_failed",
    );

    expect(rollbackFailureLog).toMatchObject({
      route: "/api/checkout",
      orderId: 123,
      error: {
        message: "Falha ao deletar pedido",
      },
    });

    consoleErrorSpy.mockRestore();
  });

  it("redacts PII in checkout error logs", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockCreateStripeCheckoutSession.mockRejectedValueOnce(
      new Error(
        "Falha para customer@example.com cpf 12345678900 token=sk_test_sensitive session_id=cs_test_sensitive",
      ),
    );

    const response = await POST(
      createCheckoutRequest({
        storeId: "store-1",
        items: [{ productId: "product-1", quantity: 1 }],
        shippingMethod: "STANDARD",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Erro interno do servidor");

    const structuredLogs = consoleErrorSpy.mock.calls.map(
      parseStructuredLogEntry,
    );
    const internalErrorLog = structuredLogs.find(
      (logEntry) => logEntry.message === "checkout.internal_error",
    );

    expect(internalErrorLog).toBeDefined();
    const serializedInternalErrorLog = JSON.stringify(internalErrorLog);

    expect(serializedInternalErrorLog).not.toContain("customer@example.com");
    expect(serializedInternalErrorLog).not.toContain("12345678900");
    expect(serializedInternalErrorLog).not.toContain("sk_test_sensitive");
    expect(serializedInternalErrorLog).not.toContain("cs_test_sensitive");
    expect(serializedInternalErrorLog).toContain("[REDACTED_EMAIL]");
    expect(serializedInternalErrorLog).toContain("[REDACTED_CPF]");
    expect(serializedInternalErrorLog).toContain("[REDACTED_TOKEN]");

    consoleErrorSpy.mockRestore();
  });
});
