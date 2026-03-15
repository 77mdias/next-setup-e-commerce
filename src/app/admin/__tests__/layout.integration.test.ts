import { beforeEach, describe, expect, it, vi } from "vitest";

type RedirectError = Error & { destination?: string };

const { mockAdminShell, mockDb, mockResolveAdminPageAccess, mockRedirect } =
  vi.hoisted(() => ({
    mockAdminShell: vi.fn(({ children }: { children: unknown }) => children),
    mockDb: {
      store: {
        findMany: vi.fn(),
      },
    },
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

vi.mock("@/components/admin/AdminShell", () => ({
  default: mockAdminShell,
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
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
    mockDb.store.findMany.mockResolvedValue([]);
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
        adminStoreScope: {
          kind: "global",
        },
        id: "admin-1",
        role: "ADMIN",
      },
    });

    const layoutOutput = await AdminLayout({
      children: "protected-admin-content",
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(layoutOutput).toMatchObject({
      props: expect.objectContaining({
        children: "protected-admin-content",
        context: expect.objectContaining({
          roleLabel: "Admin",
          scopeLabel: "Visão global",
        }),
      }),
      type: mockAdminShell,
    });
  });

  it("loads scoped store context for store admin users", async () => {
    mockResolveAdminPageAccess.mockResolvedValue({
      allowed: true,
      user: {
        adminStoreScope: {
          kind: "stores",
          storeIds: ["store-1"],
        },
        email: "store-admin@example.com",
        id: "store-admin-1",
        role: "STORE_ADMIN",
      },
    });
    mockDb.store.findMany.mockResolvedValue([
      {
        id: "store-1",
        name: "Loja Centro",
      },
    ]);

    const layoutOutput = await AdminLayout({
      children: "store-admin-content",
    });

    expect(mockDb.store.findMany).toHaveBeenCalledWith({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
      where: {
        id: {
          in: ["store-1"],
        },
      },
    });
    expect(layoutOutput).toMatchObject({
      props: expect.objectContaining({
        children: "store-admin-content",
        context: expect.objectContaining({
          actorName: "store-admin@example.com",
          roleLabel: "Admin de loja",
          scopeDescription: "Operando no contexto da loja Loja Centro.",
          scopeLabel: "Loja Centro",
        }),
      }),
      type: mockAdminShell,
    });
  });
});
