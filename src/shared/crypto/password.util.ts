import { hash, compare } from 'bcryptjs';
import { envConfig } from '@config';
import { appErrorMap, ErrorCode } from '@shared/errors';

const { saltRounds } = envConfig.security.bcrypt;

/**
 * password.util.ts
 * ------------------
 * Reused as-is from Beggy (beggy-reuse-audit.html §2) — plain bcrypt
 * wrapper, zero coupling to any domain model. Copied verbatim.
 */
export const hashPassword = async (password: string): Promise<string> => {
	try {
		return await hash(password, saltRounds);
	} catch (error) {
		throw appErrorMap.serverError(ErrorCode.PASSWORD_HASH_FAILED, error);
	}
};

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
