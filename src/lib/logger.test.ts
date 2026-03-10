import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLogger, createRequestLogger, resolveRequestId } from "@/lib/logger";

type ParsedLogEntry = {
  timestamp: string;
  level: string;
  message: string;
  route: string | null;
  requestId: string | null;
  orderId: number | string | null;
  eventId: string | null;
  context: Record<string, unknown> | null;
  data: unknown;
  error: unknown;
};

function parseLogPayload(rawLogEntry: unknown): ParsedLogEntry {
  if (typeof rawLogEntry !== "string") {
    throw new Error("Expected structured log payload as JSON string");
  }

  return JSON.parse(rawLogEntry) as ParsedLogEntry;
}

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves requestId from x-request-id header when present", () => {
    const headers = new Headers({
      "x-request-id": "req-from-header",
    });

    expect(resolveRequestId(headers)).toBe("req-from-header");
  });

  it("falls back to generated requestId when correlation headers are missing", () => {
    const requestId = resolveRequestId(new Headers());

    expect(typeof requestId).toBe("string");
    expect(requestId.length).toBeGreaterThan(0);
  });

  it("emits structured info log with correlated context fields", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const logger = createLogger({
      route: "/api/checkout",
      requestId: "req_checkout_1",
    }).child({ orderId: 123 });

    logger.info("checkout.created", {
      context: {
        eventId: "evt_checkout_1",
        checkoutSessionId: "cs_123",
      },
      data: {
        amountCents: 11500,
      },
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);

    const [serializedLog] = infoSpy.mock.calls[0];
    const parsedLog = parseLogPayload(serializedLog);

    expect(parsedLog).toMatchObject({
      level: "info",
      message: "checkout.created",
      route: "/api/checkout",
      requestId: "req_checkout_1",
      orderId: 123,
      eventId: "evt_checkout_1",
      context: {
        checkoutSessionId: "cs_123",
      },
      data: {
        amountCents: 11500,
      },
      error: null,
    });
    expect(new Date(parsedLog.timestamp).toString()).not.toBe("Invalid Date");
  });

  it("emits structured error log with normalized Error object", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = createRequestLogger({
      headers: new Headers({
        "x-correlation-id": "corr-123",
      }),
      route: "/api/webhooks/stripe",
    });
    const runtimeError = new Error("stripe offline");

    logger.error("webhooks.stripe.processing_failed", {
      context: {
        eventId: "evt_123",
      },
      error: runtimeError,
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);

    const [serializedLog] = errorSpy.mock.calls[0];
    const parsedLog = parseLogPayload(serializedLog);

    expect(parsedLog).toMatchObject({
      level: "error",
      message: "webhooks.stripe.processing_failed",
      route: "/api/webhooks/stripe",
      requestId: "corr-123",
      eventId: "evt_123",
    });

    const parsedError = parsedLog.error as { message?: string; name?: string };
    expect(parsedError.message).toBe("stripe offline");
    expect(parsedError.name).toBe("Error");
  });
});
