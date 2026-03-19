import { Prisma, PrismaClient } from "@prisma/client";

type ReservationMutationRow = {
  id: string;
  inventoryId: string;
  quantity: number;
};

type CleanupOptions = {
  apply: boolean;
  help: boolean;
};

const prisma = new PrismaClient();

function parseArgs(argv: string[]): CleanupOptions {
  const options: CleanupOptions = {
    apply: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`Argumento nao suportado: ${arg}`);
  }

  return options;
}

function printUsage() {
  console.log(`Limpeza de reservas de inventario expiradas/abandonadas

Uso:
  npx ts-node scripts/inventory-reservations-cleanup.ts [--apply]

Opcoes:
  --apply    Executa cleanup no banco. Sem essa flag roda em dry-run.
  --help,-h  Exibe esta ajuda.
`);
}

function normalizeRows(
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

async function countCleanupCandidates(referenceDate: Date) {
  const [expiredCount, abandonedOrFailedCount] = await Promise.all([
    prisma.stockReservation.count({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: referenceDate },
      },
    }),
    prisma.stockReservation.count({
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
    referenceDate: referenceDate.toISOString(),
    expiredCount,
    abandonedOrFailedCount,
  };
}

async function cleanupReservations(referenceDate: Date) {
  return prisma.$transaction(async (tx) => {
    const expiredRows = normalizeRows(
      await tx.$queryRaw<ReservationMutationRow[]>(
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
      ),
    );

    const releasedRows = normalizeRows(
      await tx.$queryRaw<ReservationMutationRow[]>(
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
      ),
    );

    const inventoryDeltas = Object.entries(
      aggregateInventoryDeltas([...expiredRows, ...releasedRows]),
    );

    if (inventoryDeltas.length > 0) {
      await tx.$executeRaw(
        Prisma.sql`
          WITH "reservation_deltas" ("inventoryId", "quantity") AS (
            VALUES ${Prisma.join(
              inventoryDeltas.map(
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

    return {
      referenceDate: referenceDate.toISOString(),
      expiredCount: expiredRows.length,
      releasedCount: releasedRows.length,
      expiredReservationIds: expiredRows.map((row) => row.id),
      releasedReservationIds: releasedRows.map((row) => row.id),
    };
  });
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const referenceDate = new Date();
  const snapshotBefore = await countCleanupCandidates(referenceDate);

  if (!options.apply) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          ...snapshotBefore,
        },
        null,
        2,
      ),
    );
    return;
  }

  const cleanupResult = await cleanupReservations(referenceDate);
  const snapshotAfter = await countCleanupCandidates(referenceDate);

  console.log(
    JSON.stringify(
      {
        mode: "apply",
        snapshotBefore,
        cleanupResult,
        snapshotAfter,
      },
      null,
      2,
    ),
  );
}

run()
  .catch((error) => {
    console.error("Falha ao executar limpeza de reservas de inventario", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};
