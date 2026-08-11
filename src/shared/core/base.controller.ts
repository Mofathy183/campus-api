import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import { appErrorMap, ErrorCode } from '@shared/errors';
import { apiResponseMap, type PaginationMeta } from '@shared/utils';
import { logger } from '@shared/middleware';
import type { AuthUser } from '@shared/types';

export type AuthenticatedRequest = Request & { user: AuthUser };

interface BaseControllerOptions {
	domain: string;
	controller: string;
}

/**
 * BaseController
 * ----------------
 * Trimmed from Beggy's base.controller.ts (beggy-reuse-audit.html §2).
 *
 * Dropped entirely:
 *  - `assertOAuthProfile` / `isOAuthProfile` — no OAuth callbacks exist
 *    in this API, so there's no `req.user` shape other than AuthUser.
 *  - `getOrderBy<T>()` — no orderBy/filter query infra; list endpoints
 *    only need pagination (see shared/utils/pagination.util.ts, called
 *    directly rather than pulled off `req`).
 *
 * Kept: scoped logging, assertAuthenticated/getUserId (used by every
 * protected route), getParam, and the ok/created/noContent response
 * helpers — the same repetition-eliminating win across all four
 * feature controllers (auth, students, courses, assignments).
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
	 * Asserts `req.user` was set by `requireAuth` and narrows the type.
	 * After this call, `req.user` no longer needs optional chaining.
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

	protected getUserId(req: Request): string {
		this.assertAuthenticated(req);
		return req.user.id;
	}

	protected getParam(req: Request, name: string = 'id'): string {
		return req.params[name] as string;
	}

	protected ok<T>(
		res: Response,
		data: T,
		message = 'Request successful',
		meta?: PaginationMeta
	): void {
		res.status(200).json(apiResponseMap.ok<T>(data, message, meta));
	}

	protected created<T>(
		res: Response,
		data: T,
		message = 'Resource created'
	): void {
		res.status(201).json(apiResponseMap.created<T>(data, message));
	}

	protected noContent(res: Response): void {
		res.sendStatus(204);
	}
}
