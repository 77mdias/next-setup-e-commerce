import { db } from "@/lib/prisma";

export type ResolvedStore = {
  id: string;
  slug: string;
  name: string;
};

const STORE_CACHE_TTL_MS = 60 * 1000;

const resolvedStoreCache = new Map<
  string,
  {
    value: ResolvedStore | null;
    expiresAt: number;
  }
>();

function getCachedStore(cacheKey: string): ResolvedStore | null | undefined {
  const cached = resolvedStoreCache.get(cacheKey);

  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt < Date.now()) {
    resolvedStoreCache.delete(cacheKey);
    return undefined;
  }

  return cached.value;
}

function setCachedStore(
  cacheKey: string,
  store: ResolvedStore | null,
): ResolvedStore | null {
  resolvedStoreCache.set(cacheKey, {
    value: store,
    expiresAt: Date.now() + STORE_CACHE_TTL_MS,
  });

  return store;
}

export async function resolveActiveStore(): Promise<ResolvedStore | null> {
  const cacheKey = "active";
  const cachedStore = getCachedStore(cacheKey);

  if (cachedStore !== undefined) {
    return cachedStore;
  }

  const store = await db.store.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  return setCachedStore(cacheKey, store);
}

export async function requireActiveStore(): Promise<ResolvedStore> {
  const store = await resolveActiveStore();

  if (!store) {
    throw new Error("Nenhuma loja ativa encontrada");
  }

  return store;
}
