import type { Request, Response, NextFunction } from 'express';
import { BaseController } from '@shared/core';
import { getPagination } from '@shared/utils';
import type { StudentsService } from './students.service';
import type { CreateStudentInput, UpdateStudentInput } from './students.schema';

/**
 * @module features/students/students.controller
 * @description Thin HTTP layer for students — validation and auth
 * already ran in middleware, so every handler just extracts input,
 * delegates to {@link StudentsService}, and writes the response.
 */
export class StudentsController extends BaseController {
	constructor(private readonly studentsService: StudentsService) {
		super({ domain: 'students', controller: 'StudentsController' });
	}

	/** @route GET /students */
	list = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const pagination = getPagination(req.query);
			const { items, meta } = await this.studentsService.list(pagination);
			this.ok(res, items, 'Students fetched', meta);
		} catch (error) {
			next(error);
		}
	};

	/** @route GET /students/:id */
	getById = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const student = await this.studentsService.getById(
				this.getParam(req)
			);
			this.ok(res, student, 'Student fetched');
		} catch (error) {
			next(error);
		}
	};

	/** @route POST /students */
	create = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const input = req.body as CreateStudentInput;
			const student = await this.studentsService.create(input);
			this.created(res, student, 'Student created');
		} catch (error) {
			next(error);
		}
	};

	/** @route PUT /students/:id */
	update = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const input = req.body as UpdateStudentInput;
			const student = await this.studentsService.update(
				this.getParam(req),
				input
			);
			this.ok(res, student, 'Student updated');
		} catch (error) {
			next(error);
		}
	};

	/** @route DELETE /students/:id */
	remove = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await this.studentsService.delete(this.getParam(req));
			this.noContent(res);
		} catch (error) {
			next(error);
		}
	};
}
