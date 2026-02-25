import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetServerSession, mockCreateStripeCheckoutSession, mockDb } =
  vi.hoisted(() => ({
    mockGetServerSession: vi.fn(),
    mockCreateStripeCheckoutSession: vi.fn(),
    mockDb: {
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
      },
      order: {
        create: vi.fn(),
        update: vi.fn(),
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

function createCheckoutRequest(payload: unknown) {
  return new NextRequest("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/checkout integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
        productId: "product-1",
        variantId: null,
        quantity: 10,
        reserved: 0,
        minStock: 1,
      },
    ]);
    mockDb.order.create.mockResolvedValue({ id: 123 });
    mockDb.order.update.mockResolvedValue({ id: 123 });

    mockCreateStripeCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      url: "https://stripe.test/session/cs_test_123",
    });
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

  it("returns 409 when requested quantity violates min stock protection", async () => {
    mockDb.inventory.findMany.mockResolvedValue([
      {
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
});
