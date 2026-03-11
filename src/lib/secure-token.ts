import { createHash, randomBytes } from "node:crypto";

const SECURITY_TOKEN_SIZE_BYTES = 32;

export function generateSecurityToken(): string {
  return randomBytes(SECURITY_TOKEN_SIZE_BYTES).toString("hex");
}

export function hashSecurityToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSecurityTokenPair(): {
  token: string;
  tokenHash: string;
} {
  const token = generateSecurityToken();

  return {
    token,
    tokenHash: hashSecurityToken(token),
  };
}
