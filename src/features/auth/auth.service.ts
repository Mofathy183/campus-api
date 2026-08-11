import type { User, Student } from '@prisma-generated/client';
import { prisma } from '@config';
import { BaseService } from '@shared/core';
import { appErrorMap, ErrorCode } from '@shared/errors';
import { verifyPassword, signAccessToken } from '@shared/crypto';
import type { Role } from '@shared/types';

/**
 * @module features/auth/auth.service
 * @description Business logic for authentication. Currently a single
 * operation — verifying credentials and issuing an access token —
 * since there is no registration flow in this feature (see
 * `students.service.ts` for user provisioning).
 */

type UserWithStudent = User & { student: Student | null };

/** The user shape returned to the client — never includes `hashedPassword`. */
export interface SafeUser {
	id: string;
	email: string;
	role: Role;
	student: {
		id: string;
		firstName: string;
		lastName: string;
		studentCode: string;
	} | null;
}

export interface LoginResult {
	accessToken: string;
	user: SafeUser;
}

export class AuthService extends BaseService {
	constructor() {
		super({ domain: 'auth', service: 'AuthService' });
	}

	/**
	 * Verifies email/password and issues an access token.
	 *
	 * `verifyPassword` is always called — even when no user is found,
	 * against an empty hash — so a nonexistent email and a wrong
	 * password fail through the same code path rather than one being
	 * visibly faster than the other. (bcrypt is skipped only in the
	 * "no user" case, since `verifyPassword` short-circuits on an
	 * empty hash — a known, accepted trade-off for this scope.)
	 *
	 * @throws {AppError} `INVALID_CREDENTIALS` if the email doesn't
	 * match a user or the password doesn't match.
	 */
	async login(email: string, password: string): Promise<LoginResult> {
		const user = await prisma.user.findUnique({
			where: { email },
			include: { student: true },
		});

		const isValid = await verifyPassword(
			password,
			user?.hashedPassword ?? ''
		);

		if (!user || !isValid) {
			this.log.warn({ email }, 'Login failed: invalid credentials');
			throw appErrorMap.unauthorized(ErrorCode.INVALID_CREDENTIALS);
		}

		const accessToken = signAccessToken(user.id, user.role);
		return { accessToken, user: this.toSafeUser(user) };
	}

	private toSafeUser(user: UserWithStudent): SafeUser {
		return {
			id: user.id,
			email: user.email,
			role: user.role,
			student: user.student
				? {
						id: user.student.id,
						firstName: user.student.firstName,
						lastName: user.student.lastName,
						studentCode: user.student.studentCode,
					}
				: null,
		};
	}
}
