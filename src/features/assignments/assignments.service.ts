import type { Assignment } from '@prisma-generated/client';
import { prisma } from '@config';
import { BaseService } from '@shared/core';
import { ErrorCode } from '@shared/errors';
import { buildPaginationMeta, type PaginationPayload } from '@shared/utils';
import type {
	CreateAssignmentInput,
	UpdateAssignmentStatusInput,
} from './assignments.schema';

/**
 * @module features/assignments/assignments.service
 * @description Business logic for the assignments domain. Like
 * `Course`, an `Assignment` has no linked credentials to keep off the
 * wire, so the raw Prisma row is returned as-is — no `toSafeX`-style
 * mapper is needed here.
 */

export interface AssignmentListResult {
	items: Assignment[];
	meta: ReturnType<typeof buildPaginationMeta>;
}

export class AssignmentsService extends BaseService {
	constructor() {
		super({ domain: 'assignments', service: 'AssignmentsService' });
	}

	/**
	 * Lists assignments, most recently created first. The spec doesn't
	 * scope this by the authenticated user (e.g. "my assignments"), so
	 * it returns across all students — same shape as `students.list()`
	 * and `courses.list()`.
	 */
	async list(pagination: PaginationPayload): Promise<AssignmentListResult> {
		const { skip, take, page, limit } = pagination;

		const [items, count] = await Promise.all([
			prisma.assignment.findMany({
				skip,
				take,
				orderBy: { createdAt: 'desc' },
			}),
			prisma.assignment.count(),
		]);

		return { items, meta: buildPaginationMeta(page, limit, count) };
	}

	/**
	 * Creates an assignment for an existing student.
	 *
	 * @throws {AppError} `INVALID_RELATION_REFERENCE` (via Prisma
	 * P2003, mapped in `error.handler.ts`) if `studentId` doesn't
	 * reference an existing student.
	 */
	async create(input: CreateAssignmentInput): Promise<Assignment> {
		const { studentId, dueAt, ...rest } = input;

		return prisma.assignment.create({
			data: {
				...rest,
				studentId,
				...(dueAt ? { dueAt: new Date(dueAt) } : {}),
			},
		});
	}

	/**
	 * Moves an assignment through its lifecycle by updating `status`.
	 * Existence is checked explicitly first so a missing id surfaces
	 * as `ASSIGNMENT_NOT_FOUND` rather than the generic Prisma P2025 →
	 * `RESOURCE_NOT_FOUND` fallback — same pattern as
	 * `students.service.ts`'s `update()`.
	 *
	 * @throws {AppError} `ASSIGNMENT_NOT_FOUND` if no assignment
	 * matches `id`.
	 */
	async updateStatus(
		id: string,
		input: UpdateAssignmentStatusInput
	): Promise<Assignment> {
		this.assertFound(
			await prisma.assignment.findUnique({ where: { id } }),
			ErrorCode.ASSIGNMENT_NOT_FOUND,
			{ id }
		);

		return prisma.assignment.update({
			where: { id },
			data: { status: input.status },
		});
	}
}
