export const REDACTED_EMAIL = "[REDACTED_EMAIL]";
export const REDACTED_CPF = "[REDACTED_CPF]";
export const REDACTED_TOKEN = "[REDACTED_TOKEN]";

type SensitiveFieldKind = "email" | "cpf" | "token" | null;

const TOKEN_KEY_SEGMENTS = [
  "token",
  "secret",
  "password",
  "authorization",
  "apikey",
  "api_key",
  "cookie",
  "signature",
  "sessionid",
  "session_id",
  "checkoutsessionid",
  "checkout_session_id",
  "paymentintentid",
  "payment_intent_id",
  "stripepaymentid",
  "stripe_payment_id",
] as const;

const EMAIL_VALUE_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CPF_VALUE_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi;
const TOKEN_QUERY_PATTERN =
  /((?:^|[?&])(?:token|access_token|refresh_token|id_token|session_id)=)[^&\s]+/gi;
const TOKEN_ASSIGNMENT_PATTERN = /\b(token=)[^\s&]+/gi;
const JWT_PATTERN =
  /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const STRIPE_SECRET_PATTERN =
  /\b(?:sk|pk|rk|whsec)_(?:test|live)_[A-Za-z0-9_]+\b/gi;
const STRIPE_TOKEN_PATTERN = /\b(?:cs|pi|seti|tok)_[A-Za-z0-9_]+\b/g;

function resolveSensitiveFieldKind(key: string | null): SensitiveFieldKind {
  if (!key) {
    return null;
  }

  const normalizedKey = key.replace(/[\s.-]/g, "_").toLowerCase();

  if (normalizedKey.includes("email")) {
    return "email";
  }

  if (normalizedKey.includes("cpf")) {
    return "cpf";
  }

  if (
    TOKEN_KEY_SEGMENTS.some((segment) =>
      normalizedKey.replace(/_/g, "").includes(segment.replace(/_/g, "")),
    )
  ) {
    return "token";
  }

  return null;
}

function redactInlineSensitiveContent(value: string): string {
  return value
    .replace(EMAIL_VALUE_PATTERN, REDACTED_EMAIL)
    .replace(CPF_VALUE_PATTERN, REDACTED_CPF)
    .replace(BEARER_TOKEN_PATTERN, `Bearer ${REDACTED_TOKEN}`)
    .replace(
      TOKEN_QUERY_PATTERN,
      (_, prefix: string) => `${prefix}${REDACTED_TOKEN}`,
    )
    .replace(
      TOKEN_ASSIGNMENT_PATTERN,
      (_, prefix: string) => `${prefix}${REDACTED_TOKEN}`,
    )
    .replace(JWT_PATTERN, REDACTED_TOKEN)
    .replace(STRIPE_SECRET_PATTERN, REDACTED_TOKEN)
    .replace(STRIPE_TOKEN_PATTERN, REDACTED_TOKEN);
}

function redactString(value: string, key: string | null): string {
  const sensitiveKind = resolveSensitiveFieldKind(key);

  if (sensitiveKind === "email") {
    return REDACTED_EMAIL;
  }

  if (sensitiveKind === "cpf") {
    return REDACTED_CPF;
  }

  if (sensitiveKind === "token") {
    return REDACTED_TOKEN;
  }

  return redactInlineSensitiveContent(value);
}

function redactValue(
  value: unknown,
  key: string | null,
  seen: WeakSet<object>,
): unknown {
  if (typeof value === "string") {
    return redactString(value, key);
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, key, seen));
  }

  const redactedRecord: Record<string, unknown> = {};

  for (const [entryKey, entryValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    redactedRecord[entryKey] = redactValue(entryValue, entryKey, seen);
  }

  return redactedRecord;
}

export function redactLogValue<T>(value: T): T {
  return redactValue(value, null, new WeakSet()) as T;
}
