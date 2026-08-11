import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ParamsSchema } from '@shared/schemas';

interface ValidationSchema {
	body?: ZodType;
	query?: ZodType;
	params?: ZodType;
}

/**
 * validate.middleware.ts
 * -----------------------
 * Reused from Beggy's validator.middleware.ts factory pattern
 * (beggy-reuse-audit.html §2) — directly matches spec §7: "Zod on
 * every route: body, params, and query where relevant."
 *
 * Cut: Beggy's `reconstructQuery` dot-notation/nested-object parsing
 * (e.g. `?filter.status=PENDING` → `{ filter: { status } }`). Nothing
 * in this spec needs nested query params — pagination's just
 * `?page=1&limit=20` — so `req.query` is validated as a flat object.
 *
 * Validation errors are forwarded to `next()` as raw ZodErrors;
 * error.handler.ts (not this file) turns them into the spec's
 * `{ success: false, message }` shape.
 */
export const validateRequest =
	(schema: ValidationSchema) =>
	async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
		try {
			if (schema.body) {
				req.body = await schema.body.parseAsync(req.body);
			}
			if (schema.query) {
				const parsed = await schema.query.parseAsync(req.query);
				Object.assign(req.query, parsed);
			}
			if (schema.params) {
				req.params = (await schema.params.parseAsync(
					req.params
				)) as typeof req.params;
			}
			next();
		} catch (error) {
			next(error);
		}
	};

export const validateBody = (schema: ZodType) =>
	validateRequest({ body: schema });
export const validateQuery = (schema: ZodType) =>
	validateRequest({ query: schema });
export const validateParams = (schema: ZodType) =>
	validateRequest({ params: schema });

/**
 * Convenience middleware for the common `:id` route param, reused
 * across all four feature routers.
 *
 *   router.get('/:id', validateUuidParam, controller.getById);
 */
export const validateUuidParam = validateRequest({ params: ParamsSchema.uuid });
