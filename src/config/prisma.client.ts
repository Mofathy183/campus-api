import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { env } from './env.config';

/**
 * @module config/prisma.client
 * @description
 * Provides a single, process-wide {@link PrismaClient} instance built
 * with the `PrismaPg` driver adapter.
 *
 * `tsx watch` re-evaluates modules on every file save during local
 * development, which would otherwise open a fresh Postgres connection
 * pool on every reload. Caching the instance on `globalThis` outside
 * of production avoids exhausting local Postgres connections during
 * `pnpm dev`.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** The application's shared Prisma client. */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from '../../prisma/generated/prisma/client';
