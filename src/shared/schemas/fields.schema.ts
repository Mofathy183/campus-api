import * as z from 'zod';

/**
 * FieldsSchema
 * ------------
 * Small set of reusable field-level validators, following the same
 * pattern as Beggy's packages/shared/src/schemas/fields.schema.ts —
 * trimmed to only what campus-api's four feature schemas actually need.
 *
 * Kept in shared/ (a domain folder, not a type folder — see the naming
 * convention doc) because these are cross-cutting primitives, not
 * feature-specific validation.
 */
export const FieldsSchema = {
	email: () => z.email().trim().toLowerCase(),

	/**
	 * Password rules kept intentionally simple — the spec doesn't ask
	 * for a password-strength bonus, only that auth work.
	 */
	password: () => z.string().min(8).max(72).trim(),

	name: (label: string) =>
		z
			.string()
			.trim()
			.min(1, `${label} is required`)
			.max(50, `${label} must be 50 characters or fewer`),

	uuid: () => z.uuid(),

	/**
	 * Institution-facing student identifier — not a UUID, so it gets
	 * its own shape check rather than reusing `uuid()`.
	 */
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
};

/**
 * Shared params schema for the common `:id` route param, reused across
 * all four feature routers — matches Beggy's ParamsSchema.uuid pattern.
 */
export const ParamsSchema = {
	uuid: z.object({
		id: FieldsSchema.uuid(),
	}),
};

/**
 * Shared pagination query schema — promoted here (per the folder-pattern
 * decision log: "only promote a schema to shared/ if two+ features import
 * the exact same one") because Students, Courses, and Assignments list
 * endpoints all use the same page/limit shape.
 */
export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});
