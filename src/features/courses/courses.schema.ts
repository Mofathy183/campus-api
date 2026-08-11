import * as z from 'zod';
import { FieldsSchema } from '@shared/schemas';

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
