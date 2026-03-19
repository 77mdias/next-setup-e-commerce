import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";
import {
  type ExpiredReservationsResult,
  type ReservationCleanupResult,
  type ReservationCleanupSnapshot,
  type ReservationInput,
  type ReservationRecord,
  type ReservationResult,
  resolveReservationTtlMinutes,
} from "@/lib/stock-reservation-contract";

type ReservationMutationClient = typeof db | Prisma.TransactionClient;
type ReservationMutationRow = {
  id: string;
  inventoryId: string;
  quantity: number;
};

function normalizeReservationMutationRows(
  rows: ReservationMutationRow[],
): ReservationMutationRow[] {
  return rows.map((row) => ({
    id: row.id,
    inventoryId: row.inventoryId,
    quantity: Number(row.quantity),
  }));
}

function aggregateInventoryDeltas(rows: ReservationMutationRow[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.inventoryId] = (acc[row.inventoryId] ?? 0) + row.quantity;
    return acc;
  }, {});
}

async function decrementReservedCounters(
  database: ReservationMutationClient,
  rows: ReservationMutationRow[],
) {
  if (rows.length === 0) {
    return;
  }

  const deltas = Object.entries(aggregateInventoryDeltas(rows));

  await database.$executeRaw(
    Prisma.sql`
      WITH "reservation_deltas" ("inventoryId", "quantity") AS (
        VALUES ${Prisma.join(
          deltas.map(
            ([inventoryId, quantity]) =>
              Prisma.sql`(${inventoryId}, ${quantity})`,
          ),
        )}
      )
      UPDATE "inventory" AS i
      SET "reserved" = GREATEST(i."reserved" - d."quantity", 0),
          "updatedAt" = CURRENT_TIMESTAMP
      FROM "reservation_deltas" AS d
      WHERE i."id" = d."inventoryId"
    `,
  );
}

async function expireActiveReservations(
  database: ReservationMutationClient,
  referenceDate: Date,
) {
  const expiredRows = await database.$queryRaw<ReservationMutationRow[]>(
    Prisma.sql`
      WITH "expired_rows" AS (
        UPDATE "stock_reservations" AS sr
        SET "status" = 'EXPIRED'::"StockReservationStatus",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE sr."status" = 'ACTIVE'::"StockReservationStatus"
          AND sr."expiresAt" < ${referenceDate}
        RETURNING sr."id", sr."inventoryId", sr."quantity"
      )
      SELECT "id", "inventoryId", "quantity"
      FROM "expired_rows"
    `,
  );

  return normalizeReservationMutationRows(expiredRows);
}

async function releaseAbandonedOrFailedReservations(
  database: ReservationMutationClient,
  referenceDate: Date,
) {
  const releasedRows = await database.$queryRaw<ReservationMutationRow[]>(
    Prisma.sql`
      WITH "released_rows" AS (
        UPDATE "stock_reservations" AS sr
        SET "status" = 'RELEASED'::"StockReservationStatus",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE sr."status" = 'ACTIVE'::"StockReservationStatus"
          AND sr."expiresAt" >= ${referenceDate}
          AND (
            sr."orderId" IS NULL
            OR EXISTS (
              SELECT 1
              FROM "orders" AS o
              WHERE o."id" = sr."orderId"
                AND (
                  o."status" = 'CANCELLED'::"OrderStatus"
                  OR o."paymentStatus" IN (
                    'FAILED'::"PaymentStatus",
                    'CANCELLED'::"PaymentStatus"
                  )
                )
            )
          )
        RETURNING sr."id", sr."inventoryId", sr."quantity"
      )
      SELECT "id", "inventoryId", "quantity"
      FROM "released_rows"
    `,
  );

  return normalizeReservationMutationRows(releasedRows);
}

async function buildCleanupSnapshot(
  database: ReservationMutationClient,
  referenceDate: Date,
): Promise<ReservationCleanupSnapshot> {
  const [expiredCount, abandonedOrFailedCount] = await Promise.all([
    database.stockReservation.count({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: referenceDate },
      },
    }),
    database.stockReservation.count({
      where: {
        status: "ACTIVE",
        expiresAt: { gte: referenceDate },
        OR: [
          { orderId: null },
          {
            order: {
              is: {
                OR: [
                  { status: "CANCELLED" },
                  { paymentStatus: { in: ["FAILED", "CANCELLED"] } },
                ],
              },
            },
          },
        ],
      },
    }),
  ]);

  return {
    referenceDate,
    expiredCount,
    abandonedOrFailedCount,
  };
}

async function createReservationRecord(
  database: ReservationMutationClient,
  input: ReservationInput,
): Promise<ReservationResult> {
  const { inventoryId, quantity, orderId, orderItemId, ttlMinutes } = input;
  const ttl = ttlMinutes ?? resolveReservationTtlMinutes();
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
  const referenceDate = new Date();

  return db.$transaction(async (tx) => {
    const expiredRows = await expireActiveReservations(tx, referenceDate);
    await decrementReservedCounters(tx, expiredRows);

    return {
      expiredCount: expiredRows.length,
      reservationIds: expiredRows.map((row) => row.id),
    };
  });
}

export async function inspectReservationCleanup(
  referenceDate: Date = new Date(),
  database?: ReservationMutationClient,
): Promise<ReservationCleanupSnapshot> {
  const client = database ?? db;
  return buildCleanupSnapshot(client, referenceDate);
}

/**
 * AIDEV-CRITICAL: limpeza de reservas precisa ser determinística e idempotente.
 * A mutação troca status + baixa de `inventory.reserved` em transação única
 * para evitar dupla liberação sob concorrência.
 */
export async function cleanupAbandonedReservations(params?: {
  referenceDate?: Date;
  database?: ReservationMutationClient;
}): Promise<ReservationCleanupResult> {
  const referenceDate = params?.referenceDate ?? new Date();

  const executeCleanup = async (
    database: ReservationMutationClient,
  ): Promise<ReservationCleanupResult> => {
    const expiredRows = await expireActiveReservations(database, referenceDate);
    const releasedRows = await releaseAbandonedOrFailedReservations(
      database,
      referenceDate,
    );

    await decrementReservedCounters(database, [
      ...expiredRows,
      ...releasedRows,
    ]);

    return {
      referenceDate,
      expiredCount: expiredRows.length,
      releasedCount: releasedRows.length,
      expiredReservationIds: expiredRows.map((row) => row.id),
      releasedReservationIds: releasedRows.map((row) => row.id),
    };
  };

  if (params?.database) {
    return executeCleanup(params.database);
  }

  return db.$transaction((tx) => executeCleanup(tx));
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
