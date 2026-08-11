import { describe, it, expect } from 'vitest';

import { createResponse, apiResponseMap } from '@shared/utils';
import { ErrorCode, ErrorMessages } from '@shared/errors';

describe('createResponse.success()', () => {
	it('returns a minimal success envelope', () => {
		const data = { id: '1' };

		const result = createResponse.success(data, 'Student created');

		expect(result).toEqual({
			success: true,
			message: 'Student created',
			data,
		});
	});

	it('includes meta only when provided', () => {
		const meta = {
			page: 1,
			limit: 20,
			count: 5,
			hasNextPage: false,
			hasPreviousPage: false,
		};

		const result = createResponse.success([], 'Students fetched', meta);

		expect(result.meta).toEqual(meta);
	});

	it('omits meta entirely when not provided', () => {
		const result = createResponse.success({}, 'ok');

		expect('meta' in result).toBe(false);
	});
});

describe('createResponse.error()', () => {
	it('returns a minimal error envelope with the catalog message', () => {
		const result = createResponse.error(ErrorCode.STUDENT_NOT_FOUND);

		expect(result).toEqual({
			success: false,
			message: ErrorMessages[ErrorCode.STUDENT_NOT_FOUND],
			code: ErrorCode.STUDENT_NOT_FOUND,
		});
	});

	it('includes `error` only when details are provided', () => {
		const result = createResponse.error(
			ErrorCode.INVALID_RELATION_REFERENCE,
			{ field: 'studentId' }
		);

		expect(result.error).toEqual({ field: 'studentId' });
	});

	it('omits `error` entirely when no details are given', () => {
		const result = createResponse.error(ErrorCode.UNAUTHORIZED);

		expect('error' in result).toBe(false);
	});

	it('allows a custom message override', () => {
		const result = createResponse.error(
			ErrorCode.INVALID_REQUEST_DATA,
			undefined,
			{ customMessage: 'Custom message' }
		);

		expect(result.message).toBe('Custom message');
	});
});

describe('apiResponseMap.ok()', () => {
	it('returns a success envelope with a default message', () => {
		const result = apiResponseMap.ok([{ id: 1 }]);

		expect(result.success).toBe(true);
		expect(result.message).toBe('Request successful');
	});

	it('accepts a custom message and pagination meta', () => {
		const meta = {
			page: 1,
			limit: 20,
			count: 1,
			hasNextPage: false,
			hasPreviousPage: false,
		};

		const result = apiResponseMap.ok([{ id: 1 }], 'Courses fetched', meta);

		expect(result.message).toBe('Courses fetched');
		expect(result.meta).toEqual(meta);
	});
});

describe('apiResponseMap.created()', () => {
	it('returns a success envelope with a default "created" message', () => {
		const result = apiResponseMap.created({ id: 1 });

		expect(result.success).toBe(true);
		expect(result.message).toBe('Resource created');
	});

	it('accepts a custom message', () => {
		const result = apiResponseMap.created({ id: 1 }, 'Assignment created');

		expect(result.message).toBe('Assignment created');
	});
});
