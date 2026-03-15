import React, { type ReactNode } from "react";
import { redirect } from "next/navigation";

import AdminShell, {
  type AdminShellContext,
} from "@/components/admin/AdminShell";
import {
  getAdminStoreScopeStoreIds,
  type AdminStoreScope,
} from "@/lib/admin-store-scope";
import { resolveAdminPageAccess } from "@/lib/auth";
import { db } from "@/lib/prisma";

type AdminLayoutProps = {
  children: ReactNode;
};

type AuthorizedAdminShellUser = {
  adminStoreScope: AdminStoreScope;
  email?: string | null;
  name?: string | null;
  role?: string;
};

function formatAdminRoleLabel(role: string | undefined): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super admin";
    case "STORE_ADMIN":
      return "Admin de loja";
    case "ADMIN":
      return "Admin";
    default:
      return "Admin";
  }
}

async function buildAdminShellContext(
  user: AuthorizedAdminShellUser,
): Promise<AdminShellContext> {
  const actorName =
    (typeof user.name === "string" && user.name.trim()) ||
    (typeof user.email === "string" && user.email.trim()) ||
    "Operador admin";

  const scopedStoreIds = getAdminStoreScopeStoreIds(user.adminStoreScope);

  if (!scopedStoreIds) {
    return {
      actorName,
      roleLabel: formatAdminRoleLabel(user.role),
      scopeDescription:
        "Acesso consolidado a todas as lojas e módulos administrativos.",
      scopeLabel: "Visão global",
    };
  }

  if (scopedStoreIds.length === 0) {
    return {
      actorName,
      roleLabel: formatAdminRoleLabel(user.role),
      scopeDescription:
        "Nenhuma loja vinculada foi encontrada para o escopo atual deste operador.",
      scopeLabel: "Escopo sem lojas",
    };
  }

  // AIDEV-CRITICAL: o shell precisa refletir o escopo real do STORE_ADMIN para
  // não induzir operação fora do contexto permitido pela UI.
  const stores = await db.store.findMany({
    where: {
      id: {
        in: scopedStoreIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const storeNames = stores.map((store) => store.name);
  const primaryStoreName = storeNames[0] ?? "Loja vinculada";
  const hasMultipleStores = storeNames.length > 1;
  const scopeLabel = hasMultipleStores
    ? `${storeNames.length} lojas vinculadas`
    : primaryStoreName;
  const scopeDescription = hasMultipleStores
    ? `${primaryStoreName} e mais ${storeNames.length - 1} loja(s) compõem o escopo operacional atual.`
    : `Operando no contexto da loja ${primaryStoreName}.`;

  return {
    actorName,
    roleLabel: formatAdminRoleLabel(user.role),
    scopeDescription,
    scopeLabel,
  };
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const access = await resolveAdminPageAccess({
    fromPath: "/admin",
  });

  if (!access.allowed) {
    redirect(access.feedbackPath);
  }

  const shellContext = await buildAdminShellContext(
    access.user as unknown as AuthorizedAdminShellUser,
  );

  return <AdminShell context={shellContext}>{children}</AdminShell>;
}
