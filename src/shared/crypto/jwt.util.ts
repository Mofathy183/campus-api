import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { envConfig } from '@config';
import { appErrorMap, ErrorCode } from '@shared/errors';
import type { AuthUser, Role } from '@shared/types';

const { secret, signOptions } = envConfig.security.jwt.access;
const verifyOptions = envConfig.security.jwt.base;

/**
 * @module shared/crypto/jwt.util
 * @description
 * Signs and verifies the single access token used for authentication.
 * The API issues one stateless bearer token per login with a flat
 * expiry (`JWT_ACCESS_TOKEN_EXPIRES_IN`) rather than a refresh-token
 * pair — appropriate for a service with no browser session to persist
 * across page loads.
 */

/**
 * Signs a new access token for the given user.
 *
 * @param userId - The authenticated user's id, embedded as the `sub` claim.
 * @param role - The user's role, embedded as a custom `role` claim.
 * @returns A signed JWT string.
 */
export const signAccessToken = (userId: string, role: Role): string =>
	jwt.sign({ sub: userId, role }, secret, signOptions as SignOptions);

/**
 * Verifies an access token and extracts a trusted {@link AuthUser}
 * from its payload.
 *
 * Bad signatures and expired tokens surface as `JsonWebTokenError` /
 * `TokenExpiredError` thrown directly by `jsonwebtoken` — this
 * function does not catch or re-wrap them, letting
 * {@link module:shared/errors/error.handler} translate them into the
 * appropriate 401 response. A structurally valid but semantically
 * malformed payload (missing `sub`/`iat`, or an unrecognized `role`)
 * is rejected explicitly as `TOKEN_INVALID`.
 *
 * @param token - The raw JWT string (without the `Bearer ` prefix).
 * @returns The verified user identity extracted from the token payload.
 * @throws {import('jsonwebtoken').TokenExpiredError} If the token has expired.
 * @throws {import('jsonwebtoken').JsonWebTokenError} If the signature or claims are invalid.
 * @throws {AppError} `TOKEN_INVALID` if the payload is well-formed JWT but doesn't match the expected shape.
 */
export const verifyAccessToken = (token: string): AuthUser => {
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
