import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { CoursesController } from '../courses.controller';
import type { CoursesService } from '../courses.service';

const mockService = (): CoursesService =>
	({
		list: vi.fn(),
		getById: vi.fn(),
		create: vi.fn(),
	}) as unknown as CoursesService;

const mockRes = (): Response => {
	const res = {} as Response;
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

describe('CoursesController', () => {
	let service: CoursesService;
	let controller: CoursesController;
	let next: NextFunction;

	beforeEach(() => {
		service = mockService();
		controller = new CoursesController(service);
		next = vi.fn();
	});

	it('list() returns 200 with items and pagination meta', async () => {
		(service.list as any).mockResolvedValue({
			items: [{ id: 'c1' }],
			meta: {
				page: 1,
				limit: 20,
				count: 1,
				hasNextPage: false,
				hasPreviousPage: false,
			},
		});
		const req = { query: {} } as Request;
		const res = mockRes();

		await controller.list(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ success: true, data: [{ id: 'c1' }] })
		);
	});

	it('list() forwards ?search= and ?code= from the query string to the service', async () => {
		(service.list as any).mockResolvedValue({
			items: [],
			meta: {
				page: 1,
				limit: 20,
				count: 0,
				hasNextPage: false,
				hasPreviousPage: false,
			},
		});
		const req = {
			query: { search: 'CS201', code: 'CS201' },
		} as unknown as Request;
		const res = mockRes();

		await controller.list(req, res, next);

		expect(service.list).toHaveBeenCalledWith(expect.anything(), {
			search: 'CS201',
			code: 'CS201',
		});
	});

	it('list() forwards undefined filters when the query has none', async () => {
		(service.list as any).mockResolvedValue({
			items: [],
			meta: {
				page: 1,
				limit: 20,
				count: 0,
				hasNextPage: false,
				hasPreviousPage: false,
			},
		});
		const req = { query: {} } as Request;
		const res = mockRes();

		await controller.list(req, res, next);

		expect(service.list).toHaveBeenCalledWith(expect.anything(), {
			search: undefined,
			code: undefined,
		});
	});

	it('getById() forwards the :id param and returns 200', async () => {
		(service.getById as any).mockResolvedValue({ id: 'c1' });
		const req = { params: { id: 'c1' } } as unknown as Request;
		const res = mockRes();

		await controller.getById(req, res, next);

		expect(service.getById).toHaveBeenCalledWith('c1');
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it('create() returns 201 on success', async () => {
		(service.create as any).mockResolvedValue({ id: 'c1', code: 'CS201' });
		const req = {
			body: { code: 'CS201', title: 'Data Structures' },
		} as Request;
		const res = mockRes();

		await controller.create(req, res, next);

		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ success: true })
		);
	});

	it('forwards service errors to next() instead of responding', async () => {
		const error = new Error('boom');
		(service.getById as any).mockRejectedValue(error);
		const req = { params: { id: 'c1' } } as unknown as Request;
		const res = mockRes();

		await controller.getById(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
