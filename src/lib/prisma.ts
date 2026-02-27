import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  cachedPrisma: PrismaClient | undefined;
};

if (process.env.NEXT_RUNTIME === "edge") {
  throw new Error(
    "Prisma Client cannot run in the Edge runtime. Use Node.js runtime for database access.",
  );
}

if (!globalForPrisma.cachedPrisma) {
  globalForPrisma.cachedPrisma = new PrismaClient();
}

export const db = globalForPrisma.cachedPrisma;
