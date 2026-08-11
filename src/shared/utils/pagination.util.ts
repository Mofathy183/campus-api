import { PaginationSchema } from '@shared/schemas';
import type { PaginationMeta } from '@shared/utils';

export interface PaginationPayload {
	page: number;
	limit: number;
	skip: number;
	take: number;
}

/**
 * pagination.util.ts
 * --------------------
 * Adjusted from Beggy's pagination.util.ts (beggy-reuse-audit.html
 * §3). Reuses the same page/limit shape and validation
 * (shared/schemas/fields.schema.ts's PaginationSchema), but stays a
 * plain function instead of Express middleware — Beggy's version was
 * written against its list-query middleware chain (orderBy/filter
 * infra) that campus-api doesn't have, so recreating that chain just
 * to hang pagination off it isn't worth it in a 48h window.
 *
 * Call this directly inside each feature's list controller:
 *
 *   const { skip, take, page, limit } = getPagination(req.query);
 *   const [items, count] = await Promise.all([
 *     prisma.student.findMany({ skip, take }),
 *     prisma.student.count(),
 *   ]);
 *   this.ok(res, items, 'Students fetched', buildPaginationMeta(page, limit, count));
 */
export const getPagination = (query: unknown): PaginationPayload => {
	const { page, limit } = PaginationSchema.parse(query);
	return { page, limit, skip: (page - 1) * limit, take: limit };
};

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
