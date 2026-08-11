import type { Course } from '@prisma-generated/client';
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

export class CoursesService extends BaseService {
	constructor() {
		super({ domain: 'courses', service: 'CoursesService' });
	}

	async list(pagination: PaginationPayload): Promise<CourseListResult> {
		const { skip, take, page, limit } = pagination;

		const [items, count] = await Promise.all([
			prisma.course.findMany({
				skip,
				take,
				orderBy: { createdAt: 'desc' },
			}),
			prisma.course.count(),
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
