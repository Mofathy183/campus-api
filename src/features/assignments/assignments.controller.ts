import type { Request, Response, NextFunction } from 'express';
import { BaseController } from '@shared/core';
import { getPagination } from '@shared/utils';
import type { AssignmentsService } from './assignments.service';

/**
 * @module features/assignments/assignments.controller
 * @description Thin HTTP layer for assignments — validation and auth
 * already ran in middleware, so every handler just extracts input,
 * delegates to {@link AssignmentsService}, and writes the response.
 */
export class AssignmentsController extends BaseController {
	constructor(private readonly assignmentsService: AssignmentsService) {
		super({ domain: 'assignments', controller: 'AssignmentsController' });
	}

	/** @route GET /assignments */
	list = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const pagination = getPagination(req.query);
			const { items, meta } =
				await this.assignmentsService.list(pagination);
			this.ok(res, items, 'Assignments fetched', meta);
		} catch (error) {
			next(error);
		}
	};

	/** @route POST /assignments */
	create = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const input = req.body;
			const assignment = await this.assignmentsService.create(input);
			this.created(res, assignment, 'Assignment created');
		} catch (error) {
			next(error);
		}
	};

	/** @route PATCH /assignments/:id */
	updateStatus = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const input = req.body;
			const assignment = await this.assignmentsService.updateStatus(
				this.getParam(req),
				input
			);
			this.ok(res, assignment, 'Assignment status updated');
		} catch (error) {
			next(error);
		}
	};
}
