-- Add dedicated Stripe identifiers to separate checkout session and payment intent.
ALTER TABLE "orders"
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId" TEXT;

-- Backfill from legacy field keeping a safe transition strategy.
-- Heuristic: values starting with 'pi_' are payment intent IDs; other values
-- are treated as checkout session IDs.
UPDATE "orders"
SET
  "stripeCheckoutSessionId" = COALESCE(
    "stripeCheckoutSessionId",
    CASE
      WHEN "stripePaymentId" IS NOT NULL AND LEFT("stripePaymentId", 3) <> 'pi_'
        THEN "stripePaymentId"
      ELSE NULL
    END
  ),
  "stripePaymentIntentId" = COALESCE(
    "stripePaymentIntentId",
    CASE
      WHEN LEFT("stripePaymentId", 3) = 'pi_'
        THEN "stripePaymentId"
      ELSE NULL
    END
  )
WHERE
  "stripePaymentId" IS NOT NULL
  AND (
    "stripeCheckoutSessionId" IS NULL
    OR "stripePaymentIntentId" IS NULL
  );

CREATE INDEX IF NOT EXISTS "orders_userId_stripeCheckoutSessionId_idx"
  ON "orders"("userId", "stripeCheckoutSessionId");

CREATE INDEX IF NOT EXISTS "orders_stripePaymentIntentId_idx"
  ON "orders"("stripePaymentIntentId");
