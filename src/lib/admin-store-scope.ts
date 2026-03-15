import { db } from "@/lib/prisma";

export type ScopedAdminRole = "ADMIN" | "SUPER_ADMIN" | "STORE_ADMIN";

export type AdminStoreScope =
  | {
      kind: "global";
    }
  | {
      kind: "stores";
      storeIds: string[];
    };

function normalizeStoreId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function normalizeScopedAdminRole(
  role: unknown,
): ScopedAdminRole | null {
  if (typeof role !== "string") {
    return null;
  }

  const normalizedRole = role.trim().toUpperCase();

  if (
    normalizedRole === "ADMIN" ||
    normalizedRole === "SUPER_ADMIN" ||
    normalizedRole === "STORE_ADMIN"
  ) {
    return normalizedRole;
  }

  return null;
}

export async function resolveAdminStoreScopeForUser(params: {
  role: unknown;
  userId: string;
}): Promise<AdminStoreScope> {
  const normalizedRole = normalizeScopedAdminRole(params.role);

  if (normalizedRole !== "STORE_ADMIN") {
    return {
      kind: "global",
    };
  }

  const normalizedUserId = normalizeStoreId(params.userId);

  if (!normalizedUserId) {
    return {
      kind: "stores",
      storeIds: [],
    };
  }

  const stores = await db.store.findMany({
    where: {
      ownerId: normalizedUserId,
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return {
    kind: "stores",
    storeIds: stores.map((store) => store.id),
  };
}

export function getAdminStoreScopeStoreIds(
  scope: AdminStoreScope,
): string[] | null {
  if (scope.kind !== "stores") {
    return null;
  }

  return [...scope.storeIds];
}

export function canAccessAdminStoreScope(
  scope: AdminStoreScope,
  storeId: unknown,
): boolean {
  if (scope.kind === "global") {
    return true;
  }

  const normalizedStoreId = normalizeStoreId(storeId);

  if (!normalizedStoreId) {
    return false;
  }

  return scope.storeIds.includes(normalizedStoreId);
}
