import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetServerSession, mockDb } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockDb: {
    order: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
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

import { GET } from "@/app/api/orders/[orderId]/route";

function createRequest(orderId: string) {
  return {
    request: new NextRequest(`http://localhost:3000/api/orders/${orderId}`, {
      method: "GET",
    }),
    params: Promise.resolve({ orderId }),
  };
}

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 123,
    userId: "user-owner",
    status: "SHIPPED",
    paymentStatus: "PAID",
    total: 199.9,
    customerName: "Customer",
    customerEmail: "customer@example.com",
    customerPhone: "11999999999",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T14:00:00.000Z"),
    cancelledAt: null,
    cancelReason: null,
    address: {
      street: "Rua A",
      number: "100",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
    },
    store: {
      id: "store-1",
      name: "NeXT Store",
      slug: "nextstore",
    },
    items: [
      {
        id: "item-1",
        productName: "Notebook",
        quantity: 1,
        unitPrice: 199.9,
        totalPrice: 199.9,
        productImage: "https://cdn.example.com/notebook.png",
        product: null,
      },
    ],
    payments: [
      {
        id: "payment-1",
        status: "PAID",
        amount: 199.9,
        paidAt: new Date("2026-03-01T14:00:00.000Z"),
      },
    ],
    statusHistory: [
      {
        id: "hist-2",
        status: "PROCESSING",
        notes: "source:webhook",
        changedBy: null,
        createdAt: new Date("2026-03-01T13:00:00.000Z"),
      },
      {
        id: "hist-1",
        status: "PENDING",
        notes: "source:checkout",
        changedBy: "user-owner",
        createdAt: new Date("2026-03-01T10:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

describe("GET /api/orders/[orderId] integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.order.updateMany.mockResolvedValue({ count: 0 });
  });

  it("returns 401 when request is anonymous", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { request, params } = createRequest("123");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Não autorizado");
    expect(mockDb.order.findFirst).not.toHaveBeenCalled();
  });

  it("returns order details with stable shape and normalized statusHistory", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockResolvedValue(createOrder());

    const { request, params } = createRequest("123");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: 123,
      status: "SHIPPED",
      paymentStatus: "PAID",
      customerAddress: "Rua A, 100 - Centro, Sao Paulo - SP",
      payments: [
        {
          id: "payment-1",
          status: "PAID",
          amount: 199.9,
          paidAt: "2026-03-01T14:00:00.000Z",
        },
      ],
      items: [
        {
          id: "item-1",
          productName: "Notebook",
        },
      ],
    });

    expect(
      body.statusHistory.map((entry: { status: string }) => entry.status),
    ).toEqual(["PENDING", "PROCESSING", "SHIPPED"]);
    expect(body.statusHistory[2].isFallback).toBe(true);
    expect(body.statusHistory[2].notes).toContain(
      "reason:state_snapshot_mismatch",
    );

    expect(mockDb.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 123,
          userId: "user-owner",
        },
      }),
    );
  });

  it("returns 400 when orderId is invalid", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });

    const { request, params } = createRequest("abc-123");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("ID do pedido inválido");
    expect(mockDb.order.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when order is not found", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockResolvedValue(null);

    const { request, params } = createRequest("999");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Pedido não encontrado");
    expect(mockDb.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 999,
          userId: "user-owner",
        },
      }),
    );
  });

  it("returns 404 when authenticated user is not the owner", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-attacker" },
    });
    mockDb.order.findFirst.mockResolvedValue(null);

    const { request, params } = createRequest("123");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Pedido não encontrado");
    expect(mockDb.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 123,
          userId: "user-attacker",
        },
      }),
    );
  });

  it("links eligible legacy order without userId using customerEmail fallback", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner", email: "Customer@example.com" },
    });
    mockDb.order.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createOrder());
    mockDb.order.updateMany.mockResolvedValue({ count: 1 });

    const { request, params } = createRequest("123");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe(123);
    expect(mockDb.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 123,
        userId: null,
        customerEmail: {
          equals: "customer@example.com",
          mode: "insensitive",
        },
      },
      data: {
        userId: "user-owner",
      },
    });
  });

  it("keeps 404 and logs manual review when legacy order cannot be linked", async () => {
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner", email: "owner@example.com" },
    });
    mockDb.order.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 123,
      customerEmail: "legacy@example.com",
    });
    mockDb.order.updateMany.mockResolvedValue({ count: 0 });

    const { request, params } = createRequest("123");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Pedido não encontrado");
    expect(warnSpy).toHaveBeenCalledWith(
      "[orders][legacy-ownership]",
      expect.objectContaining({
        orderId: 123,
        sessionUserId: "user-owner",
        reason: "email_mismatch_or_unmapped",
      }),
    );

    warnSpy.mockRestore();
  });
});
