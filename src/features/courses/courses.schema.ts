import * as z from 'zod';
import { FieldsSchema, PaginationSchema } from '@shared/schemas';

/**
 * @module features/courses/courses.schema
 * @description
 * Zod validation for the courses feature. Only a `Create` schema is
 * defined — the spec's endpoint list for this feature is
 * `GET /courses`, `GET /courses/:id`, `POST /courses` only, so there
 * is no `PUT`/`PATCH` payload to validate against. If an update route
 * is ever added, its schema belongs here, following the same
 * "all fields optional + `.refine()` at-least-one" shape used by
 * `UpdateStudentSchema` in `students.schema.ts`.
 *
 * `CourseQuerySchema` extends the shared pagination shape with an
 * optional free-text `search` (matched against `title`/`code`) and
 * an optional exact-match `code` filter for `GET /courses`.
 */

/**
 * Request body for `POST /courses`.
 *
 * `code` is the institution-facing identifier (e.g. `"CS201"`) and is
 * the field enforced unique at the database level (`courses.code` in
 * `course.prisma`) — a duplicate is therefore rejected as
 * `COURSE_CODE_ALREADY_EXISTS` via the Prisma `P2002` mapping in
 * `error.handler.ts`, not by a schema-level uniqueness check (Zod has
 * no visibility into the database).
 *
 * `description` is optional: a course can be created with just a
 * code and title and have its description filled in later, once a
 * `PUT`/`PATCH` route exists for that.
 */
export const CreateCourseSchema = z.object({
	code: FieldsSchema.courseCode(),
	title: FieldsSchema.title(),
	description: FieldsSchema.description(),
});

/** Validated, parsed shape of a `POST /courses` request body. */
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

/**
 * Query params for `GET /courses`. Extends the shared pagination
 * shape with:
 * - `search` — free-text, matched against `title` and `code`.
 * - `code` — exact-match filter on the institution-facing course code
 *   (reuses `FieldsSchema.courseCode()` so an invalid shape like
 *   `"$$"` fails validation before it ever reaches Prisma).
 *
 * Both are optional and independent — a request can supply either,
 * both, or neither.
 *
 * @example
 * GET /courses?search=CS201&code=CS201
 */
export const CourseQuerySchema = PaginationSchema.extend({
	search: FieldsSchema.search(),
	code: FieldsSchema.courseCode().optional(),
});

export type CourseQueryInput = z.infer<typeof CourseQuerySchema>;
