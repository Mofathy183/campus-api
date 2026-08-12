import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssignmentsService } from '../assignments.service';
import { prisma } from '@config';
import { ErrorCode } from '@shared/errors';

vi.mock('@config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@config')>();
	return {
		...actual,
		prisma: {
			...actual.prisma,
			assignment: {
				findMany: vi.fn(),
				count: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
			},
		},
	};
});

const assignment = (overrides = {}) => ({
	id: 'a1',
	title: 'Homework 1',
	description: null,
	studentId: 's1',
	status: 'PENDING',
	dueAt: null,
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	...overrides,
});

describe('AssignmentsService', () => {
	let service: AssignmentsService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AssignmentsService();
	});

	describe('list()', () => {
		it('returns items with pagination meta', async () => {
			(prisma.assignment.findMany as any).mockResolvedValue([
				assignment(),
			]);
			(prisma.assignment.count as any).mockResolvedValue(1);

			const result = await service.list({
				page: 1,
				limit: 20,
				skip: 0,
				take: 20,
			});

			expect(prisma.assignment.findMany).toHaveBeenCalledWith({
				where: {},
				skip: 0,
				take: 20,
				orderBy: { createdAt: 'desc' },
			});
			expect(result.items).toEqual([assignment()]);
			expect(result.meta).toMatchObject({ page: 1, limit: 20, count: 1 });
		});
	});

	describe('list() with filters', () => {
		it('adds an exact-match status filter when status is given', async () => {
			(prisma.assignment.findMany as any).mockResolvedValue([
				assignment({ status: 'PENDING' }),
			]);
			(prisma.assignment.count as any).mockResolvedValue(1);

			await service.list(
				{ page: 1, limit: 20, skip: 0, take: 20 },
				{ status: 'PENDING' }
			);

			expect(prisma.assignment.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { status: 'PENDING' } })
			);
			expect(prisma.assignment.count).toHaveBeenCalledWith({
				where: { status: 'PENDING' },
			});
		});

		it('adds an exact-match studentId filter when studentId is given', async () => {
			(prisma.assignment.findMany as any).mockResolvedValue([
				assignment(),
			]);
			(prisma.assignment.count as any).mockResolvedValue(1);

			await service.list(
				{ page: 1, limit: 20, skip: 0, take: 20 },
				{ studentId: 's1' }
			);

			expect(prisma.assignment.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { studentId: 's1' } })
			);
		});

		it('adds a contains filter on title when search is given', async () => {
			(prisma.assignment.findMany as any).mockResolvedValue([
				assignment(),
			]);
			(prisma.assignment.count as any).mockResolvedValue(1);

			await service.list(
				{ page: 1, limit: 20, skip: 0, take: 20 },
				{ search: 'homework' }
			);

			expect(prisma.assignment.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						title: { contains: 'homework', mode: 'insensitive' },
					},
				})
			);
		});

		it('combines status, studentId, and search into one where clause', async () => {
			(prisma.assignment.findMany as any).mockResolvedValue([
				assignment(),
			]);
			(prisma.assignment.count as any).mockResolvedValue(1);

			await service.list(
				{ page: 1, limit: 20, skip: 0, take: 20 },
				{ status: 'PENDING', studentId: 's1', search: 'homework' }
			);

			expect(prisma.assignment.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						status: 'PENDING',
						studentId: 's1',
						title: { contains: 'homework', mode: 'insensitive' },
					},
				})
			);
		});

		it('falls back to an empty where clause when no filters are given', async () => {
			(prisma.assignment.findMany as any).mockResolvedValue([]);
			(prisma.assignment.count as any).mockResolvedValue(0);

			await service.list({ page: 1, limit: 20, skip: 0, take: 20 });

			expect(prisma.assignment.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: {} })
			);
		});
	});

	describe('create()', () => {
		it('creates and returns the assignment without a dueAt', async () => {
			(prisma.assignment.create as any).mockResolvedValue(assignment());

			const result = await service.create({
				title: 'Homework 1',
				studentId: 's1',
			} as any);

			expect(prisma.assignment.create).toHaveBeenCalledWith({
				data: { title: 'Homework 1', studentId: 's1' },
			});
			expect(result.title).toBe('Homework 1');
		});

		it('converts a provided dueAt string to a Date', async () => {
			(prisma.assignment.create as any).mockResolvedValue(
				assignment({ dueAt: new Date('2026-02-01T00:00:00.000Z') })
			);

			await service.create({
				title: 'Homework 1',
				studentId: 's1',
				dueAt: '2026-02-01T00:00:00.000Z',
			});

			expect(prisma.assignment.create).toHaveBeenCalledWith({
				data: {
					title: 'Homework 1',
					studentId: 's1',
					dueAt: new Date('2026-02-01T00:00:00.000Z'),
				},
			});
		});
	});

	describe('updateStatus()', () => {
		it('checks existence and updates the status', async () => {
			(prisma.assignment.findUnique as any).mockResolvedValue(
				assignment()
			);
			(prisma.assignment.update as any).mockResolvedValue(
				assignment({ status: 'SUBMITTED' })
			);

			const result = await service.updateStatus('a1', {
				status: 'SUBMITTED',
			});

			expect(prisma.assignment.update).toHaveBeenCalledWith({
				where: { id: 'a1' },
				data: { status: 'SUBMITTED' },
			});
			expect(result.status).toBe('SUBMITTED');
		});

		it('throws ASSIGNMENT_NOT_FOUND before attempting the write when missing', async () => {
			(prisma.assignment.findUnique as any).mockResolvedValue(null);

			await expect(
				service.updateStatus('missing', { status: 'GRADED' })
			).rejects.toMatchObject({ code: ErrorCode.ASSIGNMENT_NOT_FOUND });
			expect(prisma.assignment.update).not.toHaveBeenCalled();
		});
	});
});
