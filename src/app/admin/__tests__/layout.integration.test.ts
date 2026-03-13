import { beforeEach, describe, expect, it, vi } from "vitest";

type RedirectError = Error & { destination?: string };

const { mockResolveAdminPageAccess, mockRedirect } = vi.hoisted(() => ({
  mockResolveAdminPageAccess: vi.fn(),
  mockRedirect: vi.fn((destination: string) => {
    const redirectError = new Error("NEXT_REDIRECT_TEST") as RedirectError;
    redirectError.destination = destination;
    throw redirectError;
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@/lib/auth", () => ({
  resolveAdminPageAccess: mockResolveAdminPageAccess,
}));

import AdminLayout from "@/app/admin/layout";

async function expectRedirectTo(
  promise: Promise<unknown>,
  destination: string,
) {
  await expect(promise).rejects.toMatchObject({
    message: "NEXT_REDIRECT_TEST",
    destination,
  });
}

describe("admin layout integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous user to auth-required feedback", async () => {
    mockResolveAdminPageAccess.mockResolvedValue({
      allowed: false,
      status: 401,
      feedbackPath:
        "/status?reason=auth-required&callbackUrl=%2Fadmin&from=%2Fadmin",
    });

    await expectRedirectTo(
      AdminLayout({ children: "admin-area" }),
      "/status?reason=auth-required&callbackUrl=%2Fadmin&from=%2Fadmin",
    );

    expect(mockResolveAdminPageAccess).toHaveBeenCalledWith({
      fromPath: "/admin",
    });
  });

  it("redirects authenticated user without admin role to forbidden feedback", async () => {
    mockResolveAdminPageAccess.mockResolvedValue({
      allowed: false,
      status: 403,
      feedbackPath: "/status?reason=forbidden&from=%2Fadmin",
    });

    await expectRedirectTo(
      AdminLayout({ children: "admin-area" }),
      "/status?reason=forbidden&from=%2Fadmin",
    );
  });

  it("renders children for authorized admin role", async () => {
    mockResolveAdminPageAccess.mockResolvedValue({
      allowed: true,
      user: {
        id: "admin-1",
      },
    });

    const layoutOutput = await AdminLayout({
      children: "protected-admin-content",
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(layoutOutput).toBe("protected-admin-content");
  });
});
