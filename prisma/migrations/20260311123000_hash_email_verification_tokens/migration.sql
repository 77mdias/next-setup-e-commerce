-- Ensure SHA-256 helpers are available in PostgreSQL.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Migrate pre-existing plaintext email verification tokens to hashed values.
UPDATE "public"."users"
SET "emailVerificationToken" = encode(digest("emailVerificationToken", 'sha256'), 'hex')
WHERE "emailVerificationToken" IS NOT NULL
  AND "emailVerificationToken" !~ '^[0-9a-f]{64}$';

-- Speed up token hash lookups during verification.
CREATE INDEX IF NOT EXISTS "users_emailVerificationToken_idx"
ON "public"."users"("emailVerificationToken");
