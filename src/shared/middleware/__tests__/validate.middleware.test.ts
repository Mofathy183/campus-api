import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { z } from 'zod';
import {
	validateBody,
	validateQuery,
	validateParams,
	validateRequest,
	validateUuidParam,
} from '@shared/middleware';

const mockReq = (overrides: Partial<Request> = {}) =>
	({
		body: {},
		query: {},
		params: {},
		...overrides,
	}) as Request;

describe('validateRequest()', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('body validation', () => {
		it('replaces request body with validated data', async () => {
			const next = vi.fn();
			const schema = z.object({ title: z.string() });
			const req = mockReq({ body: { title: 'Homework 1' } });

			await validateRequest({ body: schema })(req, {} as any, next);

			expect(req.body).toEqual({ title: 'Homework 1' });
			expect(next).toHaveBeenCalledOnce();
		});

		it('passes body validation errors to next', async () => {
			const next = vi.fn();
			const schema = z.object({ title: z.string() });
			const req = mockReq({ body: { title: 123 } });

			await validateRequest({ body: schema })(req, {} as any, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe('query validation', () => {
		it('merges validated/coerced values onto the request query', async () => {
			const next = vi.fn();
			const schema = z.object({ page: z.coerce.number() });
			const req = mockReq({ query: { page: '2', extra: 'x' } });

			await validateRequest({ query: schema })(req, {} as any, next);

			expect(req.query).toEqual({ page: 2, extra: 'x' });
			expect(next).toHaveBeenCalledOnce();
		});

		it('passes query validation errors to next', async () => {
			const next = vi.fn();
			const schema = z.object({ page: z.number() });
			const req = mockReq({ query: { page: 'not-a-number' } });

			await validateRequest({ query: schema })(req, {} as any, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe('params validation', () => {
		it('replaces request params with validated data', async () => {
			const next = vi.fn();
			const schema = z.object({ id: z.string() });
			const req = mockReq({ params: { id: '123' } });

			await validateRequest({ params: schema })(req, {} as any, next);

			expect(req.params).toEqual({ id: '123' });
			expect(next).toHaveBeenCalledOnce();
		});

		it('passes params validation errors to next', async () => {
			const next = vi.fn();
			const schema = z.object({ id: z.uuid() });
			const req = mockReq({ params: { id: 'invalid' } });

			await validateRequest({ params: schema })(req, {} as any, next);

			expect(next).toHaveBeenCalledOnce();
			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});
});

describe('validateBody()', () => {
	it('replaces request body with validated data', async () => {
		const next = vi.fn();
		const schema = z.object({ foo: z.string() });
		const req = mockReq({ body: { foo: 'bar' } });

		await validateBody(schema)(req, {} as any, next);

		expect(req.body).toEqual({ foo: 'bar' });
		expect(next).toHaveBeenCalledOnce();
	});
});

describe('validateQuery()', () => {
	it('merges coerced query values onto the request', async () => {
		const next = vi.fn();
		const schema = z.object({ page: z.coerce.number() });
		const req = mockReq({ query: { page: '1' } });

		await validateQuery(schema)(req, {} as any, next);

		expect(req.query).toEqual({ page: 1 });
		expect(next).toHaveBeenCalledOnce();
	});
});

describe('validateParams()', () => {
	it('replaces request params with validated data', async () => {
		const next = vi.fn();
		const schema = z.object({ code: z.string() });
		const req = mockReq({ params: { code: 'CS201' } });

		await validateParams(schema)(req, {} as any, next);

		expect(req.params).toEqual({ code: 'CS201' });
		expect(next).toHaveBeenCalledOnce();
	});
});

describe('validateUuidParam()', () => {
	it('passes through when id is a valid uuid', async () => {
		const next = vi.fn();
		const id = crypto.randomUUID();
		const req = mockReq({ params: { id } });

		await validateUuidParam(req, {} as any, next);

		expect(req.params).toEqual({ id });
		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith();
	});

	it('passes a validation error to next when id is not a uuid', async () => {
		const next = vi.fn();
		const req = mockReq({ params: { id: 'not-a-uuid' } });

		await validateUuidParam(req, {} as any, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith(expect.any(Error));
	});
});
