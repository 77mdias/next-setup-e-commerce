import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminAccess, mockDb, mockTransactionClient } = vi.hoisted(
  () => ({
    mockDb: {
      $transaction: vi.fn(),
      order: {
        findUnique: vi.fn(),
      },
    },
    mockRequireAdminAccess: vi.fn(),
    mockTransactionClient: {
      order: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      orderStatusHistory: {
        create: vi.fn(),
      },
    },
  }),
);

vi.mock("@/lib/auth", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { GET, PATCH } from "@/app/api/admin/orders/[orderId]/route";

function createGetRequest(orderId: string) {
  return new NextRequest(`http://localhost:3000/api/admin/orders/${orderId}`, {
    method: "GET",
  });
}

function createPatchRequest(orderId: string, body: unknown) {
  return new NextRequest(`http://localhost:3000/api/admin/orders/${orderId}`, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "PATCH",
  });
}

const baseOrderDetail = {
  address: {
    city: "Sao Paulo",
    complement: "Apto 101",
    neighborhood: "Centro",
    number: "123",
    state: "SP",
    street: "Rua das Flores",
    zipCode: "01000-000",
  },
  cancelReason: null,
  cancelledAt: null,
  createdAt: new Date("2026-03-16T11:00:00.000Z"),
  customerEmail: "maria@example.com",
  customerName: "Maria Souza",
  customerPhone: "+5511999991234",
  deliveredAt: null,
  estimatedDelivery: new Date("2026-03-20T12:00:00.000Z"),
  id: 153,
  items: [
    {
      id: "item-1",
      productImage: "https://cdn.example.com/mouse.png",
      productName: "Mouse RGB",
      quantity: 1,
      totalPrice: 199.9,
      unitPrice: 199.9,
    },
  ],
  notes: "Separar embalagem reforcada",
  paymentStatus: "PAID",
  payments: [
    {
      amount: 199.9,
      failedAt: null,
      id: "payment-1",
      method: "credit_card",
      paidAt: new Date("2026-03-16T11:05:00.000Z"),
      status: "PAID",
    },
  ],
  shippedAt: null,
  shippingMethod: "STANDARD",
  status: "PROCESSING",
  statusHistory: [
    {
      changedBy: "admin-1",
      createdAt: new Date("2026-03-16T11:10:00.000Z"),
      id: "history-1",
      notes: "source:admin_orders; from:PAID; to:PROCESSING",
      status: "PROCESSING",
      user: {
        role: "ADMIN",
      },
    },
  ],
  store: {
    id: "store-1",
    name: "Loja Centro",
  },
  total: 199.9,
  trackingCode: "BR123",
  updatedAt: new Date("2026-03-16T11:10:00.000Z"),
  userId: "customer-1",
};

describe("/api/admin/orders/[orderId] integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockRequireAdminAccess.mockResolvedValue({
      authorized: true,
      user: {
        adminStoreScope: {
          kind: "stores",
          storeIds: ["store-1"],
        },
        id: "admin-1",
        role: "ADMIN",
      },
    });

    mockDb.order.findUnique.mockResolvedValue(baseOrderDetail);
    mockTransactionClient.order.updateMany.mockResolvedValue({
      count: 1,
    });
    mockTransactionClient.orderStatusHistory.create.mockResolvedValue({
      id: "history-2",
    });
    mockTransactionClient.order.findUnique.mockResolvedValue({
      ...baseOrderDetail,
      shippedAt: new Date("2026-03-17T12:00:00.000Z"),
      status: "SHIPPED",
      statusHistory: [
        ...baseOrderDetail.statusHistory,
        {
          changedBy: "admin-1",
          createdAt: new Date("2026-03-17T12:00:00.000Z"),
          id: "history-2",
          notes: "source:admin_orders; from:PROCESSING; to:SHIPPED",
          status: "SHIPPED",
          user: {
            role: "ADMIN",
          },
        },
      ],
      updatedAt: new Date("2026-03-17T12:00:00.000Z"),
    });
    mockDb.$transaction.mockImplementation(async (operation: unknown) => {
      if (typeof operation === "function") {
        return operation(mockTransactionClient);
      }

      throw new Error("Unexpected transaction invocation");
    });
  });

  it("returns 401 when there is no authenticated admin session", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      authorized: false,
      status: 401,
    });

    const response = await GET(createGetRequest("153"), {
      params: Promise.resolve({ orderId: "153" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      code: "ADMIN_AUTH_REQUIRED",
      error: "Usuário não autenticado",
    });
    expect(mockDb.order.findUnique).not.toHaveBeenCalled();
  });

  it("returns 403 when a store admin accesses another store order", async () => {
    mockDb.order.findUnique.mockResolvedValue({
      ...baseOrderDetail,
      store: {
        id: "store-2",
        name: "Loja Norte",
      },
    });

    const response = await GET(createGetRequest("153"), {
      params: Promise.resolve({ orderId: "153" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      code: "ADMIN_ACCESS_DENIED",
      error: "Ação administrativa não autorizada",
    });
  });

  it("returns masked order details with normalized history", async () => {
    const response = await GET(createGetRequest("153"), {
      params: Promise.resolve({ orderId: "153" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      order: {
        address: {
          city: "Sao Paulo",
          complement: "Apto 101",
          neighborhood: "Centro",
          number: "123",
          state: "SP",
          street: "Rua das Flores",
          zipCode: "01000-000",
        },
        availableActions: {
          canUpdateStatus: true,
          statusOptions: ["SHIPPED"],
        },
        cancelReason: null,
        cancelledAt: null,
        code: "ORD-00153",
        createdAt: "2026-03-16T11:00:00.000Z",
        customer: {
          emailMasked: "ma***@example.com",
          name: "Maria Souza",
          phoneMasked: "*** *** 1234",
        },
        customerName: "Maria Souza",
        deliveredAt: null,
        estimatedDelivery: "2026-03-20T12:00:00.000Z",
        history: [
          {
            actorLabel: "Operacao admin",
            createdAt: "2026-03-16T11:10:00.000Z",
            description:
              "Atualizacao operacional registrada pelo painel admin.",
            id: "history-1",
            isFallback: false,
            status: "PROCESSING",
          },
        ],
        id: 153,
        itemCount: 1,
        itemPreview: ["Mouse RGB"],
        items: [
          {
            id: "item-1",
            productImage: "https://cdn.example.com/mouse.png",
            productName: "Mouse RGB",
            quantity: 1,
            totalPrice: 199.9,
            unitPrice: 199.9,
          },
        ],
        notes: "Separar embalagem reforcada",
        paymentStatus: "PAID",
        payments: [
          {
            amount: 199.9,
            failedAt: null,
            id: "payment-1",
            method: "credit_card",
            paidAt: "2026-03-16T11:05:00.000Z",
            status: "PAID",
          },
        ],
        shippedAt: null,
        shippingMethod: "STANDARD",
        status: "PROCESSING",
        store: {
          id: "store-1",
          name: "Loja Centro",
        },
        total: 199.9,
        trackingCode: "BR123",
      },
      success: true,
    });
  });

  it("rejects invalid operational status transitions", async () => {
    const response = await PATCH(
      createPatchRequest("153", { nextStatus: "PAID" }),
      {
        params: Promise.resolve({ orderId: "153" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: "ADMIN_ORDER_INVALID_ACTION",
      error: "Ação operacional inválida para o pedido",
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("updates the order status atomically and returns refreshed detail", async () => {
    const response = await PATCH(
      createPatchRequest("153", { nextStatus: "SHIPPED" }),
      {
        params: Promise.resolve({ orderId: "153" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockTransactionClient.order.updateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shippedAt: expect.any(Date),
        status: "SHIPPED",
      }),
      where: {
        id: 153,
        paymentStatus: "PAID",
        status: "PROCESSING",
      },
    });
    expect(
      mockTransactionClient.orderStatusHistory.create,
    ).toHaveBeenCalledWith({
      data: {
        changedBy: "admin-1",
        notes: "source:admin_orders; from:PROCESSING; to:SHIPPED",
        orderId: 153,
        status: "SHIPPED",
      },
    });
    expect(body.success).toBe(true);
    expect(body.order.status).toBe("SHIPPED");
    expect(body.order.history.at(-1)).toEqual({
      actorLabel: "Operacao admin",
      createdAt: "2026-03-17T12:00:00.000Z",
      description: "Atualizacao operacional registrada pelo painel admin.",
      id: "history-2",
      isFallback: false,
      status: "SHIPPED",
    });
  });
});
