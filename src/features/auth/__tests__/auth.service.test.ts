import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { prisma } from '@config';
import { verifyPassword, signAccessToken } from '@shared/crypto';
import { ErrorCode } from '@shared/errors';

vi.mock('@config', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@config')>();

	return {
		...actual,
		prisma: {
			...actual.prisma,
			user: {
				...actual.prisma.user,
				findUnique: vi.fn(),
			},
		},
	};
});

vi.mock('@shared/crypto', () => ({
	verifyPassword: vi.fn(),
	signAccessToken: vi.fn(),
}));

describe('AuthService.login()', () => {
	let service: AuthService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AuthService();
	});

	it('returns an access token and safe user on valid credentials', async () => {
		(prisma.user.findUnique as any).mockResolvedValue({
			id: 'user-1',
			email: 'jane@example.com',
			hashedPassword: 'hashed',
			role: 'STUDENT',
			student: {
				id: 'student-1',
				firstName: 'Jane',
				lastName: 'Doe',
				studentCode: 'STU-001',
			},
		});
		(verifyPassword as any).mockResolvedValue(true);
		(signAccessToken as any).mockReturnValue('signed.jwt');

		const result = await service.login('jane@example.com', 'password123');

		expect(prisma.user.findUnique).toHaveBeenCalledWith({
			where: { email: 'jane@example.com' },
			include: { student: true },
		});
		expect(signAccessToken).toHaveBeenCalledWith('user-1', 'STUDENT');
		expect(result).toEqual({
			accessToken: 'signed.jwt',
			user: {
				id: 'user-1',
				email: 'jane@example.com',
				role: 'STUDENT',
				student: {
					id: 'student-1',
					firstName: 'Jane',
					lastName: 'Doe',
					studentCode: 'STU-001',
				},
			},
		});
	});

	it('returns a null student for an ADMIN with no student profile', async () => {
		(prisma.user.findUnique as any).mockResolvedValue({
			id: 'admin-1',
			email: 'admin@example.com',
			hashedPassword: 'hashed',
			role: 'ADMIN',
			student: null,
		});
		(verifyPassword as any).mockResolvedValue(true);
		(signAccessToken as any).mockReturnValue('admin.jwt');

		const result = await service.login('admin@example.com', 'adminpass1');

		expect(result.user.student).toBeNull();
	});

	it('throws INVALID_CREDENTIALS when the user does not exist', async () => {
		(prisma.user.findUnique as any).mockResolvedValue(null);
		(verifyPassword as any).mockResolvedValue(false);

		await expect(
			service.login('nope@example.com', 'password123')
		).rejects.toMatchObject({ code: ErrorCode.INVALID_CREDENTIALS });

		expect(verifyPassword).toHaveBeenCalledWith('password123', '');
		expect(signAccessToken).not.toHaveBeenCalled();
	});

	it('throws INVALID_CREDENTIALS when the password is wrong', async () => {
		(prisma.user.findUnique as any).mockResolvedValue({
			id: 'user-1',
			email: 'jane@example.com',
			hashedPassword: 'hashed',
			role: 'STUDENT',
			student: null,
		});
		(verifyPassword as any).mockResolvedValue(false);

		await expect(
			service.login('jane@example.com', 'wrongpass')
		).rejects.toMatchObject({ code: ErrorCode.INVALID_CREDENTIALS });
		expect(signAccessToken).not.toHaveBeenCalled();
	});

	it('never leaks hashedPassword on the returned user', async () => {
		(prisma.user.findUnique as any).mockResolvedValue({
			id: 'user-1',
			email: 'jane@example.com',
			hashedPassword: 'super-secret-hash',
			role: 'STUDENT',
			student: null,
		});
		(verifyPassword as any).mockResolvedValue(true);
		(signAccessToken as any).mockReturnValue('jwt');

		const result = await service.login('jane@example.com', 'password123');

		expect(result.user).not.toHaveProperty('hashedPassword');
	});
});
