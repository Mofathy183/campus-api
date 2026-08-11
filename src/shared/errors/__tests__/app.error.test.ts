import { describe, it, expect } from 'vitest';

import {
	AppError,
	appErrorMap,
	STATUS_CODE,
	ErrorCode,
	ErrorMessages,
} from '@shared/errors';

describe('AppError', () => {
	it('creates error with resolved message from the catalog', () => {
		const error = new AppError(
			ErrorCode.INVALID_REQUEST_DATA,
			STATUS_CODE.BAD_REQUEST
		);

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('AppError');
		expect(error.code).toBe(ErrorCode.INVALID_REQUEST_DATA);
		expect(error.status).toBe(STATUS_CODE.BAD_REQUEST);
		expect(error.message).toBe(
			ErrorMessages[ErrorCode.INVALID_REQUEST_DATA]
		);
	});

	it('uses custom message when provided', () => {
		const error = new AppError(
			ErrorCode.STUDENT_NOT_FOUND,
			STATUS_CODE.NOT_FOUND,
			undefined,
			{ customMessage: 'Custom message' }
		);

		expect(error.message).toBe('Custom message');
	});

	it('preserves underlying cause AND details when details is an Error', () => {
		const cause = new Error('Database failed');

		const error = new AppError(
			ErrorCode.DATABASE_ERROR,
			STATUS_CODE.INTERNAL_ERROR,
			cause
		);

		expect(error.cause).toBe(cause);
		expect(error.details).toBe(cause);
	});

	it('keeps a plain-object details value even though native cause is not set', () => {
		const details = { requestedPath: '/students/999', method: 'GET' };

		const error = new AppError(
			ErrorCode.RESOURCE_NOT_FOUND,
			STATUS_CODE.NOT_FOUND,
			details
		);

		expect(error.cause).toBeUndefined();
		expect(error.details).toEqual(details);
	});

	it('is immutable after creation', () => {
		const error = new AppError(
			ErrorCode.INVALID_REQUEST_DATA,
			STATUS_CODE.BAD_REQUEST
		);

		expect(Object.isFrozen(error)).toBe(true);
	});
});

describe('appErrorMap.notFound()', () => {
	it('creates error with 404 status', () => {
		const error = appErrorMap.notFound(ErrorCode.STUDENT_NOT_FOUND);

		expect(error).toBeInstanceOf(AppError);
		expect(error.status).toBe(STATUS_CODE.NOT_FOUND);
	});
});

describe('appErrorMap.badRequest()', () => {
	it('creates error with 400 status', () => {
		const error = appErrorMap.badRequest(ErrorCode.INVALID_REQUEST_DATA);

		expect(error.status).toBe(STATUS_CODE.BAD_REQUEST);
	});
});

describe('appErrorMap.unauthorized()', () => {
	it('creates error with 401 status', () => {
		const error = appErrorMap.unauthorized(ErrorCode.TOKEN_EXPIRED);

		expect(error.status).toBe(STATUS_CODE.UNAUTHORIZED);
	});
});

describe('appErrorMap.forbidden()', () => {
	it('creates error with 403 status', () => {
		const error = appErrorMap.forbidden(ErrorCode.FORBIDDEN);

		expect(error.status).toBe(STATUS_CODE.FORBIDDEN);
	});
});

describe('appErrorMap.conflict()', () => {
	it('creates error with 409 status', () => {
		const error = appErrorMap.conflict(ErrorCode.EMAIL_ALREADY_EXISTS);

		expect(error.status).toBe(STATUS_CODE.CONFLICT);
	});
});

describe('appErrorMap.serverError()', () => {
	it('creates error with 500 status', () => {
		const error = appErrorMap.serverError(ErrorCode.DATABASE_ERROR);

		expect(error.status).toBe(STATUS_CODE.INTERNAL_ERROR);
	});
});
