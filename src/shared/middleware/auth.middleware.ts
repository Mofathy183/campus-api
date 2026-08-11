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
 * auth.middleware.ts → requireAuth
 * ----------------------------------
 * This is the whole point of the auth-model switch documented in
 * beggy-reuse-audit.html §1/§3: Beggy's requireAuth reads
 * `req.authTokens.accessToken` (populated by a separate
 * authCookieParser middleware off `req.cookies`) and also initializes
 * a CASL ability via `defineAbilityFor`. Neither applies here —
 * campus-api has no cookie-parser in the stack and no RBAC.
 *
 * Reads `Authorization: Bearer <token>` directly, verifies it, attaches
 * `req.user`, or forwards a 401 AppError to error.handler.ts. ~15
 * lines total, same estimate as the audit called for.
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
		// jwt.verify's own JsonWebTokenError/TokenExpiredError propagate
		// here and are handled explicitly in error.handler.ts.
		next(error);
	}
};
