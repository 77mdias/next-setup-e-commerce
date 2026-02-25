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
    expect(body.error).toBe("Usuário não autenticado");
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
          stripePaymentId: "cs_owner_1",
          userId: "user-owner",
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
          stripePaymentId: "cs_owner_1",
          userId: "user-attacker",
        },
      }),
    );
  });
});
