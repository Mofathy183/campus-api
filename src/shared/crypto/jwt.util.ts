import jwt, { type JwtPayload , type SignOptions } from 'jsonwebtoken';
import { envConfig } from '@config';
import { appErrorMap, ErrorCode } from '@shared/errors';
import type { AuthUser, Role } from '@shared/types';

const { secret, signOptions } = envConfig.security.jwt.access;
const verifyOptions = envConfig.security.jwt.base;

/**
 * jwt.util.ts
 * -------------
 * Adjusted from Beggy's token.util.ts (beggy-reuse-audit.html §3):
 * kept the sign/verify shape and the defensive UUID + role validation
 * on the payload — good practice worth keeping. Deleted
 * signRefreshToken / verifyRefreshToken and the rememberMe branching
 * entirely; POST /login issues exactly one token per the spec, with a
 * reasonable flat expiry (JWT_ACCESS_TOKEN_EXPIRES_IN, default "1d")
 * instead of refresh-token rotation.
 */
export const signAccessToken = (userId: string, role: Role): string =>
	jwt.sign({ sub: userId, role }, secret, signOptions as SignOptions);

export const verifyAccessToken = (token: string): AuthUser => {
	// jwt.verify throws JsonWebTokenError/TokenExpiredError directly on
	// bad signature/expiry — let those propagate to error.handler.ts
	// rather than re-wrapping them here.
	const payload = jwt.verify(token, secret, verifyOptions) as JwtPayload;

	if (typeof payload.sub !== 'string' || typeof payload.iat !== 'number') {
		throw appErrorMap.unauthorized(ErrorCode.TOKEN_INVALID);
	}

	const role = payload['role'] as Role;
	if (role !== 'ADMIN' && role !== 'STUDENT') {
		throw appErrorMap.unauthorized(ErrorCode.TOKEN_INVALID);
	}

	return { id: payload.sub, role, issuedAt: payload.iat };
};
