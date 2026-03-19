import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock Prisma db
// ---------------------------------------------------------------------------

const { mockDb, mockTx } = vi.hoisted(() => {
  const mockTx = {
    $executeRaw: vi.fn(),
    inventory: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockReservation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const mockDb = {
    $transaction: vi.fn((fn: unknown) => {
      if (typeof fn === "function") return fn(mockTx);
      // For array of promises (batch $transaction)
      return Promise.all(fn as Promise<unknown>[]);
    }),
    $executeRaw: vi.fn(),
    inventory: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockReservation: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  return { mockDb, mockTx };
});

vi.mock("@/lib/prisma", () => ({ db: mockDb }));

import {
  confirmReservation,
  confirmReservationsByOrder,
  createReservation,
  expireStaleReservations,
  getActiveReservationsByOrder,
  releaseReservation,
  releaseReservationsByOrder,
} from "@/lib/stock-reservation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInventory(
  overrides: Partial<{
    quantity: number;
    reserved: number;
    minStock: number;
  }> = {},
) {
  return {
    id: "inv-1",
    quantity: overrides.quantity ?? 100,
    reserved: overrides.reserved ?? 0,
    minStock: overrides.minStock ?? 0,
  };
}

function makeReservation(
  overrides: Partial<{
    status: string;
    quantity: number;
    inventoryId: string;
  }> = {},
) {
  return {
    id: "res-1",
    inventoryId: overrides.inventoryId ?? "inv-1",
    orderId: 1,
    orderItemId: "item-1",
    quantity: overrides.quantity ?? 5,
    status: overrides.status ?? "ACTIVE",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// createReservation
// ---------------------------------------------------------------------------

describe("createReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when stock is sufficient", async () => {
    mockTx.$executeRaw.mockResolvedValue(1);
    const created = makeReservation({ quantity: 5 });
    mockTx.stockReservation.create.mockResolvedValue(created);

    const result = await createReservation({
      inventoryId: "inv-1",
      quantity: 5,
      orderId: 1,
      orderItemId: "item-1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.reservation.quantity).toBe(5);
    }
    expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it("returns failure when stock is insufficient", async () => {
    const inventory = makeInventory({ quantity: 5, reserved: 3, minStock: 0 });
    mockTx.$executeRaw.mockResolvedValue(0);
    mockTx.inventory.findUnique.mockResolvedValue(inventory);

    const result = await createReservation({
      inventoryId: "inv-1",
      quantity: 5,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/insufficient stock/i);
    }
    expect(mockTx.stockReservation.create).not.toHaveBeenCalled();
  });

  it("returns failure when reservation would breach minStock", async () => {
    const inventory = makeInventory({ quantity: 10, reserved: 0, minStock: 8 });
    mockTx.$executeRaw.mockResolvedValue(0);
    mockTx.inventory.findUnique.mockResolvedValue(inventory);

    const result = await createReservation({
      inventoryId: "inv-1",
      quantity: 5,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/minimum stock/i);
    }
  });

  it("returns failure when inventory is not found", async () => {
    mockTx.$executeRaw.mockResolvedValue(0);
    mockTx.inventory.findUnique.mockResolvedValue(null);

    const result = await createReservation({
      inventoryId: "missing",
      quantity: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/not found/i);
    }
  });

  it("respects custom TTL when creating reservation", async () => {
    mockTx.$executeRaw.mockResolvedValue(1);
    const created = makeReservation({ quantity: 2 });
    mockTx.stockReservation.create.mockResolvedValue(created);

    await createReservation({
      inventoryId: "inv-1",
      quantity: 2,
      ttlMinutes: 60,
    });

    const call = mockTx.stockReservation.create.mock.calls[0][0];
    const expiresAt: Date = call.data.expiresAt;
    const diffMinutes = (expiresAt.getTime() - Date.now()) / 1000 / 60;
    expect(diffMinutes).toBeGreaterThan(55);
    expect(diffMinutes).toBeLessThan(65);
  });

  it("allows at most one concurrent reservation for the last unit", async () => {
    let reserved = 0;

    const concurrentDb = {
      $executeRaw: vi.fn(async (...args: unknown[]) => {
        const qty = args.find((value) => typeof value === "number");

        if (typeof qty !== "number") {
          throw new Error("Atomic reservation must receive a numeric quantity");
        }

        if (1 - reserved >= qty) {
          reserved += qty;
          return 1;
        }

        return 0;
      }),
      inventory: {
        findUnique: vi.fn(async () => ({
          id: "inv-1",
          quantity: 1,
          reserved,
          minStock: 0,
        })),
      },
      stockReservation: {
        create: vi.fn(async ({ data }: { data: { quantity: number } }) => ({
          ...makeReservation({ quantity: data.quantity }),
          quantity: data.quantity,
        })),
      },
    };

    const [first, second] = await Promise.all([
      createReservation(
        {
          inventoryId: "inv-1",
          quantity: 1,
          orderId: 1,
          orderItemId: "item-1",
        },
        concurrentDb as never,
      ),
      createReservation(
        {
          inventoryId: "inv-1",
          quantity: 1,
          orderId: 2,
          orderItemId: "item-2",
        },
        concurrentDb as never,
      ),
    ]);

    expect([first, second].filter((result) => result.success)).toHaveLength(1);
    expect([first, second].filter((result) => !result.success)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// releaseReservation
// ---------------------------------------------------------------------------

describe("releaseReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("releases an ACTIVE reservation and decrements reserved", async () => {
    const reservation = makeReservation({ status: "ACTIVE", quantity: 5 });
    mockTx.stockReservation.findUnique.mockResolvedValue(reservation);
    mockTx.stockReservation.update.mockResolvedValue({});
    mockTx.inventory.update.mockResolvedValue({});

    const result = await releaseReservation("res-1");

    expect(result).toBe(true);
    expect(mockTx.stockReservation.update).toHaveBeenCalledWith({
      where: { id: "res-1" },
      data: { status: "RELEASED" },
    });
    expect(mockTx.inventory.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { reserved: { decrement: 5 } },
    });
  });

  it("returns true (idempotent) when reservation is already RELEASED", async () => {
    const reservation = makeReservation({ status: "RELEASED" });
    mockTx.stockReservation.findUnique.mockResolvedValue(reservation);

    const result = await releaseReservation("res-1");

    expect(result).toBe(true);
    expect(mockTx.stockReservation.update).not.toHaveBeenCalled();
  });

  it("returns false when reservation does not exist", async () => {
    mockTx.stockReservation.findUnique.mockResolvedValue(null);

    const result = await releaseReservation("missing");

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// confirmReservation
// ---------------------------------------------------------------------------

describe("confirmReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms an ACTIVE reservation", async () => {
    const reservation = makeReservation({ status: "ACTIVE" });
    mockDb.stockReservation.findUnique.mockResolvedValue(reservation);
    mockDb.stockReservation.update.mockResolvedValue({});

    const result = await confirmReservation("res-1");

    expect(result).toBe(true);
    expect(mockDb.stockReservation.update).toHaveBeenCalledWith({
      where: { id: "res-1" },
      data: { status: "CONFIRMED" },
    });
  });

  it("returns false for a non-ACTIVE reservation", async () => {
    mockDb.stockReservation.findUnique.mockResolvedValue(
      makeReservation({ status: "EXPIRED" }),
    );

    const result = await confirmReservation("res-1");

    expect(result).toBe(false);
    expect(mockDb.stockReservation.update).not.toHaveBeenCalled();
  });

  it("returns false when reservation does not exist", async () => {
    mockDb.stockReservation.findUnique.mockResolvedValue(null);

    const result = await confirmReservation("missing");

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// expireStaleReservations
// ---------------------------------------------------------------------------

describe("expireStaleReservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.$transaction.mockImplementation((arg: unknown) => {
      if (typeof arg === "function") return arg(mockTx);
      return Promise.all(arg as Promise<unknown>[]);
    });
  });

  it("returns zero counts when no stale reservations exist", async () => {
    mockDb.stockReservation.findMany.mockResolvedValue([]);

    const result = await expireStaleReservations();

    expect(result.expiredCount).toBe(0);
    expect(result.reservationIds).toHaveLength(0);
  });

  it("expires stale reservations and decrements inventory.reserved", async () => {
    const stale = [
      { id: "res-1", inventoryId: "inv-1", quantity: 3 },
      { id: "res-2", inventoryId: "inv-1", quantity: 2 },
      { id: "res-3", inventoryId: "inv-2", quantity: 1 },
    ];
    mockDb.stockReservation.findMany.mockResolvedValue(stale);
    mockDb.stockReservation.update.mockResolvedValue({});
    mockDb.inventory.update.mockResolvedValue({});

    const result = await expireStaleReservations();

    expect(result.expiredCount).toBe(3);
    expect(result.reservationIds).toEqual(["res-1", "res-2", "res-3"]);
  });
});

// ---------------------------------------------------------------------------
// getActiveReservationsByOrder
// ---------------------------------------------------------------------------

describe("getActiveReservationsByOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active reservations for an order", async () => {
    const reservations = [makeReservation(), makeReservation()];
    mockDb.stockReservation.findMany.mockResolvedValue(reservations);

    const result = await getActiveReservationsByOrder(1);

    expect(result).toHaveLength(2);
    expect(mockDb.stockReservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderId: 1, status: "ACTIVE" } }),
    );
  });
});

// ---------------------------------------------------------------------------
// releaseReservationsByOrder
// ---------------------------------------------------------------------------

describe("releaseReservationsByOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.$transaction.mockImplementation((arg: unknown) => {
      if (typeof arg === "function") {
        return arg(mockTx);
      }

      return Promise.all(arg as Promise<unknown>[]);
    });
  });

  it("returns 0 when there are no active reservations", async () => {
    mockTx.stockReservation.findMany.mockResolvedValue([]);

    const result = await releaseReservationsByOrder(99);

    expect(result).toBe(0);
    expect(mockTx.stockReservation.updateMany).not.toHaveBeenCalled();
  });

  it("releases all active reservations for an order", async () => {
    const active = [
      { id: "res-1", inventoryId: "inv-1", quantity: 3 },
      { id: "res-2", inventoryId: "inv-2", quantity: 7 },
    ];
    mockTx.stockReservation.findMany.mockResolvedValue(active);
    mockTx.stockReservation.updateMany.mockResolvedValue({ count: 2 });
    mockTx.inventory.update.mockResolvedValue({});

    const result = await releaseReservationsByOrder(1);

    expect(result).toBe(2);
    expect(mockTx.stockReservation.updateMany).toHaveBeenCalledWith({
      where: { orderId: 1, status: "ACTIVE" },
      data: { status: "RELEASED" },
    });
  });
});

// ---------------------------------------------------------------------------
// confirmReservationsByOrder
// ---------------------------------------------------------------------------

describe("confirmReservationsByOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms all active reservations for an order and returns count", async () => {
    mockDb.stockReservation.updateMany.mockResolvedValue({ count: 3 });

    const result = await confirmReservationsByOrder(1);

    expect(result).toBe(3);
    expect(mockDb.stockReservation.updateMany).toHaveBeenCalledWith({
      where: { orderId: 1, status: "ACTIVE" },
      data: { status: "CONFIRMED" },
    });
  });
});
