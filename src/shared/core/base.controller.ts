import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import { appErrorMap, ErrorCode } from '@shared/errors';
import { apiResponseMap, type PaginationMeta } from '@shared/utils';
import { logger } from '@shared/middleware';
import type { AuthUser } from '@shared/types';

/** An Express `Request` known to carry an authenticated user. */
export type AuthenticatedRequest = Request & { user: AuthUser };

interface BaseControllerOptions {
	domain: string;
	controller: string;
}

/**
 * @module shared/core/base.controller
 * @description
 * Abstract base class for feature controllers, providing a scoped
 * logger, authenticated-request helpers, and consistent response
 * helpers so every route handler stays thin and delegates business
 * logic to its service.
 */

/**
 * Base class every feature controller (`students.controller.ts`,
 * `courses.controller.ts`, etc.) extends. Centralizes the pieces of a
 * route handler that are identical across every feature: scoped
 * logging, asserting the request is authenticated, reading route
 * params, and writing a response in the API's standard envelope.
 */
export abstract class BaseController {
	protected readonly log: Logger;

	protected constructor(options: BaseControllerOptions) {
		this.log = logger.child({
			domain: options.domain,
			controller: options.controller,
		});
	}

	/**
	 * Asserts that {@link module:shared/middleware/auth.middleware.requireAuth}
	 * has already populated `req.user`, and narrows the request type
	 * accordingly. After this call, `req.user` no longer requires
	 * optional chaining.
	 *
	 * @throws {AppError} `UNAUTHORIZED` if `req.user` is missing — this
	 * indicates a route was not correctly protected by `requireAuth`
	 * upstream, not a normal client error.
	 */
	protected assertAuthenticated(
		req: Request
	): asserts req is AuthenticatedRequest {
		if (!req.user) {
			this.log.error(
				{ path: req.path },
				'Missing authenticated user context'
			);
			throw appErrorMap.unauthorized(ErrorCode.UNAUTHORIZED);
		}
	}

	/** Returns the authenticated user's id, asserting authentication first. */
	protected getUserId(req: Request): string {
		this.assertAuthenticated(req);
		return req.user.id;
	}

	/** Reads a route param, defaulting to `id`. */
	protected getParam(req: Request, name: string = 'id'): string {
		return req.params[name] as string;
	}

	/** Sends a `200 OK` response in the standard success envelope. */
	protected ok<T>(
		res: Response,
		data: T,
		message = 'Request successful',
		meta?: PaginationMeta
	): void {
		res.status(200).json(apiResponseMap.ok<T>(data, message, meta));
	}

	/** Sends a `201 Created` response in the standard success envelope. */
	protected created<T>(
		res: Response,
		data: T,
		message = 'Resource created'
	): void {
		res.status(201).json(apiResponseMap.created<T>(data, message));
	}

	/** Sends a `204 No Content` response. */
	protected noContent(res: Response): void {
		res.sendStatus(204);
	}
}
