import type { Request, Response, NextFunction } from 'express';
import { BaseController } from '@shared/core';
import type { AuthService } from './auth.service';

/**
 * @module features/auth/auth.controller
 * @description Thin HTTP layer for auth — validation already ran in
 * middleware, so this just extracts the body, delegates to
 * {@link AuthService}, and writes the response envelope.
 */
export class AuthController extends BaseController {
	constructor(private readonly authService: AuthService) {
		super({ domain: 'auth', controller: 'AuthController' });
	}

	/**
	 * @route POST /login
	 */
	login = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const { email, password } = req.body;
			const result = await this.authService.login(email, password);
			this.ok(res, result, 'Login successful');
		} catch (error) {
			next(error);
		}
	};
}
