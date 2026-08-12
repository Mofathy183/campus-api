import * as z from 'zod';
import { FieldsSchema, PaginationSchema } from '@shared/schemas';

/**
 * @module features/assignments/assignments.schema
 * @description
 * Zod validation for the assignments feature. The spec's endpoint
 * list is `GET /assignments`, `POST /assignments`,
 * `PATCH /assignments/:id` only — there is no `GET /:id` or `DELETE`,
 * so no schema exists for those. `PATCH` is deliberately narrow: it
 * only accepts `status`, matching the model's doc comment
 * ("mutates this field to move an assignment through its lifecycle")
 * rather than acting as a general partial-update endpoint.
 *
 * `AssignmentQuerySchema` extends the shared pagination shape with an
 * optional exact-match `status` filter, an optional exact-match
 * `studentId` filter, and an optional free-text `search` (matched
 * against `title`) for `GET /assignments`.
 */

/** Mirrors the Prisma `AssignmentStatus` enum in `assignment.prisma`. */
export const AssignmentStatusEnum = z.enum([
	'PENDING',
	'SUBMITTED',
	'GRADED',
	'LATE',
]);

/**
 * Request body for `POST /assignments`.
 *
 * `studentId` references an existing `Student` — validated as a
 * well-formed UUID here; whether it actually exists is a database
 * concern, surfaced as `INVALID_RELATION_REFERENCE` via the Prisma
 * `P2003` mapping in `error.handler.ts` if it doesn't.
 *
 * `status` is intentionally omitted from create: every assignment
 * starts life as `PENDING` (the Prisma column default), so callers
 * can't create an assignment that's already `GRADED`.
 *
 * `dueAt` accepts an ISO datetime string and is optional, matching
 * the nullable `due_at` column.
 */
export const CreateAssignmentSchema = z.object({
	title: FieldsSchema.title(150),
	description: FieldsSchema.description(),
	studentId: FieldsSchema.uuid(),
	dueAt: z.iso.datetime().optional(),
});

/** Validated, parsed shape of a `POST /assignments` request body. */
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

/**
 * Request body for `PATCH /assignments/:id`.
 *
 * Single-field on purpose — the spec's `PATCH` is a status-transition
 * endpoint, not a general update. If title/description/dueAt editing
 * is ever needed, that's a distinct schema (and arguably a `PUT`),
 * not an expansion of this one.
 */
export const UpdateAssignmentStatusSchema = z.object({
	status: AssignmentStatusEnum,
});

/** Validated, parsed shape of a `PATCH /assignments/:id` request body. */
export type UpdateAssignmentStatusInput = z.infer<
	typeof UpdateAssignmentStatusSchema
>;

/**
 * Query params for `GET /assignments`. Extends the shared pagination
 * shape with:
 * - `status` — exact-match filter, reuses {@link AssignmentStatusEnum}
 *   so an invalid value (e.g. `"NOT_A_STATUS"`) fails validation
 *   before reaching Prisma.
 * - `studentId` — exact-match filter, scoping results to one student.
 * - `search` — free-text, matched against `title`.
 *
 * All three are optional and independent.
 *
 * @example
 * GET /assignments?status=PENDING&studentId=<uuid>&search=homework
 */
export const AssignmentQuerySchema = PaginationSchema.extend({
	status: AssignmentStatusEnum.optional(),
	studentId: FieldsSchema.uuid().optional(),
	search: FieldsSchema.search(),
});

export type AssignmentQueryInput = z.infer<typeof AssignmentQuerySchema>;
