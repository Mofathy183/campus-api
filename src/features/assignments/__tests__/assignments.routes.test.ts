import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@config';
import { verifyAccessToken } from '@shared/crypto';

vi.mock('@config', async (importOriginal) => ({
	...(await importOriginal<object>()),
	prisma: {
		assignment: {
			findMany: vi.fn(),
			count: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock('@shared/crypto', async (importOriginal) => ({
	...(await importOriginal<object>()),
	verifyAccessToken: vi.fn(),
}));

const authHeader = { Authorization: 'Bearer valid.jwt' };
const uuid = () => crypto.randomUUID();

describe('Assignments routes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(verifyAccessToken as any).mockReturnValue({
			id: 'admin-1',
			role: 'ADMIN',
			issuedAt: 1710000000,
		});
	});

	it('rejects unauthenticated requests', async () => {
		const res = await request(app).get('/assignments');
		expect(res.status).toBe(401);
	});

	describe('GET /assignments', () => {
		it('returns a paginated list', async () => {
			(prisma.assignment.findMany as any).mockResolvedValue([
				{ id: 'a1', title: 'Homework 1', status: 'PENDING' },
			]);
			(prisma.assignment.count as any).mockResolvedValue(1);

			const res = await request(app).get('/assignments').set(authHeader);

			expect(res.status).toBe(200);
			expect(res.body.data).toHaveLength(1);
			expect(res.body.meta).toMatchObject({
				page: 1,
				limit: 20,
				count: 1,
			});
		});
	});

	describe('POST /assignments', () => {
		it('returns 201 on success', async () => {
			(prisma.assignment.create as any).mockResolvedValue({
				id: 'a1',
				title: 'Homework 1',
				studentId: uuid(),
				status: 'PENDING',
			});

			const res = await request(app)
				.post('/assignments')
				.set(authHeader)
				.send({ title: 'Homework 1', studentId: uuid() });

			expect(res.status).toBe(201);
			expect(res.body.data.title).toBe('Homework 1');
		});

		it('returns 400 on invalid body', async () => {
			const res = await request(app)
				.post('/assignments')
				.set(authHeader)
				.send({ title: '', studentId: 'not-a-uuid' });

			expect(res.status).toBe(400);
		});
	});

	describe('PATCH /assignments/:id', () => {
		it('returns 200 on a valid status transition', async () => {
			const id = uuid();
			(prisma.assignment.findUnique as any).mockResolvedValue({
				id,
				status: 'PENDING',
			});
			(prisma.assignment.update as any).mockResolvedValue({
				id,
				status: 'SUBMITTED',
			});

			const res = await request(app)
				.patch(`/assignments/${id}`)
				.set(authHeader)
				.send({ status: 'SUBMITTED' });

			expect(res.status).toBe(200);
			expect(res.body.data.status).toBe('SUBMITTED');
		});

		it('returns 404 for an unknown id', async () => {
			(prisma.assignment.findUnique as any).mockResolvedValue(null);

			const res = await request(app)
				.patch(`/assignments/${uuid()}`)
				.set(authHeader)
				.send({ status: 'GRADED' });

			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
		});

		it('returns 400 for a malformed id', async () => {
			const res = await request(app)
				.patch('/assignments/not-a-uuid')
				.set(authHeader)
				.send({ status: 'GRADED' });

			expect(res.status).toBe(400);
		});

		it('returns 400 for an invalid status value', async () => {
			const res = await request(app)
				.patch(`/assignments/${uuid()}`)
				.set(authHeader)
				.send({ status: 'NOT_A_STATUS' });

			expect(res.status).toBe(400);
		});
	});
});
