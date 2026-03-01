import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetServerSession, mockDb } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockDb: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
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

import { GET } from "@/app/api/orders/user/route";

function createRequest(query = "") {
  const suffix = query ? `?${query}` : "";
  return new NextRequest(`http://localhost:3000/api/orders/user${suffix}`, {
    method: "GET",
  });
}

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    userId: "user-owner",
    status: "PAID",
    paymentStatus: "PAID",
    total: 300,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T12:00:00.000Z"),
    cancelledAt: null,
    cancelReason: null,
    items: [],
    store: {
      id: "store-1",
      name: "NeXT Store",
      slug: "nextstore",
    },
    payments: [],
    statusHistory: [
      {
        id: "hist-1",
        status: "PAID",
        notes: "source:webhook",
        changedBy: null,
        createdAt: new Date("2026-03-01T11:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

describe("GET /api/orders/user integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for anonymous requests", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Usuário não autenticado");
    expect(mockDb.order.findMany).not.toHaveBeenCalled();
  });

  it("returns paginated orders with normalized statusHistory and legacy fallback", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-owner" },
    });

    mockDb.order.findMany.mockResolvedValue([
      createOrder({ id: 100 }),
      createOrder({
        id: 101,
        status: "PROCESSING",
        updatedAt: new Date("2026-03-01T15:00:00.000Z"),
        statusHistory: [],
      }),
    ]);
    mockDb.order.count.mockResolvedValue(2);

    const response = await GET(createRequest("status=ALL&page=1&limit=6"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagination).toMatchObject({
      page: 1,
      limit: 6,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });

    expect(body.orders).toHaveLength(2);
    expect(body.orders[0].statusHistory).toEqual([
      expect.objectContaining({
        status: "PAID",
        isFallback: false,
      }),
    ]);
    expect(body.orders[1].statusHistory).toEqual([
      expect.objectContaining({
        status: "PROCESSING",
        isFallback: true,
      }),
    ]);
    expect(body.orders[1].statusHistory[0].notes).toContain(
      "reason:legacy_missing_history",
    );

    expect(mockDb.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-owner",
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
});
