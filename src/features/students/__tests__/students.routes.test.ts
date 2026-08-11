import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@config';
import { verifyAccessToken, hashPassword } from '@shared/crypto';

vi.mock('@config', async (importOriginal) => ({
	...(await importOriginal<object>()),
	prisma: {
		student: {
			findMany: vi.fn(),
			count: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		user: { delete: vi.fn() },
		$transaction: vi.fn(),
	},
}));

vi.mock('@shared/crypto', async (importOriginal) => ({
	...(await importOriginal<object>()),
	verifyAccessToken: vi.fn(),
	hashPassword: vi.fn(),
}));

const authHeader = { Authorization: 'Bearer valid.jwt' };
const uuid = () => crypto.randomUUID();

describe('Students routes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(verifyAccessToken as any).mockReturnValue({
			id: 'admin-1',
			role: 'ADMIN',
			issuedAt: 1710000000,
		});
	});

	it('rejects unauthenticated requests', async () => {
		const res = await request(app).get('/students');
		expect(res.status).toBe(401);
	});

	describe('GET /students', () => {
		it('returns a paginated list', async () => {
			(prisma.student.findMany as any).mockResolvedValue([
				{
					id: 's1',
					firstName: 'Jane',
					lastName: 'Doe',
					studentCode: 'STU-001',
					user: {
						id: 'u1',
						email: 'jane@example.com',
						role: 'STUDENT',
					},
				},
			]);
			(prisma.student.count as any).mockResolvedValue(1);

			const res = await request(app).get('/students').set(authHeader);

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveLength(1);
			expect(res.body.meta).toMatchObject({
				page: 1,
				limit: 20,
				count: 1,
			});
		});
	});

	describe('GET /students/:id', () => {
		it('returns 404 for an unknown id', async () => {
			(prisma.student.findUnique as any).mockResolvedValue(null);

			const res = await request(app)
				.get(`/students/${uuid()}`)
				.set(authHeader);

			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
		});

		it('returns 400 for a malformed id', async () => {
			const res = await request(app)
				.get('/students/not-a-uuid')
				.set(authHeader);
			expect(res.status).toBe(400);
		});
	});

	describe('POST /students', () => {
		it('returns 201 on success', async () => {
			(hashPassword as any).mockResolvedValue('hashed');
			(prisma.$transaction as any).mockImplementation((fn: any) =>
				fn({
					user: { create: vi.fn().mockResolvedValue({ id: 'u1' }) },
					student: {
						create: vi.fn().mockResolvedValue({
							id: 's1',
							firstName: 'Jane',
							lastName: 'Doe',
							studentCode: 'STU-001',
							user: {
								id: 'u1',
								email: 'jane@example.com',
								role: 'STUDENT',
							},
						}),
					},
				})
			);

			const res = await request(app)
				.post('/students')
				.set(authHeader)
				.send({
					email: 'jane@example.com',
					password: 'password123',
					firstName: 'Jane',
					lastName: 'Doe',
					studentCode: 'STU-001',
				});

			expect(res.status).toBe(201);
			expect(res.body.data.email).toBe('jane@example.com');
		});

		it('returns 400 on invalid body', async () => {
			const res = await request(app)
				.post('/students')
				.set(authHeader)
				.send({ email: 'not-an-email' });

			expect(res.status).toBe(400);
		});
	});

	describe('DELETE /students/:id', () => {
		it('returns 204 on success', async () => {
			(prisma.student.findUnique as any).mockResolvedValue({
				id: 's1',
				userId: 'u1',
			});
			(prisma.user.delete as any).mockResolvedValue({});

			const res = await request(app)
				.delete(`/students/${uuid()}`)
				.set(authHeader);

			expect(res.status).toBe(204);
		});
	});
});
