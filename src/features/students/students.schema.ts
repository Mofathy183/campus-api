import * as z from 'zod';
import { FieldsSchema } from '@shared/schemas';

/**
 * @module features/students/students.schema
 * @description Zod validation for the students feature. `Create`
 * covers the full account (User + Student) since there's no separate
 * registration endpoint; `Update` only touches Student profile
 * fields — email/password changes aren't in scope for this spec.
 */

export const CreateStudentSchema = z.object({
	email: FieldsSchema.email(),
	password: FieldsSchema.password(),
	firstName: FieldsSchema.name('First name'),
	lastName: FieldsSchema.name('Last name'),
	studentCode: FieldsSchema.studentCode(),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentSchema = z
	.object({
		firstName: FieldsSchema.name('First name').optional(),
		lastName: FieldsSchema.name('Last name').optional(),
		studentCode: FieldsSchema.studentCode().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'At least one field must be provided',
	});

export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;
