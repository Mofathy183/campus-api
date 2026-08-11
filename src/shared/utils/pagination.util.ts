import { PaginationSchema } from '@shared/schemas';
import type { PaginationMeta } from '@shared/utils';

/**
 * @module shared/utils/pagination.util
 * @description
 * Page/limit pagination for list endpoints. A plain function pair
 * rather than middleware — each feature's list controller calls
 * {@link getPagination} directly against `req.query`, then
 * {@link buildPaginationMeta} once the total row count is known.
 *
 * @example
 * ```ts
 * const { skip, take, page, limit } = getPagination(req.query);
 * const [items, count] = await Promise.all([
 *   prisma.student.findMany({ skip, take }),
 *   prisma.student.count(),
 * ]);
 * this.ok(res, items, 'Students fetched', buildPaginationMeta(page, limit, count));
 * ```
 */

/** Resolved pagination parameters ready to pass to a Prisma query. */
export interface PaginationPayload {
	page: number;
	limit: number;
	skip: number;
	take: number;
}

/**
 * Parses and validates `page`/`limit` from a raw query object (via
 * {@link PaginationSchema}) and derives the corresponding Prisma
 * `skip`/`take` values.
 *
 * @param query - The raw `req.query` object.
 * @returns Validated page/limit plus derived `skip`/`take`.
 * @throws {import('zod').ZodError} If `page` or `limit` fail validation.
 */
export const getPagination = (query: unknown): PaginationPayload => {
	const { page, limit } = PaginationSchema.parse(query);
	return { page, limit, skip: (page - 1) * limit, take: limit };
};

/**
 * Builds the {@link PaginationMeta} block attached to a paginated
 * list response, given the current page, page size, and total row
 * count.
 */
export const buildPaginationMeta = (
	page: number,
	limit: number,
	count: number
): PaginationMeta => ({
	page,
	limit,
	count,
	hasNextPage: page * limit < count,
	hasPreviousPage: page > 1,
});
