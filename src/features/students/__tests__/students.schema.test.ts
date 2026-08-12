import { describe, it, expect } from 'vitest';
import { StudentQuerySchema } from '../students.schema';

describe('StudentQuerySchema', () => {
	it('defaults page/limit and omits search when not provided', () => {
		expect(StudentQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
	});

	it('accepts a valid search term alongside pagination', () => {
		const result = StudentQuerySchema.parse({
			search: 'jane',
			page: '2',
			limit: '10',
		});

		expect(result).toEqual({ search: 'jane', page: 2, limit: 10 });
	});

	it('trims the search term', () => {
		const result = StudentQuerySchema.parse({ search: '  jane  ' });
		expect(result.search).toBe('jane');
	});

	it('throws when search exceeds 100 characters', () => {
		expect(() =>
			StudentQuerySchema.parse({ search: 'a'.repeat(101) })
		).toThrow();
	});

	it('still enforces pagination bounds from the base schema', () => {
		expect(() => StudentQuerySchema.parse({ page: 0 })).toThrow();
		expect(() => StudentQuerySchema.parse({ limit: 101 })).toThrow();
	});
});
