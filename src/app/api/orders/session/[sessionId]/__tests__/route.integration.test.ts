import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetServerSession, mockDb } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockDb: {
    order: {
      findFirst: vi.fn(),
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

import { GET } from "@/app/api/orders/session/[sessionId]/route";

const mutableEnv = process.env as Record<string, string | undefined>;

function createRequest(sessionId: string) {
  return {
    request: new NextRequest(
      `http://localhost:3000/api/orders/session/${sessionId}`,
      {
        method: "GET",
      },
    ),
    params: Promise.resolve({ sessionId }),
  };
}

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 321,
    userId: "user-owner",
    stripePaymentId: "cs_owner_1",
    status: "PENDING",
    paymentStatus: "PENDING",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
    cancelledAt: null,
    cancelReason: null,
    items: [],
    store: { id: "store-1", name: "NeXT Store", slug: "nextstore" },
    address: null,
    payments: [],
    statusHistory: [
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

describe("GET /api/orders/session/[sessionId] integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when request is anonymous", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { request, params } = createRequest("cs_test_anon");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Não autorizado");
    expect(mockDb.order.findFirst).not.toHaveBeenCalled();
  });

  it("returns 400 when sessionId is empty after normalization", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });

    const { request, params } = createRequest("   ");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("ID da sessão é obrigatório");
    expect(mockDb.order.findFirst).not.toHaveBeenCalled();
  });

  it("returns order data for the owner session with normalized statusHistory", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockResolvedValue(createOrder());

    const { request, params } = createRequest("cs_owner_1");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe(321);
    expect(body.statusHistory).toEqual([
      expect.objectContaining({
        id: "hist-1",
        status: "PENDING",
        isFallback: false,
      }),
    ]);

    expect(mockDb.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-owner",
          OR: [
            { stripeCheckoutSessionId: "cs_owner_1" },
            { stripePaymentId: "cs_owner_1" },
          ],
        },
        include: expect.objectContaining({
          statusHistory: {
            select: {
              id: true,
              status: true,
              notes: true,
              changedBy: true,
              createdAt: true,
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          },
        }),
      }),
    );
  });

  it("returns persisted webhook history as-is when backend state and history are consistent", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockResolvedValue(
      createOrder({
        status: "PAID",
        paymentStatus: "PAID",
        updatedAt: new Date("2026-03-01T14:10:00.000Z"),
        statusHistory: [
          {
            id: "hist-1",
            status: "PENDING",
            notes: "source:checkout",
            changedBy: "user-owner",
            createdAt: new Date("2026-03-01T10:00:00.000Z"),
          },
          {
            id: "hist-2",
            status: "PAID",
            notes:
              "source:webhook; eventType:checkout.session.completed; eventId:evt_paid_321",
            changedBy: null,
            createdAt: new Date("2026-03-01T14:00:00.000Z"),
          },
        ],
      }),
    );

    const { request, params } = createRequest("cs_owner_1");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("PAID");
    expect(body.paymentStatus).toBe("PAID");
    expect(
      body.statusHistory.map((entry: { status: string }) => entry.status),
    ).toEqual(["PENDING", "PAID"]);
    expect(
      body.statusHistory.every(
        (entry: { isFallback: boolean }) => !entry.isFallback,
      ),
    ).toBe(true);
    expect(body.statusHistory[1].notes).toContain("source:webhook");
    expect(body.statusHistory[1].notes).toContain("eventId:evt_paid_321");
  });

  it("sorts statusHistory and appends fallback snapshot when current state diverges", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockResolvedValue(
      createOrder({
        status: "PAID",
        updatedAt: new Date("2026-03-01T12:00:00.000Z"),
        statusHistory: [
          {
            id: "hist-2",
            status: "PAYMENT_PENDING",
            notes: "source:webhook",
            changedBy: null,
            createdAt: new Date("2026-03-01T11:00:00.000Z"),
          },
          {
            id: "hist-1",
            status: "PENDING",
            notes: "source:checkout",
            changedBy: "user-owner",
            createdAt: new Date("2026-03-01T10:00:00.000Z"),
          },
        ],
      }),
    );

    const { request, params } = createRequest("cs_owner_1");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(
      body.statusHistory.map((entry: { status: string }) => entry.status),
    ).toEqual(["PENDING", "PAYMENT_PENDING", "PAID"]);
    expect(body.statusHistory[2].isFallback).toBe(true);
    expect(body.statusHistory[2].notes).toContain(
      "reason:state_snapshot_mismatch",
    );
  });

  it("creates fallback history for legacy orders without persisted statusHistory", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockResolvedValue(
      createOrder({
        status: "PROCESSING",
        updatedAt: new Date("2026-03-01T14:00:00.000Z"),
        statusHistory: [],
      }),
    );

    const { request, params } = createRequest("cs_owner_1");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.statusHistory).toEqual([
      expect.objectContaining({
        status: "PROCESSING",
        isFallback: true,
      }),
    ]);
    expect(body.statusHistory[0].notes).toContain(
      "reason:legacy_missing_history",
    );
  });

  it("returns 404 for authenticated user that is not the order owner", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-attacker" },
    });
    mockDb.order.findFirst.mockResolvedValue(null);

    const { request, params } = createRequest("cs_owner_1");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Pedido não encontrado");
    expect(mockDb.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-attacker",
          OR: [
            { stripeCheckoutSessionId: "cs_owner_1" },
            { stripePaymentId: "cs_owner_1" },
          ],
        },
      }),
    );
  });

  it("normalizes sessionId before querying order ownership", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockResolvedValue(createOrder());

    const { request, params } = createRequest("  cs_owner_1  ");
    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(mockDb.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-owner",
          OR: [
            { stripeCheckoutSessionId: "cs_owner_1" },
            { stripePaymentId: "cs_owner_1" },
          ],
        },
      }),
    );
  });

  it("returns 500 with sanitized logs in production", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mutableEnv.NODE_ENV = "production";
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockRejectedValue(
      new Error("Falha ao consultar cs_owner_1 para user-owner"),
    );

    try {
      const { request, params } = createRequest("cs_owner_1");
      const response = await GET(request, { params });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Erro interno do servidor");
      expect(errorSpy).toHaveBeenCalledWith("Erro ao buscar pedido por sessão");

      const serializedLogCalls = JSON.stringify(errorSpy.mock.calls);
      expect(serializedLogCalls).not.toContain("cs_owner_1");
      expect(serializedLogCalls).not.toContain("user-owner");
    } finally {
      mutableEnv.NODE_ENV = previousNodeEnv;
      errorSpy.mockRestore();
    }
  });
});
