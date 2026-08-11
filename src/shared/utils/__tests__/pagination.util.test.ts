import { describe, expect, it } from 'vitest';

import { getPagination } from '@shared/utils';

describe('getPagination()', () => {
	it('returns pagination values', () => {
		const query = {
			page: 3,
			limit: 10,
		};

		const result = getPagination(query);

		expect(result).toEqual({
			page: 3,
			limit: 10,
			skip: 20,
			take: 10,
		});
	});

	it('returns zero skip on the first page', () => {
		const query = {
			page: 1,
			limit: 20,
		};

		const result = getPagination(query);

		expect(result).toEqual({
			page: 1,
			limit: 20,
			skip: 0,
			take: 20,
		});
	});

	it('coerces query string values', () => {
		const query = {
			page: '3',
			limit: '10',
		};

		const result = getPagination(query);

		expect(result).toEqual({
			page: 3,
			limit: 10,
			skip: 20,
			take: 10,
		});
	});

	it('returns default pagination values', () => {
		const query = {};

		const result = getPagination(query);

		expect(result).toEqual({
			page: 1,
			limit: 20,
			skip: 0,
			take: 20,
		});
	});

	it('rejects a page below one', () => {
		const query = {
			page: 0,
			limit: 20,
		};

		expect(() => getPagination(query)).toThrow();
	});

	it('rejects a limit below one', () => {
		const query = {
			page: 1,
			limit: 0,
		};

		expect(() => getPagination(query)).toThrow();
	});

	it('rejects a limit above one hundred', () => {
		const query = {
			page: 1,
			limit: 101,
		};

		expect(() => getPagination(query)).toThrow();
	});
});
