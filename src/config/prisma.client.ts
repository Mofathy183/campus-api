import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { env } from './env.config';

/**
 * prisma.client.ts
 * ------------------
 * Single Prisma Client instance for the whole app, built with the
 * PrismaPg driver adapter (prisma/schema.prisma's generator uses
 * Prisma 7's client generator, which requires an explicit adapter
 * rather than a bundled query engine).
 *
 * `tsx watch` re-evaluates modules on every file save in dev, which
 * would otherwise open a fresh Postgres connection pool per reload.
 * Caching the instance on `globalThis` outside production (same
 * pattern Beggy/PyLedger use) avoids exhausting local Postgres
 * connections during `pnpm dev`.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from '../../prisma/generated/prisma/client';
