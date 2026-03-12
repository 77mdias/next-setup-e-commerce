import { beforeEach, describe, expect, it } from "vitest";

import {
  consumeRequestRateLimit,
  createRateLimitResponse,
  resetRateLimitStore,
  resolveClientIp,
} from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("resolves the first forwarded client IP", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.20, 203.0.113.4",
    });

    expect(resolveClientIp(headers)).toBe("198.51.100.20");
  });

  it("blocks requests after the configured identity limit", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.21",
    });
    const now = new Date("2026-03-12T10:00:00.000Z");

    const firstAttempt = consumeRequestRateLimit({
      headers,
      scope: "auth.forgot_password",
      now,
      ip: {
        limit: 5,
        windowMs: 60_000,
      },
      identities: [
        {
          key: "email",
          value: "customer@example.com",
          limit: 2,
          windowMs: 60_000,
        },
      ],
    });
    const secondAttempt = consumeRequestRateLimit({
      headers,
      scope: "auth.forgot_password",
      now,
      ip: {
        limit: 5,
        windowMs: 60_000,
      },
      identities: [
        {
          key: "email",
          value: "customer@example.com",
          limit: 2,
          windowMs: 60_000,
        },
      ],
    });
    const blockedAttempt = consumeRequestRateLimit({
      headers,
      scope: "auth.forgot_password",
      now,
      ip: {
        limit: 5,
        windowMs: 60_000,
      },
      identities: [
        {
          key: "email",
          value: "customer@example.com",
          limit: 2,
          windowMs: 60_000,
        },
      ],
    });

    expect(firstAttempt.allowed).toBe(true);
    expect(secondAttempt.allowed).toBe(true);
    expect(blockedAttempt.allowed).toBe(false);

    if (blockedAttempt.allowed) {
      throw new Error("Expected rate limit to block the third attempt");
    }

    expect(blockedAttempt.bucketKey).toBe("email");
    expect(blockedAttempt.retryAfter).toBe(60);
  });

  it("allows requests again after the rate-limit window expires", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.22",
    });

    const initialAttempt = consumeRequestRateLimit({
      headers,
      scope: "auth.verify_email.resend",
      now: new Date("2026-03-12T10:00:00.000Z"),
      ip: {
        limit: 1,
        windowMs: 60_000,
      },
    });
    const blockedAttempt = consumeRequestRateLimit({
      headers,
      scope: "auth.verify_email.resend",
      now: new Date("2026-03-12T10:00:30.000Z"),
      ip: {
        limit: 1,
        windowMs: 60_000,
      },
    });
    const reopenedAttempt = consumeRequestRateLimit({
      headers,
      scope: "auth.verify_email.resend",
      now: new Date("2026-03-12T10:01:01.000Z"),
      ip: {
        limit: 1,
        windowMs: 60_000,
      },
    });

    expect(initialAttempt.allowed).toBe(true);
    expect(blockedAttempt.allowed).toBe(false);
    expect(reopenedAttempt.allowed).toBe(true);
  });

  it("builds a 429 response with retry metadata", async () => {
    const response = createRateLimitResponse({
      key: "message",
      message: "Tente novamente depois",
      retryAfter: 42,
    });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(body).toEqual({
      message: "Tente novamente depois",
      retryAfter: 42,
    });
  });
});
