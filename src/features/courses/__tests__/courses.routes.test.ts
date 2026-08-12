import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@config';
import { verifyAccessToken } from '@shared/crypto';

vi.mock('@config', async (importOriginal) => ({
	...(await importOriginal<object>()),
	prisma: {
		course: {
			findMany: vi.fn(),
			count: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
		},
	},
}));

vi.mock('@shared/crypto', async (importOriginal) => ({
	...(await importOriginal<object>()),
	verifyAccessToken: vi.fn(),
}));

const authHeader = { Authorization: 'Bearer valid.jwt' };
const uuid = () => crypto.randomUUID();

describe('Courses routes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(verifyAccessToken as any).mockReturnValue({
			id: 'admin-1',
			role: 'ADMIN',
			issuedAt: 1710000000,
		});
	});

	it('rejects unauthenticated requests', async () => {
		const res = await request(app).get('/courses');
		expect(res.status).toBe(401);
	});

	describe('GET /courses', () => {
		it('returns a paginated list', async () => {
			(prisma.course.findMany as any).mockResolvedValue([
				{ id: 'c1', code: 'CS201', title: 'Data Structures' },
			]);
			(prisma.course.count as any).mockResolvedValue(1);

			const res = await request(app).get('/courses').set(authHeader);

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveLength(1);
			expect(res.body.meta).toMatchObject({
				page: 1,
				limit: 20,
				count: 1,
			});
		});

		it('applies ?search=&?code= as where filters reaching Prisma', async () => {
			(prisma.course.findMany as any).mockResolvedValue([]);
			(prisma.course.count as any).mockResolvedValue(0);

			const res = await request(app)
				.get('/courses?search=CS201&code=CS201')
				.set(authHeader);

			expect(res.status).toBe(200);
			expect(prisma.course.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						OR: [
							{
								title: {
									contains: 'CS201',
									mode: 'insensitive',
								},
							},
							{
								code: {
									contains: 'CS201',
									mode: 'insensitive',
								},
							},
						],
						code: 'CS201',
					},
				})
			);
		});

		it('returns 400 when ?code= has an invalid shape', async () => {
			const res = await request(app)
				.get('/courses?code=$$')
				.set(authHeader);

			expect(res.status).toBe(400);
		});
	});

	describe('GET /courses/:id', () => {
		it('returns 404 for an unknown id', async () => {
			(prisma.course.findUnique as any).mockResolvedValue(null);

			const res = await request(app)
				.get(`/courses/${uuid()}`)
				.set(authHeader);

			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
		});

		it('returns 400 for a malformed id', async () => {
			const res = await request(app)
				.get('/courses/not-a-uuid')
				.set(authHeader);

			expect(res.status).toBe(400);
		});
	});

	describe('POST /courses', () => {
		it('returns 201 on success', async () => {
			(prisma.course.create as any).mockResolvedValue({
				id: 'c1',
				code: 'CS201',
				title: 'Data Structures',
			});

			const res = await request(app)
				.post('/courses')
				.set(authHeader)
				.send({ code: 'CS201', title: 'Data Structures' });

			expect(res.status).toBe(201);
			expect(res.body.data.code).toBe('CS201');
		});

		it('returns 400 on invalid body', async () => {
			const res = await request(app)
				.post('/courses')
				.set(authHeader)
				.send({ code: '$$', title: '' });

			expect(res.status).toBe(400);
		});
	});
});
