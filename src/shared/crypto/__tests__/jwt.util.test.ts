import { describe, it, expect, vi, beforeEach } from 'vitest';

import jwt from 'jsonwebtoken';

import { signAccessToken, verifyAccessToken } from '@shared/crypto';

vi.mock('jsonwebtoken', () => ({
	default: {
		sign: vi.fn(),
		verify: vi.fn(),
	},
}));

describe('signAccessToken()', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns a signed access token', () => {
		(jwt.sign as any).mockReturnValue('access.jwt');

		const result = signAccessToken('user-id', 'STUDENT');

		expect(result).toBe('access.jwt');
		expect(jwt.sign).toHaveBeenCalledWith(
			{ sub: 'user-id', role: 'STUDENT' },
			expect.anything(),
			expect.anything()
		);
	});
});

describe('verifyAccessToken()', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns verified access token identity for an ADMIN', () => {
		(jwt.verify as any).mockReturnValue({
			sub: 'user-id',
			role: 'ADMIN',
			iat: 123456789,
		});

		const result = verifyAccessToken('access.jwt');

		expect(result).toEqual({
			id: 'user-id',
			role: 'ADMIN',
			issuedAt: 123456789,
		});
	});

	it('returns verified access token identity for a STUDENT', () => {
		(jwt.verify as any).mockReturnValue({
			sub: 'user-id',
			role: 'STUDENT',
			iat: 123456789,
		});

		const result = verifyAccessToken('access.jwt');

		expect(result.role).toBe('STUDENT');
	});

	it('propagates jwt.verify errors (expired/invalid signature)', () => {
		(jwt.verify as any).mockImplementation(() => {
			throw new Error('invalid');
		});

		expect(() => verifyAccessToken('bad.jwt')).toThrow();
	});

	it('throws when subject is missing', () => {
		(jwt.verify as any).mockReturnValue({
			role: 'ADMIN',
			iat: 123456789,
		});

		expect(() => verifyAccessToken('access.jwt')).toThrow();
	});

	it('throws when issuedAt is missing', () => {
		(jwt.verify as any).mockReturnValue({
			sub: 'user-id',
			role: 'ADMIN',
		});

		expect(() => verifyAccessToken('access.jwt')).toThrow();
	});

	it('throws when role is missing', () => {
		(jwt.verify as any).mockReturnValue({
			sub: 'user-id',
			iat: 123456789,
		});

		expect(() => verifyAccessToken('access.jwt')).toThrow();
	});

	it('throws when role is neither ADMIN nor STUDENT', () => {
		(jwt.verify as any).mockReturnValue({
			sub: 'user-id',
			role: 'TEACHER',
			iat: 123456789,
		});

		expect(() => verifyAccessToken('access.jwt')).toThrow();
	});
});
