import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoursesService } from '../courses.service';
import { prisma } from '@config';
import { ErrorCode } from '@shared/errors';

vi.mock('@config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@config')>();
	return {
		...actual,
		prisma: {
			...actual.prisma,
			course: {
				findMany: vi.fn(),
				count: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
			},
		},
	};
});

const course = (overrides = {}) => ({
	id: 'c1',
	code: 'CS201',
	title: 'Data Structures',
	description: null,
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	...overrides,
});

describe('CoursesService', () => {
	let service: CoursesService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new CoursesService();
	});

	describe('list()', () => {
		it('returns items with pagination meta', async () => {
			(prisma.course.findMany as any).mockResolvedValue([course()]);
			(prisma.course.count as any).mockResolvedValue(1);

			const result = await service.list({
				page: 1,
				limit: 20,
				skip: 0,
				take: 20,
			});

			expect(prisma.course.findMany).toHaveBeenCalledWith({
				skip: 0,
				take: 20,
				orderBy: { createdAt: 'desc' },
			});
			expect(result.items).toEqual([course()]);
			expect(result.meta).toMatchObject({ page: 1, limit: 20, count: 1 });
		});
	});

	describe('getById()', () => {
		it('returns the course when found', async () => {
			(prisma.course.findUnique as any).mockResolvedValue(course());

			const result = await service.getById('c1');

			expect(prisma.course.findUnique).toHaveBeenCalledWith({
				where: { id: 'c1' },
			});
			expect(result.code).toBe('CS201');
		});

		it('throws COURSE_NOT_FOUND when missing', async () => {
			(prisma.course.findUnique as any).mockResolvedValue(null);

			await expect(service.getById('missing')).rejects.toMatchObject({
				code: ErrorCode.COURSE_NOT_FOUND,
			});
		});
	});

	describe('create()', () => {
		it('creates and returns the course', async () => {
			(prisma.course.create as any).mockResolvedValue(course());

			const result = await service.create({
				code: 'CS201',
				title: 'Data Structures',
			});

			expect(prisma.course.create).toHaveBeenCalledWith({
				data: { code: 'CS201', title: 'Data Structures' },
			});
			expect(result.code).toBe('CS201');
		});
	});
});
