-- Ensure SHA-256 helpers are available in PostgreSQL.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Migrate pre-existing plaintext reset tokens to hashed values.
UPDATE "public"."users"
SET "resetPasswordToken" = encode(digest("resetPasswordToken", 'sha256'), 'hex')
WHERE "resetPasswordToken" IS NOT NULL;

-- Speed up reset token hash lookups during password reset.
CREATE INDEX IF NOT EXISTS "users_resetPasswordToken_idx"
ON "public"."users"("resetPasswordToken");
