import type { Assignment, Prisma } from '@prisma-generated/client';
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

/** Optional filters accepted by {@link AssignmentsService.list}. */
export interface AssignmentListFilters {
	/** Exact-match lifecycle status filter. */
	status?: Assignment['status'];
	/** Exact-match filter, scoping results to one student. */
	studentId?: string;
	/** Free-text term matched against title. */
	search?: string;
}

export class AssignmentsService extends BaseService {
	constructor() {
		super({ domain: 'assignments', service: 'AssignmentsService' });
	}

	/**
	 * Builds the Prisma `where` clause for `GET /assignments`.
	 *
	 * `status` and `studentId` are exact matches (both are indexed/
	 * enum-backed columns); `search` is a case-insensitive partial
	 * match against `title`. All three are independent and optional —
	 * any combination may be present. Returns `{}` when none are
	 * given, so unfiltered calls behave exactly as before this
	 * feature was added.
	 *
	 * @param filters - Optional filters parsed from `req.query`.
	 * @returns A Prisma `AssignmentWhereInput`, `{}` when no filter applies.
	 */
	private buildWhere(
		filters: AssignmentListFilters
	): Prisma.AssignmentWhereInput {
		const where: Prisma.AssignmentWhereInput = {};

		if (filters.status) {
			where.status = filters.status;
		}

		if (filters.studentId) {
			where.studentId = filters.studentId;
		}

		if (filters.search) {
			where.title = { contains: filters.search, mode: 'insensitive' };
		}

		return where;
	}

	/**
	 * Lists assignments, most recently created first. The spec doesn't
	 * scope this by the authenticated user (e.g. "my assignments"), so
	 * it returns across all students — same shape as `students.list()`
	 * and `courses.list()`. `filters` narrows that default scope via
	 * `status`/`studentId`/`search`, all optional.
	 */
	async list(
		pagination: PaginationPayload,
		filters: AssignmentListFilters = {}
	): Promise<AssignmentListResult> {
		const { skip, take, page, limit } = pagination;
		const where = this.buildWhere(filters);

		const [items, count] = await Promise.all([
			prisma.assignment.findMany({
				where,
				skip,
				take,
				orderBy: { createdAt: 'desc' },
			}),
			prisma.assignment.count({ where }),
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
