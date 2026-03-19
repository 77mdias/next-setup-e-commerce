import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";
import {
  RESERVATION_TTL_MINUTES,
  type ExpiredReservationsResult,
  type ReservationInput,
  type ReservationRecord,
  type ReservationResult,
} from "@/lib/stock-reservation-contract";

type ReservationMutationClient = typeof db | Prisma.TransactionClient;

async function createReservationRecord(
  database: ReservationMutationClient,
  input: ReservationInput,
): Promise<ReservationResult> {
  const { inventoryId, quantity, orderId, orderItemId, ttlMinutes } = input;
  const ttl = ttlMinutes ?? RESERVATION_TTL_MINUTES;
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

  // AIDEV-CRITICAL: reserva e incremento de `inventory.reserved` precisam
  // acontecer como uma única mutação atômica para evitar oversell concorrente.
  const updatedRows = Number(
    await database.$executeRaw`
      UPDATE "inventory"
      SET "reserved" = "reserved" + ${quantity},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${inventoryId}
        AND ("quantity" - "reserved") >= ${quantity}
        AND ("quantity" - "reserved" - ${quantity}) >= "minStock"
    `,
  );

  if (updatedRows === 0) {
    const inventory = await database.inventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, quantity: true, reserved: true, minStock: true },
    });

    if (!inventory) {
      return { success: false, reason: "Inventory record not found" };
    }

    const available = inventory.quantity - inventory.reserved;
    if (quantity > available) {
      return {
        success: false,
        reason: `Insufficient stock: ${available} available, ${quantity} requested`,
      };
    }

    const remaining = available - quantity;
    if (remaining < inventory.minStock) {
      return {
        success: false,
        reason: `Reservation would breach minimum stock threshold (minStock: ${inventory.minStock})`,
      };
    }

    return {
      success: false,
      reason: "Inventory reservation failed due to a concurrent update",
    };
  }

  const reservation = await database.stockReservation.create({
    data: {
      inventoryId,
      orderId: orderId ?? null,
      orderItemId: orderItemId ?? null,
      quantity,
      status: "ACTIVE",
      expiresAt,
    },
  });

  return { success: true, reservation: reservation as ReservationRecord };
}

/**
 * Creates a stock reservation for a given inventory record.
 *
 * Validates that the requested quantity is available (quantity - reserved >= qty),
 * then atomically increments Inventory.reserved and inserts a StockReservation row
 * with an expiry based on the configured TTL.
 */
export async function createReservation(
  input: ReservationInput,
  database?: ReservationMutationClient,
): Promise<ReservationResult> {
  if (database) {
    return createReservationRecord(database, input);
  }

  return db.$transaction((tx) => createReservationRecord(tx, input));
}

/**
 * Releases an ACTIVE reservation, decrementing Inventory.reserved.
 * Idempotent: returns true if the reservation was already released/expired.
 */
export async function releaseReservation(
  reservationId: string,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const reservation = await tx.stockReservation.findUnique({
      where: { id: reservationId },
      select: { id: true, inventoryId: true, quantity: true, status: true },
    });

    if (!reservation) return false;
    if (reservation.status !== "ACTIVE") return true;

    await Promise.all([
      tx.stockReservation.update({
        where: { id: reservationId },
        data: { status: "RELEASED" },
      }),
      tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: { reserved: { decrement: reservation.quantity } },
      }),
    ]);

    return true;
  });
}

/**
 * Marks an ACTIVE reservation as CONFIRMED (e.g. after successful payment).
 * Does NOT decrement Inventory.reserved — that is handled separately when
 * stock is actually deducted (OUT movement) upon order fulfilment.
 */
export async function confirmReservation(
  reservationId: string,
): Promise<boolean> {
  const reservation = await db.stockReservation.findUnique({
    where: { id: reservationId },
    select: { id: true, status: true },
  });

  if (!reservation || reservation.status !== "ACTIVE") return false;

  await db.stockReservation.update({
    where: { id: reservationId },
    data: { status: "CONFIRMED" },
  });

  return true;
}

/**
 * Finds all ACTIVE reservations past their expiresAt, marks them EXPIRED,
 * and decrements the corresponding Inventory.reserved counters.
 *
 * Intended to be called by a scheduled job or on-demand cleanup routine.
 */
export async function expireStaleReservations(): Promise<ExpiredReservationsResult> {
  const now = new Date();

  const stale = await db.stockReservation.findMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    select: { id: true, inventoryId: true, quantity: true },
  });

  if (stale.length === 0) {
    return { expiredCount: 0, reservationIds: [] };
  }

  await db.$transaction(
    stale.map((r) =>
      db.stockReservation.update({
        where: { id: r.id },
        data: { status: "EXPIRED" },
      }),
    ),
  );

  // Decrement reserved counts per inventory in aggregate
  const byInventory = stale.reduce<Record<string, number>>((acc, r) => {
    acc[r.inventoryId] = (acc[r.inventoryId] ?? 0) + r.quantity;
    return acc;
  }, {});

  await db.$transaction(
    Object.entries(byInventory).map(([inventoryId, qty]) =>
      db.inventory.update({
        where: { id: inventoryId },
        data: { reserved: { decrement: qty } },
      }),
    ),
  );

  return {
    expiredCount: stale.length,
    reservationIds: stale.map((r) => r.id),
  };
}

/**
 * Returns all active reservations linked to a given order.
 */
export async function getActiveReservationsByOrder(
  orderId: number,
): Promise<ReservationRecord[]> {
  const rows = await db.stockReservation.findMany({
    where: { orderId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });
  return rows as ReservationRecord[];
}

/**
 * Releases all ACTIVE reservations for a given order (e.g. on cancellation).
 */
export async function releaseReservationsByOrder(
  orderId: number,
  database?: ReservationMutationClient,
): Promise<number> {
  if (!database) {
    return db.$transaction((tx) => releaseReservationsByOrder(orderId, tx));
  }

  const active = await database.stockReservation.findMany({
    where: { orderId, status: "ACTIVE" },
    select: { id: true, inventoryId: true, quantity: true },
  });

  if (active.length === 0) return 0;

  const byInventory = active.reduce<Record<string, number>>((acc, r) => {
    acc[r.inventoryId] = (acc[r.inventoryId] ?? 0) + r.quantity;
    return acc;
  }, {});

  await database.stockReservation.updateMany({
    where: { orderId, status: "ACTIVE" },
    data: { status: "RELEASED" },
  });

  await Promise.all(
    Object.entries(byInventory).map(([inventoryId, qty]) =>
      database.inventory.update({
        where: { id: inventoryId },
        data: { reserved: { decrement: qty } },
      }),
    ),
  );

  return active.length;
}

/**
 * Confirms all ACTIVE reservations for a given order (e.g. after payment success).
 */
export async function confirmReservationsByOrder(
  orderId: number,
  database?: ReservationMutationClient,
): Promise<number> {
  const client = database ?? db;
  const result = await client.stockReservation.updateMany({
    where: { orderId, status: "ACTIVE" },
    data: { status: "CONFIRMED" },
  });
  return result.count;
}
