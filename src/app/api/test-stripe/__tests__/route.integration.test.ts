import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateCheckoutSession } = vi.hoisted(() => ({
  mockCreateCheckoutSession: vi.fn(),
}));

vi.mock("@/lib/stripe-config", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockCreateCheckoutSession,
      },
    },
  },
}));

import { GET } from "@/app/api/test-stripe/route";

function createRequest(headers?: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/test-stripe", {
    method: "GET",
    headers,
  });
}

describe("GET /api/test-stripe integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ENABLE_TEST_STRIPE_ENDPOINT;
    delete process.env.INTERNAL_DEBUG_KEY;
    delete process.env.TEST_STRIPE_ALLOWED_IPS;
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

    mockCreateCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      url: "https://stripe.test/session/cs_test_123",
      status: "open",
    });
  });

  it("blocks endpoint in production and does not create Stripe session", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await GET(createRequest());
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Not found");
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it("keeps diagnostic flow working in development", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    try {
      const response = await GET(createRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.testSession.id).toBe("cs_test_123");
      expect(mockCreateCheckoutSession).toHaveBeenCalledTimes(1);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it("blocks outside development when endpoint is not explicitly enabled", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    try {
      const response = await GET(createRequest());
      expect(response.status).toBe(404);
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it("requires internal debug key and allowed ip outside development", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    process.env.ENABLE_TEST_STRIPE_ENDPOINT = "true";
    process.env.INTERNAL_DEBUG_KEY = "debug-key-123";
    process.env.TEST_STRIPE_ALLOWED_IPS = "10.0.0.1,10.0.0.2";

    try {
      const invalidKeyResponse = await GET(
        createRequest({
          "x-internal-debug-key": "wrong-key",
          "x-forwarded-for": "10.0.0.1",
        }),
      );
      expect(invalidKeyResponse.status).toBe(404);
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled();

      const invalidIpResponse = await GET(
        createRequest({
          "x-internal-debug-key": "debug-key-123",
          "x-forwarded-for": "192.168.1.50",
        }),
      );
      expect(invalidIpResponse.status).toBe(404);
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled();

      const allowedResponse = await GET(
        createRequest({
          "x-internal-debug-key": "debug-key-123",
          "x-forwarded-for": "10.0.0.2",
        }),
      );

      expect(allowedResponse.status).toBe(200);
      expect(mockCreateCheckoutSession).toHaveBeenCalledTimes(1);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      delete process.env.ENABLE_TEST_STRIPE_ENDPOINT;
      delete process.env.INTERNAL_DEBUG_KEY;
      delete process.env.TEST_STRIPE_ALLOWED_IPS;
    }
  });
});
