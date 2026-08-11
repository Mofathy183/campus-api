/**
 * @module config
 * @description Public entry point for application configuration:
 * validated environment variables and the shared Prisma client.
 */
export { env, envConfig } from './env.config';
export { prisma } from './prisma.client';
export type { PrismaClient } from './prisma.client';
