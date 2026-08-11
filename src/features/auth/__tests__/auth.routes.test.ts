import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@config';
import { verifyPassword, signAccessToken } from '@shared/crypto';

vi.mock('@config', async (importOriginal) => ({
	...(await importOriginal<object>()),
	prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock('@shared/crypto', async (importOriginal) => ({
	...(await importOriginal<object>()),
	verifyPassword: vi.fn(),
	signAccessToken: vi.fn(),
}));

describe('POST /login', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns 200 with an access token and user on valid credentials', async () => {
		(prisma.user.findUnique as any).mockResolvedValue({
			id: 'user-1',
			email: 'jane@example.com',
			hashedPassword: 'hashed',
			role: 'STUDENT',
			student: null,
		});
		(verifyPassword as any).mockResolvedValue(true);
		(signAccessToken as any).mockReturnValue('jwt.token');

		const res = await request(app)
			.post('/login')
			.send({ email: 'jane@example.com', password: 'password123' });

		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			success: true,
			data: { accessToken: 'jwt.token' },
		});
	});

	it('returns 400 when the body fails Zod validation', async () => {
		const res = await request(app)
			.post('/login')
			.send({ email: 'not-an-email', password: '123' });

		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});

	it('returns 401 on wrong credentials', async () => {
		(prisma.user.findUnique as any).mockResolvedValue(null);
		(verifyPassword as any).mockResolvedValue(false);

		const res = await request(app)
			.post('/login')
			.send({ email: 'nope@example.com', password: 'password123' });

		expect(res.status).toBe(401);
	});
});
