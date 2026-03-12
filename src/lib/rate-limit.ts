import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

type RateLimitWindowConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitIdentityConfig = RateLimitWindowConfig & {
  key: string;
  value?: string | null;
};

export type RequestRateLimitOptions = {
  headers: Headers;
  scope: string;
  now?: Date;
  ip: RateLimitWindowConfig;
  identities?: RateLimitIdentityConfig[];
};

type RateLimitBucketState = {
  count: number;
  resetAt: number;
};

type ResolvedRateLimitBucket = RateLimitIdentityConfig & {
  storageKey: string;
  value: string;
};

export type RateLimitResult =
  | {
      allowed: true;
      remaining: number;
      resetAt: Date;
    }
  | {
      allowed: false;
      bucketKey: string;
      limit: number;
      resetAt: Date;
      retryAfter: number;
      windowMs: number;
    };

const RATE_LIMIT_CLIENT_IP_HEADERS = [
  "x-forwarded-for",
  "cf-connecting-ip",
  "x-real-ip",
  "true-client-ip",
  "x-client-ip",
] as const;

const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000;

declare global {
  var __myStoreRateLimitStore: Map<string, RateLimitBucketState> | undefined;
  var __myStoreRateLimitLastCleanupAtMs: number | undefined;
}

function getRateLimitStore(): Map<string, RateLimitBucketState> {
  if (!globalThis.__myStoreRateLimitStore) {
    globalThis.__myStoreRateLimitStore = new Map<
      string,
      RateLimitBucketState
    >();
  }

  return globalThis.__myStoreRateLimitStore;
}

function hashRateLimitValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeRateLimitValue(value?: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildRateLimitStorageKey(
  scope: string,
  bucketKey: string,
  value: string,
): string {
  return `${scope}:${bucketKey}:${hashRateLimitValue(value)}`;
}

function cleanupExpiredRateLimitEntries(nowMs: number): void {
  const lastCleanupAtMs = globalThis.__myStoreRateLimitLastCleanupAtMs ?? 0;

  if (nowMs - lastCleanupAtMs < RATE_LIMIT_CLEANUP_INTERVAL_MS) {
    return;
  }

  const store = getRateLimitStore();

  for (const [storageKey, state] of store.entries()) {
    if (state.resetAt <= nowMs) {
      store.delete(storageKey);
    }
  }

  globalThis.__myStoreRateLimitLastCleanupAtMs = nowMs;
}

function resolveRateLimitState(
  storageKey: string,
  windowMs: number,
  nowMs: number,
): RateLimitBucketState {
  const store = getRateLimitStore();
  const existingState = store.get(storageKey);

  if (!existingState || existingState.resetAt <= nowMs) {
    const nextState = {
      count: 0,
      resetAt: nowMs + windowMs,
    };
    store.set(storageKey, nextState);
    return nextState;
  }

  return existingState;
}

function resolveRateLimitBuckets(
  options: RequestRateLimitOptions,
): ResolvedRateLimitBucket[] {
  const ipAddress = resolveClientIp(options.headers);
  const identityBuckets = (options.identities ?? [])
    .map((identity) => {
      const normalizedValue = normalizeRateLimitValue(identity.value);

      if (!normalizedValue) {
        return null;
      }

      return {
        ...identity,
        value: normalizedValue,
        storageKey: buildRateLimitStorageKey(
          options.scope,
          identity.key,
          normalizedValue,
        ),
      };
    })
    .filter(
      (identity): identity is ResolvedRateLimitBucket => identity !== null,
    );

  return [
    {
      key: "ip",
      limit: options.ip.limit,
      storageKey: buildRateLimitStorageKey(options.scope, "ip", ipAddress),
      value: ipAddress,
      windowMs: options.ip.windowMs,
    },
    ...identityBuckets,
  ];
}

export function resolveClientIp(headers: Headers): string {
  for (const headerName of RATE_LIMIT_CLIENT_IP_HEADERS) {
    const headerValue = headers.get(headerName);
    const normalizedValue = normalizeRateLimitValue(headerValue);

    if (!normalizedValue) {
      continue;
    }

    if (headerName === "x-forwarded-for") {
      const [firstIp = ""] = normalizedValue.split(",");
      const forwardedIp = firstIp.trim();

      if (forwardedIp) {
        return forwardedIp;
      }

      continue;
    }

    return normalizedValue;
  }

  return "unknown";
}

export function consumeRequestRateLimit(
  options: RequestRateLimitOptions,
): RateLimitResult {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();

  cleanupExpiredRateLimitEntries(nowMs);

  const buckets = resolveRateLimitBuckets(options);

  for (const bucket of buckets) {
    const state = resolveRateLimitState(
      bucket.storageKey,
      bucket.windowMs,
      nowMs,
    );

    if (state.count >= bucket.limit) {
      return {
        allowed: false,
        bucketKey: bucket.key,
        limit: bucket.limit,
        resetAt: new Date(state.resetAt),
        retryAfter: Math.max(1, Math.ceil((state.resetAt - nowMs) / 1000)),
        windowMs: bucket.windowMs,
      };
    }
  }

  let remaining = Number.POSITIVE_INFINITY;
  let resetAtMs = Number.POSITIVE_INFINITY;

  for (const bucket of buckets) {
    const state = resolveRateLimitState(
      bucket.storageKey,
      bucket.windowMs,
      nowMs,
    );
    state.count += 1;

    remaining = Math.min(remaining, bucket.limit - state.count);
    resetAtMs = Math.min(resetAtMs, state.resetAt);
  }

  return {
    allowed: true,
    remaining: Number.isFinite(remaining) ? remaining : 0,
    resetAt: new Date(Number.isFinite(resetAtMs) ? resetAtMs : nowMs),
  };
}

export function createRateLimitResponse(params: {
  message: string;
  retryAfter: number;
  key?: "error" | "message";
}) {
  const messageKey = params.key ?? "error";

  return NextResponse.json(
    {
      [messageKey]: params.message,
      retryAfter: params.retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(params.retryAfter),
      },
    },
  );
}

export function resetRateLimitStore(): void {
  getRateLimitStore().clear();
  globalThis.__myStoreRateLimitLastCleanupAtMs = 0;
}
