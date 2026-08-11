import type { Request, Response, NextFunction } from 'express';
import { BaseController } from '@shared/core';
import { getPagination } from '@shared/utils';
import type { CoursesService } from './courses.service';

/**
 * @module features/courses/courses.controller
 * @description Thin HTTP layer for courses — validation and auth
 * already ran in middleware, so every handler just extracts input,
 * delegates to {@link CoursesService}, and writes the response.
 */
export class CoursesController extends BaseController {
	constructor(private readonly coursesService: CoursesService) {
		super({ domain: 'courses', controller: 'CoursesController' });
	}

	/** @route GET /courses */
	list = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const pagination = getPagination(req.query);
			const { items, meta } = await this.coursesService.list(pagination);
			this.ok(res, items, 'Courses fetched', meta);
		} catch (error) {
			next(error);
		}
	};

	/** @route GET /courses/:id */
	getById = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const course = await this.coursesService.getById(
				this.getParam(req)
			);
			this.ok(res, course, 'Course fetched');
		} catch (error) {
			next(error);
		}
	};

	/** @route POST /courses */
	create = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const input = req.body;
			const course = await this.coursesService.create(input);
			this.created(res, course, 'Course created');
		} catch (error) {
			next(error);
		}
	};
}
