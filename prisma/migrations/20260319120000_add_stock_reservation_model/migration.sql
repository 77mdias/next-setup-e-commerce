CREATE TYPE "StockReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXPIRED', 'CONFIRMED');

CREATE TABLE "stock_reservations" (
  "id"          TEXT NOT NULL,
  "inventoryId" TEXT NOT NULL,
  "orderId"     INTEGER,
  "orderItemId" TEXT,
  "quantity"    INTEGER NOT NULL,
  "status"      "StockReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt"   TIMESTAMP(3) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_reservations_orderItemId_key"
ON "stock_reservations"("orderItemId");

CREATE INDEX "stock_reservations_inventoryId_status_idx"
ON "stock_reservations"("inventoryId", "status");

CREATE INDEX "stock_reservations_orderId_idx"
ON "stock_reservations"("orderId");

CREATE INDEX "stock_reservations_expiresAt_status_idx"
ON "stock_reservations"("expiresAt", "status");

ALTER TABLE "stock_reservations"
ADD CONSTRAINT "stock_reservations_inventoryId_fkey"
FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_reservations"
ADD CONSTRAINT "stock_reservations_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stock_reservations"
ADD CONSTRAINT "stock_reservations_orderItemId_fkey"
FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
