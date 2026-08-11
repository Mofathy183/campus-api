import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { StudentsController } from '../students.controller';
import type { StudentsService } from '../students.service';

const mockService = (): StudentsService =>
	({
		list: vi.fn(),
		getById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	}) as unknown as StudentsService;

const mockRes = (): Response => {
	const res = {} as Response;
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	res.sendStatus = vi.fn().mockReturnValue(res);
	return res;
};

describe('StudentsController', () => {
	let service: StudentsService;
	let controller: StudentsController;
	let next: NextFunction;

	beforeEach(() => {
		service = mockService();
		controller = new StudentsController(service);
		next = vi.fn();
	});

	it('list() returns 200 with items and pagination meta', async () => {
		(service.list as any).mockResolvedValue({
			items: [{ id: 's1' }],
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
			expect.objectContaining({ success: true, data: [{ id: 's1' }] })
		);
	});

	it('getById() forwards the :id param and returns 200', async () => {
		(service.getById as any).mockResolvedValue({ id: 's1' });
		const req = { params: { id: 's1' } } as unknown as Request;
		const res = mockRes();

		await controller.getById(req, res, next);

		expect(service.getById).toHaveBeenCalledWith('s1');
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it('create() returns 201 on success', async () => {
		(service.create as any).mockResolvedValue({ id: 's1' });
		const req = { body: { email: 'jane@example.com' } } as Request;
		const res = mockRes();

		await controller.create(req, res, next);

		expect(res.status).toHaveBeenCalledWith(201);
	});

	it('remove() sends 204 with no body', async () => {
		(service.delete as any).mockResolvedValue(undefined);
		const req = { params: { id: 's1' } } as unknown as Request;
		const res = mockRes();

		await controller.remove(req, res, next);

		expect(service.delete).toHaveBeenCalledWith('s1');
		expect(res.sendStatus).toHaveBeenCalledWith(204);
	});

	it('forwards service errors to next() instead of responding', async () => {
		const error = new Error('boom');
		(service.getById as any).mockRejectedValue(error);
		const req = { params: { id: 's1' } } as unknown as Request;
		const res = mockRes();

		await controller.getById(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
