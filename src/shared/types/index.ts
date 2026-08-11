/**
 * @module shared/types
 * @description
 * App-level types shared across middleware, controllers, and services.
 */

/**
 * A user's role. Kept as a plain string-literal union rather than a
 * re-export of the Prisma-generated `UserRole` enum, so that files
 * outside the data-access layer don't need a dependency on the
 * generated Prisma client purely for a type. Must be kept in sync by
 * hand with `enum UserRole` in `prisma/models/user.prisma` — a
 * two-value union, not worth generating.
 */
export type Role = 'ADMIN' | 'STUDENT';

/**
 * The trusted identity attached to `req.user` by
 * {@link module:shared/middleware/auth.middleware.requireAuth}. Only
 * ever constructed from a verified JWT payload — code elsewhere in
 * the app should never build one by hand.
 */
export interface AuthUser {
	id: string;
	role: Role;
	/** JWT `iat` claim (unix seconds). Reserved for future use, e.g.
	 *  invalidating tokens issued before a password change; not
	 *  currently enforced. */
	issuedAt: number;
}
