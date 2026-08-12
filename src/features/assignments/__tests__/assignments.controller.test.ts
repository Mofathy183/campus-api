import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { AssignmentsController } from '../assignments.controller';
import type { AssignmentsService } from '../assignments.service';

const mockService = (): AssignmentsService =>
	({
		list: vi.fn(),
		create: vi.fn(),
		updateStatus: vi.fn(),
	}) as unknown as AssignmentsService;

const mockRes = (): Response => {
	const res = {} as Response;
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

describe('AssignmentsController', () => {
	let service: AssignmentsService;
	let controller: AssignmentsController;
	let next: NextFunction;

	beforeEach(() => {
		service = mockService();
		controller = new AssignmentsController(service);
		next = vi.fn();
	});

	it('list() returns 200 with items and pagination meta', async () => {
		(service.list as any).mockResolvedValue({
			items: [{ id: 'a1' }],
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
			expect.objectContaining({ success: true, data: [{ id: 'a1' }] })
		);
	});

	it('list() forwards ?status=, ?studentId=, and ?search= to the service', async () => {
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
		const studentId = crypto.randomUUID();
		const req = {
			query: { status: 'PENDING', studentId, search: 'homework' },
		} as unknown as Request;
		const res = mockRes();

		await controller.list(req, res, next);

		expect(service.list).toHaveBeenCalledWith(expect.anything(), {
			status: 'PENDING',
			studentId,
			search: 'homework',
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
			status: undefined,
			studentId: undefined,
			search: undefined,
		});
	});

	it('create() returns 201 on success', async () => {
		(service.create as any).mockResolvedValue({
			id: 'a1',
			title: 'Homework 1',
		});
		const req = {
			body: { title: 'Homework 1', studentId: 's1' },
		} as Request;
		const res = mockRes();

		await controller.create(req, res, next);

		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ success: true })
		);
	});

	it('updateStatus() forwards the :id param and body, returns 200', async () => {
		(service.updateStatus as any).mockResolvedValue({
			id: 'a1',
			status: 'GRADED',
		});
		const req = {
			params: { id: 'a1' },
			body: { status: 'GRADED' },
		} as unknown as Request;
		const res = mockRes();

		await controller.updateStatus(req, res, next);

		expect(service.updateStatus).toHaveBeenCalledWith('a1', {
			status: 'GRADED',
		});
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it('forwards service errors to next() instead of responding', async () => {
		const error = new Error('boom');
		(service.updateStatus as any).mockRejectedValue(error);
		const req = {
			params: { id: 'a1' },
			body: { status: 'GRADED' },
		} as unknown as Request;
		const res = mockRes();

		await controller.updateStatus(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
