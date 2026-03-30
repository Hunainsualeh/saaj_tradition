// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // optional
  });

// Singleton: reuse across hot-reloads in development and across
// invocations in serverless (Vercel) production environments.
globalForPrisma.prisma = prisma;
