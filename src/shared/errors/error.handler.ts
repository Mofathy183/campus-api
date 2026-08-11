import type { NextFunction, Request, Response } from 'express';
import { ZodError, treeifyError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Prisma } from '@prisma-generated/client';

import { AppError, STATUS_CODE, ErrorCode } from './index';
import { createResponse } from '@shared/utils';
import { logger } from '@shared/middleware';

/**
 * @module shared/errors/error.handler
 * @description
 * Central Express error-handling middleware. Every error in the
 * application — thrown explicitly or bubbled up from Prisma, Zod, or
 * `jsonwebtoken` — is normalized here into the API's consistent
 * `{ success: false, message }` response shape. Must be registered
 * last in the middleware chain, after the 404 handler.
 */

/**
 * Maps a Prisma client error to an {@link AppError}, or returns `null`
 * if the error isn't one this handler recognizes.
 *
 * Unique-constraint violations (`P2002`) are disambiguated by which
 * column triggered them, since the schema has three independently
 * unique fields across three tables (`users.email`,
 * `students.student_code`, `courses.code`).
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
 * Express error-handling middleware. Normalizes any error reaching it
 * into the API's standard JSON error shape and an appropriate HTTP
 * status code, in priority order:
 *
 * 1. {@link AppError} — already normalized; serialize as-is.
 * 2. `ZodError` — request-shape validation failure → 400.
 * 3. JWT errors (`TokenExpiredError` / `JsonWebTokenError`) → 401.
 * 4. Prisma errors, via {@link prismaErrorMap} — constraint/connection
 *    failures.
 * 5. Anything else — logged with its full stack and returned as a
 *    generic 500, so internals are never leaked to the client.
 *
 * Must be the last middleware registered in `app.ts`, after the
 * unmatched-route handler.
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
