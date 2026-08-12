import { describe, it, expect } from 'vitest';
import { CourseQuerySchema } from '../courses.schema';

describe('CourseQuerySchema', () => {
	it('defaults page/limit and omits search/code when not provided', () => {
		expect(CourseQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
	});

	it('accepts search and code together', () => {
		const result = CourseQuerySchema.parse({
			search: 'CS201',
			code: 'CS201',
		});

		expect(result).toMatchObject({ search: 'CS201', code: 'CS201' });
	});

	it('rejects a code with disallowed characters', () => {
		expect(() => CourseQuerySchema.parse({ code: '$$' })).toThrow();
	});

	it('trims the search term', () => {
		const result = CourseQuerySchema.parse({ search: '  CS201  ' });
		expect(result.search).toBe('CS201');
	});
});
