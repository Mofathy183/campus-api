import { describe, it, expect } from 'vitest';
import { AssignmentQuerySchema } from '../assignments.schema';

describe('AssignmentQuerySchema', () => {
	it('defaults page/limit and omits filters when not provided', () => {
		expect(AssignmentQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
	});

	it('accepts status, studentId, and search together', () => {
		const studentId = crypto.randomUUID();
		const result = AssignmentQuerySchema.parse({
			status: 'PENDING',
			studentId,
			search: 'homework',
		});

		expect(result).toMatchObject({
			status: 'PENDING',
			studentId,
			search: 'homework',
		});
	});

	it('rejects an invalid status value', () => {
		expect(() =>
			AssignmentQuerySchema.parse({ status: 'NOT_A_STATUS' })
		).toThrow();
	});

	it('rejects a malformed studentId', () => {
		expect(() =>
			AssignmentQuerySchema.parse({ studentId: 'not-a-uuid' })
		).toThrow();
	});

	it('trims the search term', () => {
		const result = AssignmentQuerySchema.parse({ search: '  homework  ' });
		expect(result.search).toBe('homework');
	});
});
