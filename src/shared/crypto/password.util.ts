import { hash, compare } from 'bcryptjs';
import { envConfig } from '@config';
import { appErrorMap, ErrorCode } from '@shared/errors';

const { saltRounds } = envConfig.security.bcrypt;

/**
 * @module shared/crypto/password.util
 * @description
 * Thin, dependency-isolated wrapper around bcrypt hashing/verification.
 * Keeping this behind two small functions means the hashing library
 * can be swapped without touching any caller.
 */

/**
 * Hashes a plaintext password with bcrypt using the configured salt
 * round count.
 *
 * @param password - Plaintext password to hash.
 * @returns The bcrypt hash string, safe to persist.
 * @throws {AppError} `PASSWORD_HASH_FAILED` if bcrypt throws internally.
 */
export const hashPassword = async (password: string): Promise<string> => {
	try {
		return await hash(password, saltRounds);
	} catch (error) {
		throw appErrorMap.serverError(ErrorCode.PASSWORD_HASH_FAILED, error);
	}
};

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 *
 * @param password - Plaintext password supplied by the client.
 * @param hashedPassword - Previously stored bcrypt hash to compare against.
 * @returns `true` if the password matches; `false` if it doesn't or if
 * `hashedPassword` is empty.
 * @throws {AppError} `PASSWORD_VERIFY_FAILED` if bcrypt throws internally.
 */
export const verifyPassword = async (
	password: string,
	hashedPassword: string
): Promise<boolean> => {
	if (!hashedPassword) return false;
	try {
		return await compare(password, hashedPassword);
	} catch (error) {
		throw appErrorMap.serverError(ErrorCode.PASSWORD_VERIFY_FAILED, error);
	}
};
