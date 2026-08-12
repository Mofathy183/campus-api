import type { Course, Prisma } from '@prisma-generated/client';
import { prisma } from '@config';
import { BaseService } from '@shared/core';
import { ErrorCode } from '@shared/errors';
import { buildPaginationMeta, type PaginationPayload } from '@shared/utils';
import type { CreateCourseInput } from './courses.schema';

/**
 * @module features/courses/courses.service
 * @description Business logic for the courses domain. Unlike
 * students, a `Course` has no linked `User`/credentials to keep off
 * the wire, so the raw Prisma row is returned as-is — no
 * `toSafeX`-style mapper is needed here.
 */

export interface CourseListResult {
	items: Course[];
	meta: ReturnType<typeof buildPaginationMeta>;
}

/** Optional filters accepted by {@link CoursesService.list}. */
export interface CourseListFilters {
	/** Free-text term matched against title/code. */
	search?: string;
	/** Exact-match filter on the institution-facing course code. */
	code?: string;
}

export class CoursesService extends BaseService {
	constructor() {
		super({ domain: 'courses', service: 'CoursesService' });
	}

	/**
	 * Builds the Prisma `where` clause for `GET /courses`.
	 *
	 * `search` and `code` are independent and both optional — either,
	 * both, or neither may be present. `code` is an exact match (it's
	 * a unique column); `search` is a case-insensitive partial match
	 * against `title` or `code`. Returns `{}` when neither is given,
	 * so unfiltered calls behave exactly as before this feature was
	 * added.
	 *
	 * @param filters - Optional filters parsed from `req.query`.
	 * @returns A Prisma `CourseWhereInput`, `{}` when no filter applies.
	 */
	private buildWhere(filters: CourseListFilters): Prisma.CourseWhereInput {
		const where: Prisma.CourseWhereInput = {};

		if (filters.search) {
			where.OR = [
				{ title: { contains: filters.search, mode: 'insensitive' } },
				{ code: { contains: filters.search, mode: 'insensitive' } },
			];
		}

		if (filters.code) {
			where.code = filters.code;
		}

		return where;
	}

	async list(
		pagination: PaginationPayload,
		filters: CourseListFilters = {}
	): Promise<CourseListResult> {
		const { skip, take, page, limit } = pagination;
		const where = this.buildWhere(filters);

		const [items, count] = await Promise.all([
			prisma.course.findMany({
				where,
				skip,
				take,
				orderBy: { createdAt: 'desc' },
			}),
			prisma.course.count({ where }),
		]);

		return { items, meta: buildPaginationMeta(page, limit, count) };
	}

	/** @throws {AppError} `COURSE_NOT_FOUND` if no course matches `id`. */
	async getById(id: string): Promise<Course> {
		const course = await prisma.course.findUnique({ where: { id } });
		return this.assertFound(course, ErrorCode.COURSE_NOT_FOUND, { id });
	}

	/**
	 * @throws {AppError} `COURSE_CODE_ALREADY_EXISTS` (via Prisma P2002,
	 * mapped in `error.handler.ts`) if `code` is already taken.
	 */
	async create(input: CreateCourseInput): Promise<Course> {
		return prisma.course.create({ data: input });
	}
}
