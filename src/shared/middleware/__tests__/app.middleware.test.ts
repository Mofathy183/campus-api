import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { routeNotFoundHandler, healthCheck } from '@shared/middleware';
import { STATUS_CODE, ErrorCode } from '@shared/errors';

describe('routeNotFoundHandler', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;

	beforeEach(() => {
		req = {
			path: '/unknown-endpoint',
			method: 'GET',
		};

		res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		};
	});

	it('returns a not-found error', () => {
		routeNotFoundHandler(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				code: ErrorCode.ROUTE_NOT_FOUND,
			})
		);
	});

	it('includes request path and method in the error details', () => {
		routeNotFoundHandler(req as Request, res as Response);

		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({
					requestedPath: '/unknown-endpoint',
					method: 'GET',
				}),
			})
		);
	});
});

describe('healthCheck', () => {
	it('returns 200 with uptime and a timestamp', () => {
		const res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as unknown as Response;

		healthCheck({} as Request, res);

		expect(res.status).toHaveBeenCalledWith(STATUS_CODE.OK);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				status: 'ok',
				uptime: expect.any(Number),
				timestamp: expect.any(String),
			})
		);
	});
});
