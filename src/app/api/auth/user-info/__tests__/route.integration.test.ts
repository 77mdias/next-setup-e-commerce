import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/auth/user-info/route";

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
  it("returns neutral guidance when email is missing", async () => {
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message:
        "Por segurança, não confirmamos os métodos vinculados a um email específico.",
      details: [
        "Use o método de autenticação originalmente utilizado no cadastro.",
        "Se não lembrar o método, tente recuperar a conta por email.",
      ],
    });
  });

  it("returns the same neutral payload when email is provided", async () => {
    const withoutEmailResponse = await GET(createRequest());
    const withEmailResponse = await GET(createRequest("customer@example.com"));

    const withoutEmailBody = await withoutEmailResponse.json();
    const withEmailBody = await withEmailResponse.json();

    expect(withEmailResponse.status).toBe(200);
    expect(withEmailBody).toEqual(withoutEmailBody);
    expect(withEmailBody).not.toHaveProperty("hasPassword");
    expect(withEmailBody).not.toHaveProperty("oauthProviders");
    expect(withEmailBody).not.toHaveProperty("email");
  });
});
