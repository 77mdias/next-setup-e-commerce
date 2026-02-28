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

  it("returns order data for the owner session", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });
    mockDb.order.findFirst.mockResolvedValue({
      id: 321,
      userId: "user-owner",
      stripePaymentId: "cs_owner_1",
      status: "PENDING",
      paymentStatus: "PENDING",
      items: [],
      store: { id: "store-1", name: "NeXT Store", slug: "nextstore" },
      address: null,
      payments: [],
    });

    const { request, params } = createRequest("cs_owner_1");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe(321);
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
    mockDb.order.findFirst.mockResolvedValue({
      id: 999,
      userId: "user-owner",
      stripePaymentId: "cs_owner_1",
      status: "PENDING",
      paymentStatus: "PENDING",
      items: [],
      store: { id: "store-1", name: "NeXT Store", slug: "nextstore" },
      address: null,
      payments: [],
    });

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
