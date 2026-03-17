CREATE TYPE "AdminAuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

CREATE TYPE "AdminAuditResource" AS ENUM (
  'ORDER',
  'PRODUCT',
  'CATEGORY',
  'INVENTORY',
  'PRODUCT_IMAGE'
);

CREATE TABLE "admin_audit_logs" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorLabel" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "action" "AdminAuditAction" NOT NULL,
  "resource" "AdminAuditResource" NOT NULL,
  "targetId" TEXT NOT NULL,
  "targetLabel" TEXT,
  "storeId" TEXT,
  "summary" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_createdAt_idx"
ON "admin_audit_logs"("createdAt");

CREATE INDEX "admin_audit_logs_resource_action_createdAt_idx"
ON "admin_audit_logs"("resource", "action", "createdAt");

CREATE INDEX "admin_audit_logs_storeId_createdAt_idx"
ON "admin_audit_logs"("storeId", "createdAt");

CREATE INDEX "admin_audit_logs_actorUserId_createdAt_idx"
ON "admin_audit_logs"("actorUserId", "createdAt");

ALTER TABLE "admin_audit_logs"
ADD CONSTRAINT "admin_audit_logs_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
