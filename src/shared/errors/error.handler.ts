import type { NextFunction, Request, Response } from 'express';
import { ZodError, treeifyError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Prisma } from '@prisma-generated/client';

import { AppError, STATUS_CODE, ErrorCode } from './index';
import { createResponse } from '@shared/utils';
import { logger } from '@shared/middleware';

/**
 * error.handler.ts
 * -----------------
 * Reused from Beggy's error.middleware.ts (beggy-reuse-audit.html §2)
 * — the priority chain (AppError → Zod → Prisma → fallback) is exactly
 * the "single error-handling middleware" the spec's §8 calls for.
 *
 * Dropped Beggy's separate `jwtErrorMap` function down to an inline
 * branch — no refresh-token edge cases to special-case, per the
 * bearer-token switch (beggy-reuse-audit.html §1/§3).
 *
 * The P2002 (unique constraint) branch is widened slightly from
 * Beggy's version to check for `student_code` and course `code` in
 * addition to `email`, since campus-api has three unique fields across
 * three different tables instead of Beggy's single `users.email`.
 */
const prismaErrorMap = (err: unknown): AppError | null => {
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		switch (err.code) {
			case 'P2002': {
				const target = Array.isArray(err.meta?.target)
					? (err.meta.target as string[])
					: [];

				if (target.includes('email')) {
					return new AppError(
						ErrorCode.EMAIL_ALREADY_EXISTS,
						STATUS_CODE.CONFLICT,
						err
					);
				}
				if (target.includes('student_code')) {
					return new AppError(
						ErrorCode.STUDENT_CODE_ALREADY_EXISTS,
						STATUS_CODE.CONFLICT,
						err
					);
				}
				if (target.includes('code')) {
					return new AppError(
						ErrorCode.COURSE_CODE_ALREADY_EXISTS,
						STATUS_CODE.CONFLICT,
						err
					);
				}
				return new AppError(
					ErrorCode.RESOURCE_ALREADY_EXISTS,
					STATUS_CODE.CONFLICT,
					err
				);
			}

			// P2001: record does not exist / P2025: required record not found
			case 'P2001':
			case 'P2025':
				return new AppError(
					ErrorCode.RESOURCE_NOT_FOUND,
					STATUS_CODE.NOT_FOUND,
					err
				);

			// Foreign key violation — e.g. PATCH /assignments/:id with a
			// studentId that doesn't exist.
			case 'P2003':
				return new AppError(
					ErrorCode.INVALID_RELATION_REFERENCE,
					STATUS_CODE.BAD_REQUEST,
					err
				);

			default:
				return new AppError(
					ErrorCode.DATABASE_ERROR,
					STATUS_CODE.INTERNAL_ERROR,
					err
				);
		}
	}

	if (err instanceof Prisma.PrismaClientInitializationError) {
		return new AppError(
			ErrorCode.DATABASE_CONNECTION_FAILED,
			STATUS_CODE.INTERNAL_ERROR,
			err
		);
	}

	if (
		err instanceof Prisma.PrismaClientRustPanicError ||
		err instanceof Prisma.PrismaClientUnknownRequestError
	) {
		return new AppError(
			ErrorCode.DATABASE_ERROR,
			STATUS_CODE.INTERNAL_ERROR,
			err
		);
	}

	return null;
};

/**
 * errorHandler
 * ------------
 * Priority order:
 *   1. AppError            — already normalized, trust it as-is
 *   2. ZodError             — request-shape validation failures (400)
 *   3. JWT errors           — expired/invalid bearer tokens (401)
 *   4. Prisma errors        — DB constraint/connection failures
 *   5. Fallback             — anything else → 500, logged with stack
 *
 * Must be registered LAST in app.ts, after the 404 handler.
 */
export const errorHandler = (
	err: unknown,
	req: Request,
	res: Response,
	_next: NextFunction
): void => {
	if (err instanceof AppError) {
		logger.warn(
			{ code: err.code, status: err.status, path: req.path },
			'Application error'
		);
		res.status(err.status).json(
			createResponse.error(err.code, err.details, err.options)
		);
		return;
	}

	if (err instanceof ZodError) {
		const tree = treeifyError(err);
		logger.warn({ path: req.path, tree }, 'Request validation failed');
		res.status(STATUS_CODE.BAD_REQUEST).json(
			createResponse.error(ErrorCode.INVALID_REQUEST_DATA, tree)
		);
		return;
	}

	if (err instanceof TokenExpiredError) {
		logger.warn({ path: req.path }, 'Access token expired');
		res.status(STATUS_CODE.UNAUTHORIZED).json(
			createResponse.error(ErrorCode.TOKEN_EXPIRED)
		);
		return;
	}

	if (err instanceof JsonWebTokenError) {
		logger.warn({ path: req.path }, 'Access token invalid');
		res.status(STATUS_CODE.UNAUTHORIZED).json(
			createResponse.error(ErrorCode.TOKEN_INVALID)
		);
		return;
	}

	const prismaError = prismaErrorMap(err);
	if (prismaError) {
		logger.error(
			{ code: prismaError.code, path: req.path },
			'Database error'
		);
		res.status(prismaError.status).json(
			createResponse.error(prismaError.code, prismaError.details)
		);
		return;
	}

	logger.error(
		{ path: req.path, error: err instanceof Error ? err.stack : err },
		'Unhandled error'
	);
	res.status(STATUS_CODE.INTERNAL_ERROR).json(
		createResponse.error(ErrorCode.INTERNAL_SERVER_ERROR)
	);
};
