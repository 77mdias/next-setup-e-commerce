-- Normalize eventual duplicated defaults before creating the unique constraint.
WITH ranked_defaults AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
    ) AS row_number
  FROM "addresses"
  WHERE "isDefault" = true
    AND "userId" IS NOT NULL
)
UPDATE "addresses" AS address
SET "isDefault" = false
FROM ranked_defaults
WHERE address."id" = ranked_defaults."id"
  AND ranked_defaults.row_number > 1;

-- Enforce at most one default address per user at database level.
CREATE UNIQUE INDEX "addresses_userId_single_default_unique"
  ON "addresses"("userId")
  WHERE "isDefault" = true
    AND "userId" IS NOT NULL;
