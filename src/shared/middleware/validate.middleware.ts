import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ParamsSchema } from '@shared/schemas';

/**
 * @module shared/middleware/validate.middleware
 * @description
 * Zod-backed request validation middleware, applied per-route to
 * `body`, `query`, and/or `params`. Validation failures are forwarded
 * to `next()` as raw `ZodError`s; formatting them into the API's
 * error shape is {@link module:shared/errors/error.handler}'s
 * responsibility, not this module's.
 */

interface ValidationSchema {
	body?: ZodType;
	query?: ZodType;
	params?: ZodType;
}

/**
 * Builds an Express middleware that validates the given parts of a
 * request against the supplied Zod schemas, replacing each validated
 * part with its parsed (and possibly coerced/defaulted) value.
 *
 * @param schema - Zod schemas keyed by request part to validate.
 * @returns An async Express middleware.
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

/** Convenience wrapper for validating only `req.body`. */
export const validateBody = (schema: ZodType) =>
	validateRequest({ body: schema });

/** Convenience wrapper for validating only `req.query`. */
export const validateQuery = (schema: ZodType) =>
	validateRequest({ query: schema });

/** Convenience wrapper for validating only `req.params`. */
export const validateParams = (schema: ZodType) =>
	validateRequest({ params: schema });

/**
 * Pre-built middleware for the common `:id` route param, reused
 * across every feature router that exposes a `GET/PUT/DELETE /:id`
 * endpoint.
 *
 * @example
 * ```ts
 * router.get('/:id', validateUuidParam, controller.getById);
 * ```
 */
export const validateUuidParam = validateRequest({ params: ParamsSchema.uuid });
