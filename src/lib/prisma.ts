import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  cachedPrisma: PrismaClient | undefined;
};

if (!globalForPrisma.cachedPrisma) {
  globalForPrisma.cachedPrisma = new PrismaClient();
}

export const db = globalForPrisma.cachedPrisma;
