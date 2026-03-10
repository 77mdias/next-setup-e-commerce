import { describe, expect, it } from "vitest";

import {
  REDACTED_CPF,
  REDACTED_EMAIL,
  REDACTED_TOKEN,
  redactLogValue,
} from "@/lib/log-redaction";

describe("log-redaction", () => {
  it("redacts sensitive fields recursively by key", () => {
    const redacted = redactLogValue({
      customerEmail: "customer@example.com",
      customerCpf: "123.456.789-00",
      accessToken: "token-value",
      nested: {
        email: "nested@example.com",
        metadata: {
          paymentIntentId: "pi_test_123",
        },
      },
      safeValue: "visible",
    }) as {
      customerEmail: string;
      customerCpf: string;
      accessToken: string;
      nested: {
        email: string;
        metadata: {
          paymentIntentId: string;
        };
      };
      safeValue: string;
    };

    expect(redacted.customerEmail).toBe(REDACTED_EMAIL);
    expect(redacted.customerCpf).toBe(REDACTED_CPF);
    expect(redacted.accessToken).toBe(REDACTED_TOKEN);
    expect(redacted.nested.email).toBe(REDACTED_EMAIL);
    expect(redacted.nested.metadata.paymentIntentId).toBe(REDACTED_TOKEN);
    expect(redacted.safeValue).toBe("visible");
  });

  it("redacts inline sensitive values from free-form strings", () => {
    const rawMessage =
      "Erro para customer@example.com cpf 12345678900 token=abc123 com Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIn0.signature e chave sk_test_sensitive";

    const redacted = redactLogValue({
      message: rawMessage,
    }) as {
      message: string;
    };

    expect(redacted.message).toContain(REDACTED_EMAIL);
    expect(redacted.message).toContain(REDACTED_CPF);
    expect(redacted.message).toContain(REDACTED_TOKEN);
    expect(redacted.message).not.toContain("customer@example.com");
    expect(redacted.message).not.toContain("12345678900");
    expect(redacted.message).not.toContain("token=abc123");
    expect(redacted.message).not.toContain("sk_test_sensitive");
  });
});
