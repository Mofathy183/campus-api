import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@shared/crypto';
import { appErrorMap, ErrorCode } from '@shared/errors';
import type { AuthUser } from '@shared/types';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			user?: AuthUser;
		}
	}
}

/**
 * @module shared/middleware/auth.middleware
 * @description
 * Bearer-token authentication middleware. Reads
 * `Authorization: Bearer <token>`, verifies it, and attaches the
 * resulting {@link AuthUser} to `req.user` for downstream handlers.
 */

/**
 * Requires a valid bearer access token on the incoming request.
 *
 * On success, attaches the verified {@link AuthUser} to `req.user`
 * and calls `next()`. On failure, forwards an error to
 * {@link module:shared/errors/error.handler.errorHandler} — either a
 * `TOKEN_MISSING` {@link AppError} if no token was supplied, or the
 * raw JWT verification error otherwise (handled explicitly there).
 *
 * @route Applied to every protected route.
 */
export const requireAuth = (
	req: Request,
	_res: Response,
	next: NextFunction
): void => {
	const header = req.headers.authorization;
	const token = header?.startsWith('Bearer ')
		? header.slice('Bearer '.length)
		: undefined;

	if (!token) {
		next(appErrorMap.unauthorized(ErrorCode.TOKEN_MISSING));
		return;
	}

	try {
		req.user = verifyAccessToken(token);
		next();
	} catch (error) {
		next(error);
	}
};
