import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { GET } from "@/app/api/auth/user-info/route";

type StructuredLogEntry = {
  message: string;
  route: string | null;
  requestId: string | null;
  error: unknown;
};

function parseStructuredLogEntry(logCall: unknown[]): StructuredLogEntry {
  const [serializedLog] = logCall;

  if (typeof serializedLog !== "string") {
    throw new Error("Structured log must be a JSON string");
  }

  return JSON.parse(serializedLog) as StructuredLogEntry;
}

function createRequest(email?: string) {
  const endpoint = new URL("http://localhost:3000/api/auth/user-info");

  if (email) {
    endpoint.searchParams.set("email", email);
  }

  return new NextRequest(endpoint.toString(), {
    method: "GET",
    headers: {
      "x-request-id": "req-auth-user-info-test",
    },
  });
}

describe("GET /api/auth/user-info integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Email é obrigatório");
    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when user is not found", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);

    const response = await GET(createRequest("customer@example.com"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Usuário não encontrado");
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: "customer@example.com" },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });
  });

  it("returns user auth metadata when account exists", async () => {
    mockDb.user.findUnique.mockResolvedValue({
      email: "customer@example.com",
      password: "$2a$hash",
      accounts: [{ provider: "google" }, { provider: "github" }],
    });

    const response = await GET(createRequest("customer@example.com"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      hasPassword: true,
      oauthProviders: ["google", "github"],
      email: "customer@example.com",
    });
  });

  it("redacts PII and tokens in lookup error logs", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockDb.user.findUnique.mockRejectedValue(
      new Error(
        "Falha ao consultar customer@example.com cpf 12345678900 token=sk_test_sensitive",
      ),
    );

    const response = await GET(createRequest("customer@example.com"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Erro interno do servidor");

    const structuredError = parseStructuredLogEntry(errorSpy.mock.calls[0]);
    expect(structuredError).toMatchObject({
      message: "auth.user_info.lookup_failed",
      route: "/api/auth/user-info",
      requestId: "req-auth-user-info-test",
    });

    const serializedLog = JSON.stringify(structuredError);
    expect(serializedLog).not.toContain("customer@example.com");
    expect(serializedLog).not.toContain("12345678900");
    expect(serializedLog).not.toContain("sk_test_sensitive");
    expect(serializedLog).toContain("[REDACTED_EMAIL]");
    expect(serializedLog).toContain("[REDACTED_CPF]");
    expect(serializedLog).toContain("[REDACTED_TOKEN]");

    errorSpy.mockRestore();
  });
});
