/**
 * shared/types/index.ts
 * ----------------------
 * App-level types shared across middleware, controllers, and services.
 *
 * `Role` is deliberately a plain string-literal union rather than an
 * import of Prisma's generated `UserRole` enum. Beggy's shared types
 * import straight from `@prisma-generated/enums`, which is fine there —
 * but campus-api's shared/ layer has no path aliases (see the naming
 * convention doc's "decoupled from framework" rule), so importing the
 * generated client from deep inside shared/ means fragile relative
 * paths (`../../../prisma/generated/prisma`) leaking into files that
 * shouldn't need to know about Prisma at all. Keep this union in sync
 * with `enum UserRole` in prisma/models/user.prisma by hand — it's two
 * values, not worth generating.
 */
export type Role = 'ADMIN' | 'STUDENT';

/**
 * Trusted identity attached to `req.user` by `requireAuth`
 * (see shared/middleware/auth.middleware.ts). Only ever built from a
 * verified JWT payload — never trust a hand-built AuthUser.
 */
export interface AuthUser {
	id: string;
	role: Role;
	/** JWT `iat` claim (unix seconds) — reserved for future use, e.g.
	 *  invalidating tokens issued before a password change. Not enforced
	 *  today; there's no such requirement in the spec. */
	issuedAt: number;
}
