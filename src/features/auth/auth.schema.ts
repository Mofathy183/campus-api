import * as z from 'zod';
import { FieldsSchema } from '@shared/schemas';

/**
 * @module features/auth/auth.schema
 * @description Zod validation for the auth feature's single endpoint,
 * POST /login.
 */

/** Request body for `POST /login`. */
export const LoginSchema = z.object({
	email: FieldsSchema.email(),
	password: FieldsSchema.password(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
