import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentsService } from '../students.service';
import { prisma } from '@config';
import { hashPassword } from '@shared/crypto';
import { ErrorCode } from '@shared/errors';

vi.mock('@config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@config')>();
	return {
		...actual,
		prisma: {
			...actual.prisma,
			student: {
				findMany: vi.fn(),
				count: vi.fn(),
				findUnique: vi.fn(),
				update: vi.fn(),
			},
			user: { delete: vi.fn() },
			$transaction: vi.fn(),
		},
	};
});

vi.mock('@shared/crypto', () => ({
	hashPassword: vi.fn(),
}));

const withUser = (overrides = {}) => ({
	id: 's1',
	firstName: 'Jane',
	lastName: 'Doe',
	studentCode: 'STU-001',
	user: { id: 'u1', email: 'jane@example.com', role: 'STUDENT' },
	...overrides,
});

describe('StudentsService', () => {
	let service: StudentsService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new StudentsService();
	});

	describe('list()', () => {
		it('returns mapped items with pagination meta', async () => {
			(prisma.student.findMany as any).mockResolvedValue([withUser()]);
			(prisma.student.count as any).mockResolvedValue(1);

			const result = await service.list({
				page: 1,
				limit: 20,
				skip: 0,
				take: 20,
			});

			expect(prisma.student.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: {} })
			);
			expect(prisma.student.count).toHaveBeenCalledWith({ where: {} });
			expect(result.items).toEqual([
				{
					id: 's1',
					firstName: 'Jane',
					lastName: 'Doe',
					studentCode: 'STU-001',
					email: 'jane@example.com',
					role: 'STUDENT',
				},
			]);
			expect(result.meta).toMatchObject({ page: 1, limit: 20, count: 1 });
		});
	});

	describe('list() with search', () => {
		it('builds an OR contains filter across firstName/lastName/studentCode', async () => {
			(prisma.student.findMany as any).mockResolvedValue([withUser()]);
			(prisma.student.count as any).mockResolvedValue(1);

			await service.list(
				{ page: 1, limit: 20, skip: 0, take: 20 },
				{ search: 'jane' }
			);

			const expectedWhere = {
				OR: [
					{ firstName: { contains: 'jane', mode: 'insensitive' } },
					{ lastName: { contains: 'jane', mode: 'insensitive' } },
					{ studentCode: { contains: 'jane', mode: 'insensitive' } },
				],
			};

			expect(prisma.student.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: expectedWhere })
			);
			expect(prisma.student.count).toHaveBeenCalledWith({
				where: expectedWhere,
			});
		});

		it('falls back to an empty where clause when search is undefined', async () => {
			(prisma.student.findMany as any).mockResolvedValue([]);
			(prisma.student.count as any).mockResolvedValue(0);

			await service.list(
				{ page: 1, limit: 20, skip: 0, take: 20 },
				{ search: undefined }
			);

			expect(prisma.student.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: {} })
			);
		});

		it('falls back to an empty where clause when no filters object is passed', async () => {
			(prisma.student.findMany as any).mockResolvedValue([]);
			(prisma.student.count as any).mockResolvedValue(0);

			await service.list({ page: 1, limit: 20, skip: 0, take: 20 });

			expect(prisma.student.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: {} })
			);
		});

		it('returns matched items when search finds results', async () => {
			(prisma.student.findMany as any).mockResolvedValue([
				withUser({ firstName: 'Jane' }),
			]);
			(prisma.student.count as any).mockResolvedValue(1);

			const result = await service.list(
				{ page: 1, limit: 20, skip: 0, take: 20 },
				{ search: 'jane' }
			);

			expect(result.items).toHaveLength(1);
			expect(result.items[0]?.firstName).toBe('Jane');
		});
	});

	describe('getById()', () => {
		it('returns a safe student when found', async () => {
			(prisma.student.findUnique as any).mockResolvedValue(withUser());

			const result = await service.getById('s1');

			expect(result.email).toBe('jane@example.com');
			expect(result).not.toHaveProperty('userId');
		});

		it('throws STUDENT_NOT_FOUND when missing', async () => {
			(prisma.student.findUnique as any).mockResolvedValue(null);

			await expect(service.getById('missing')).rejects.toMatchObject({
				code: ErrorCode.STUDENT_NOT_FOUND,
			});
		});
	});

	describe('create()', () => {
		it('hashes the password and creates User + Student in a transaction', async () => {
			(hashPassword as any).mockResolvedValue('hashed-pw');
			const tx = {
				user: { create: vi.fn().mockResolvedValue({ id: 'u1' }) },
				student: { create: vi.fn().mockResolvedValue(withUser()) },
			};
			(prisma.$transaction as any).mockImplementation((fn: any) =>
				fn(tx)
			);

			const result = await service.create({
				email: 'jane@example.com',
				password: 'password123',
				firstName: 'Jane',
				lastName: 'Doe',
				studentCode: 'STU-001',
			});

			expect(hashPassword).toHaveBeenCalledWith('password123');
			expect(tx.user.create).toHaveBeenCalledWith({
				data: {
					email: 'jane@example.com',
					hashedPassword: 'hashed-pw',
					role: 'STUDENT',
				},
			});
			expect(tx.student.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						userId: 'u1',
						studentCode: 'STU-001',
					}),
				})
			);
			expect(result.email).toBe('jane@example.com');
		});
	});

	describe('update()', () => {
		it('checks existence, strips nullish fields, and updates', async () => {
			(prisma.student.findUnique as any).mockResolvedValue(withUser());
			(prisma.student.update as any).mockResolvedValue(
				withUser({ firstName: 'Janet' })
			);

			const result = await service.update('s1', {
				firstName: 'Janet',
				lastName: undefined,
			});

			expect(prisma.student.update).toHaveBeenCalledWith({
				where: { id: 's1' },
				data: { firstName: 'Janet' },
				include: expect.anything(),
			});
			expect(result.firstName).toBe('Janet');
		});

		it('throws STUDENT_NOT_FOUND before attempting the write when missing', async () => {
			(prisma.student.findUnique as any).mockResolvedValue(null);

			await expect(
				service.update('missing', { firstName: 'X' })
			).rejects.toMatchObject({ code: ErrorCode.STUDENT_NOT_FOUND });
			expect(prisma.student.update).not.toHaveBeenCalled();
		});
	});

	describe('delete()', () => {
		it('deletes the underlying User (cascades to Student)', async () => {
			(prisma.student.findUnique as any).mockResolvedValue({
				id: 's1',
				userId: 'u1',
			});

			await service.delete('s1');

			expect(prisma.user.delete).toHaveBeenCalledWith({
				where: { id: 'u1' },
			});
		});

		it('throws STUDENT_NOT_FOUND when missing', async () => {
			(prisma.student.findUnique as any).mockResolvedValue(null);

			await expect(service.delete('missing')).rejects.toMatchObject({
				code: ErrorCode.STUDENT_NOT_FOUND,
			});
			expect(prisma.user.delete).not.toHaveBeenCalled();
		});
	});
});
