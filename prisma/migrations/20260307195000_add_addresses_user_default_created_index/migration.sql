CREATE INDEX "addresses_userId_isDefault_createdAt_idx"
ON "public"."addresses"("userId", "isDefault", "createdAt");
