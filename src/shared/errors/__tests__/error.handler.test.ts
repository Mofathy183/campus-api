import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { type ZodError, z } from 'zod';
import { Prisma } from '@prisma-generated/client';

import { errorHandler, AppError, ErrorCode, STATUS_CODE } from '@shared/errors';

const mockResponse = (): Response => {
	const res = {} as Response;
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

const mockRequest = { path: '/test' } as Request;
const mockNext = vi.fn() as NextFunction;

describe('errorHandler', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('known errors', () => {
		it('returns a normalized error response for application errors', () => {
			const err = new AppError(
				ErrorCode.FORBIDDEN,
				STATUS_CODE.FORBIDDEN,
				{
					reason: 'not-owner',
				}
			);

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.FORBIDDEN);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					code: ErrorCode.FORBIDDEN,
				})
			);
		});

		it('returns bad request for invalid request data (ZodError)', () => {
			const schema = z.object({ email: z.email() });

			let err: ZodError;
			try {
				schema.parse({ email: 'invalid' });
			} catch (e) {
				err = e as ZodError;
			}

			const res = mockResponse();
			errorHandler(err!, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: ErrorCode.INVALID_REQUEST_DATA,
				})
			);
		});
	});

	describe('JWT errors', () => {
		it('returns unauthorized when the token is expired', () => {
			const err = new jwt.TokenExpiredError('jwt expired', new Date());

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.UNAUTHORIZED);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ code: ErrorCode.TOKEN_EXPIRED })
			);
		});

		it('returns unauthorized when the token is invalid', () => {
			const err = new jwt.JsonWebTokenError('invalid token');

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.UNAUTHORIZED);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ code: ErrorCode.TOKEN_INVALID })
			);
		});
	});

	describe('Prisma errors (prismaErrorMap, exercised through errorHandler)', () => {
		it('maps unique email violations to conflict errors', () => {
			const err = new Prisma.PrismaClientKnownRequestError(
				'Unique constraint',
				{
					code: 'P2002',
					clientVersion: '7',
					meta: { target: ['email'] },
				}
			);

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.CONFLICT);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: ErrorCode.EMAIL_ALREADY_EXISTS,
				})
			);
		});

		it('maps unique student_code violations to conflict errors', () => {
			const err = new Prisma.PrismaClientKnownRequestError(
				'Unique constraint',
				{
					code: 'P2002',
					clientVersion: '7',
					meta: { target: ['student_code'] },
				}
			);

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.CONFLICT);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: ErrorCode.STUDENT_CODE_ALREADY_EXISTS,
				})
			);
		});

		it('maps unique course code violations to conflict errors', () => {
			const err = new Prisma.PrismaClientKnownRequestError(
				'Unique constraint',
				{
					code: 'P2002',
					clientVersion: '7',
					meta: { target: ['code'] },
				}
			);

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.CONFLICT);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: ErrorCode.COURSE_CODE_ALREADY_EXISTS,
				})
			);
		});

		it('falls back to a generic conflict code for unrecognized unique targets', () => {
			const err = new Prisma.PrismaClientKnownRequestError(
				'Unique constraint',
				{
					code: 'P2002',
					clientVersion: '7',
					meta: { target: ['some_other_field'] },
				}
			);

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: ErrorCode.RESOURCE_ALREADY_EXISTS,
				})
			);
		});

		it('maps missing records (P2025) to not-found errors', () => {
			const err = new Prisma.PrismaClientKnownRequestError('Not found', {
				code: 'P2025',
				clientVersion: '7',
			});

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ code: ErrorCode.RESOURCE_NOT_FOUND })
			);
		});

		it('maps foreign key violations (P2003) to bad request errors', () => {
			const err = new Prisma.PrismaClientKnownRequestError(
				'FK violation',
				{
					code: 'P2003',
					clientVersion: '7',
				}
			);

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: ErrorCode.INVALID_RELATION_REFERENCE,
				})
			);
		});

		it('maps prisma initialization errors to database connection failed', () => {
			const err = new Prisma.PrismaClientInitializationError(
				'DB unreachable',
				'7'
			);

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: ErrorCode.DATABASE_CONNECTION_FAILED,
				})
			);
		});

		it('maps critical prisma engine errors to database error', () => {
			const err = new Prisma.PrismaClientUnknownRequestError(
				'engine failure',
				{ clientVersion: '7' }
			);

			const res = mockResponse();
			errorHandler(err, mockRequest, res, mockNext);

			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ code: ErrorCode.DATABASE_ERROR })
			);
		});
	});

	it('returns internal server error for unknown errors', () => {
		const err = new Error('something exploded');

		const res = mockResponse();
		errorHandler(err, mockRequest, res, mockNext);

		expect(res.status).toHaveBeenCalledWith(STATUS_CODE.INTERNAL_ERROR);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ code: ErrorCode.INTERNAL_SERVER_ERROR })
		);
	});
});
