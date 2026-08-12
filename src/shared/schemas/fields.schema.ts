import * as z from 'zod';

/**
 * @module shared/schemas/fields.schema
 * @description
 * Reusable field-level Zod validators shared across the four feature
 * schemas (auth, students, courses, assignments), plus the two schema
 * objects promoted to shared status because more than one feature
 * needs the exact same shape: `:id` route params and list-endpoint
 * pagination.
 */

/**
 * Reusable field-level validators. Grouped as an object (rather than
 * individual exports) so call sites read as `FieldsSchema.email()`,
 * making the origin of each primitive obvious at the point of use.
 */
export const FieldsSchema = {
	email: () =>
		z.preprocess(
			(val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
			z.email()
		),

	/** Deliberately simple — no password-strength policy is required
	 *  beyond a sane minimum/maximum length. */
	password: () => z.string().trim().min(8).max(72),

	name: (label: string) =>
		z
			.string()
			.trim()
			.min(1, `${label} is required`)
			.max(50, `${label} must be 50 characters or fewer`),

	uuid: () => z.uuid(),

	/** Institution-facing student identifier — not a UUID, so it gets
	 *  its own shape check rather than reusing `uuid()`. */
	studentCode: () =>
		z
			.string()
			.trim()
			.min(3)
			.max(20)
			.regex(
				/^[A-Z0-9-]+$/i,
				'studentCode may only contain letters, numbers, and hyphens'
			),

	courseCode: () =>
		z
			.string()
			.trim()
			.min(2)
			.max(20)
			.regex(
				/^[A-Z0-9-]+$/i,
				'code may only contain letters, numbers, and hyphens'
			),

	title: (max = 150) => z.string().trim().min(1).max(max),

	description: () => z.string().trim().max(2000).optional(),

	/**
	 * Free-text search term for list-endpoint `?search=` query params.
	 * Trimmed and length-capped so a pathological query string can't
	 * be handed straight to a Prisma `contains` filter; optional —
	 * absence means "no search filter applied". Shared across
	 * students/courses/assignments query schemas rather than
	 * redefined per feature, since the shape (and its constraints)
	 * never varies by domain.
	 *
	 * @example
	 * ```ts
	 * export const StudentQuerySchema = PaginationSchema.extend({
	 *   search: FieldsSchema.search(),
	 * });
	 * ```
	 */
	search: () => z.string().trim().min(1).max(100).optional(),
};

/**
 * Shared schema for the common `:id` route param, reused across every
 * feature router that exposes a `GET/PUT/DELETE /:id`-style endpoint.
 */
export const ParamsSchema = {
	uuid: z.object({
		id: FieldsSchema.uuid(),
	}),
};

/**
 * Shared pagination query schema. Promoted out of any single feature
 * because the students, courses, and assignments list endpoints all
 * accept the identical `?page=&limit=` shape.
 */
export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});
