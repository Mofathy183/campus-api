import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { AuthController } from '../auth.controller';
import type { AuthService } from '../auth.service';

const mockService = (): AuthService =>
	({ login: vi.fn() }) as unknown as AuthService;

const mockRes = (): Response => {
	const res = {} as Response;
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res;
};

describe('AuthController.login()', () => {
	let service: AuthService;
	let controller: AuthController;
	let next: NextFunction;

	beforeEach(() => {
		service = mockService();
		controller = new AuthController(service);
		next = vi.fn();
	});

	it('responds 200 with the service result on success', async () => {
		const loginResult = {
			accessToken: 'jwt',
			user: {
				id: '1',
				email: 'jane@example.com',
				role: 'STUDENT',
				student: null,
			},
		};
		(service.login as any).mockResolvedValue(loginResult);

		const req = {
			body: { email: 'jane@example.com', password: 'password123' },
		} as Request;
		const res = mockRes();

		await controller.login(req, res, next);

		expect(service.login).toHaveBeenCalledWith(
			'jane@example.com',
			'password123'
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ success: true, data: loginResult })
		);
		expect(next).not.toHaveBeenCalled();
	});

	it('forwards service errors to next() instead of responding', async () => {
		const error = new Error('invalid credentials');
		(service.login as any).mockRejectedValue(error);

		const req = {
			body: { email: 'jane@example.com', password: 'wrong' },
		} as Request;
		const res = mockRes();

		await controller.login(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
