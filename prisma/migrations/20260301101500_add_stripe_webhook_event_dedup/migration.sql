CREATE TYPE "WebhookEventStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "stripe_webhook_events" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'PROCESSING',
  "payload" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 1,
  "lastReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stripe_webhook_events_eventId_key"
  ON "stripe_webhook_events"("eventId");

CREATE INDEX "stripe_webhook_events_status_updatedAt_idx"
  ON "stripe_webhook_events"("status", "updatedAt");
