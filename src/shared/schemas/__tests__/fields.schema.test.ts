import { describe, it, expect } from 'vitest';
import { FieldsSchema, ParamsSchema, PaginationSchema } from '@shared/schemas';

describe('FieldsSchema.email()', () => {
	const schema = FieldsSchema.email();

	it('parses a valid email address', () => {
		expect(schema.parse('student@example.com')).toBe('student@example.com');
	});

	it('trims surrounding whitespace', () => {
		expect(schema.parse('  Student@Example.com  ')).toBe(
			'student@example.com'
		);
	});

	it('normalizes the email to lowercase', () => {
		expect(schema.parse('Student@Example.COM')).toBe('student@example.com');
	});

	it('throws when the format is invalid', () => {
		expect(() => schema.parse('not-an-email')).toThrow();
		expect(() => schema.parse('user@')).toThrow();
		expect(() => schema.parse('@example.com')).toThrow();
	});

	it('throws when the value is an empty string', () => {
		expect(() => schema.parse('')).toThrow();
	});
});

describe('FieldsSchema.password()', () => {
	const schema = FieldsSchema.password();

	it('accepts a password within the 8–72 character range', () => {
		expect(schema.parse('password123')).toBe('password123');
	});

	it('trims surrounding whitespace', () => {
		expect(schema.parse('  password123  ')).toBe('password123');
	});

	it('throws when shorter than 8 characters', () => {
		expect(() => schema.parse('short1')).toThrow();
	});

	it('throws when longer than 72 characters', () => {
		expect(() => schema.parse('a'.repeat(73))).toThrow();
	});

	it('does not enforce a strength requirement', () => {
		expect(schema.parse('alllowercase')).toBe('alllowercase');
	});
});

describe('FieldsSchema.name()', () => {
	it('parses a valid name and trims it', () => {
		const schema = FieldsSchema.name('First name');
		expect(schema.parse('  Jane  ')).toBe('Jane');
	});

	it('throws with a label-specific message when empty', () => {
		const schema = FieldsSchema.name('First name');
		expect(() => schema.parse('')).toThrow('First name is required');
	});

	it('throws with a label-specific message when over 50 characters', () => {
		const schema = FieldsSchema.name('Last name');
		expect(() => schema.parse('a'.repeat(51))).toThrow(
			'Last name must be 50 characters or fewer'
		);
	});
});

describe('FieldsSchema.uuid()', () => {
	const schema = FieldsSchema.uuid();

	it('accepts a valid uuid', () => {
		const id = crypto.randomUUID();
		expect(schema.parse(id)).toBe(id);
	});

	it('rejects a non-uuid string', () => {
		expect(() => schema.parse('not-a-uuid')).toThrow();
	});

	it('rejects an empty string', () => {
		expect(() => schema.parse('')).toThrow();
	});
});

describe('FieldsSchema.studentCode()', () => {
	const schema = FieldsSchema.studentCode();

	it('accepts letters, numbers, and hyphens', () => {
		expect(schema.parse('STU-2026-001')).toBe('STU-2026-001');
	});

	it('trims surrounding whitespace', () => {
		expect(schema.parse('  STU001  ')).toBe('STU001');
	});

	it('throws when shorter than 3 characters', () => {
		expect(() => schema.parse('AB')).toThrow();
	});

	it('throws when longer than 20 characters', () => {
		expect(() => schema.parse('A'.repeat(21))).toThrow();
	});

	it('throws when it contains disallowed characters', () => {
		expect(() => schema.parse('STU 001')).toThrow();
		expect(() => schema.parse('STU_001')).toThrow();
		expect(() => schema.parse('STU#001')).toThrow();
	});
});

describe('FieldsSchema.courseCode()', () => {
	const schema = FieldsSchema.courseCode();

	it('accepts letters, numbers, and hyphens', () => {
		expect(schema.parse('CS201')).toBe('CS201');
	});

	it('trims surrounding whitespace', () => {
		expect(schema.parse('  CS-201  ')).toBe('CS-201');
	});

	it('throws when shorter than 2 characters', () => {
		expect(() => schema.parse('C')).toThrow();
	});

	it('throws when longer than 20 characters', () => {
		expect(() => schema.parse('C'.repeat(21))).toThrow();
	});

	it('throws when it contains disallowed characters', () => {
		expect(() => schema.parse('CS 201')).toThrow();
	});
});

describe('FieldsSchema.title()', () => {
	it('accepts a title within the default 150-character max', () => {
		const schema = FieldsSchema.title();
		expect(schema.parse('  Intro to Algorithms  ')).toBe(
			'Intro to Algorithms'
		);
	});

	it('throws when empty', () => {
		const schema = FieldsSchema.title();
		expect(() => schema.parse('')).toThrow();
	});

	it('throws when longer than the default max', () => {
		const schema = FieldsSchema.title();
		expect(() => schema.parse('a'.repeat(151))).toThrow();
	});

	it('respects a custom max length', () => {
		const schema = FieldsSchema.title(20);
		expect(() => schema.parse('a'.repeat(21))).toThrow();
		expect(schema.parse('a'.repeat(20))).toBe('a'.repeat(20));
	});
});

describe('FieldsSchema.description()', () => {
	const schema = FieldsSchema.description();

	it('is optional', () => {
		expect(schema.parse(undefined)).toBeUndefined();
	});

	it('parses and trims a provided description', () => {
		expect(schema.parse('  Some details.  ')).toBe('Some details.');
	});

	it('throws when longer than 2000 characters', () => {
		expect(() => schema.parse('a'.repeat(2001))).toThrow();
	});
});

describe('ParamsSchema.uuid', () => {
	it('parses an object with a valid uuid id', () => {
		const id = crypto.randomUUID();
		expect(ParamsSchema.uuid.parse({ id })).toEqual({ id });
	});

	it('throws when id is not a uuid', () => {
		expect(() => ParamsSchema.uuid.parse({ id: 'bad-id' })).toThrow();
	});

	it('throws when id is missing', () => {
		expect(() => ParamsSchema.uuid.parse({})).toThrow();
	});
});

describe('PaginationSchema', () => {
	it('defaults page to 1 and limit to 20 when omitted', () => {
		expect(PaginationSchema.parse({})).toEqual({ page: 1, limit: 20 });
	});

	it('coerces string query values to numbers', () => {
		expect(PaginationSchema.parse({ page: '3', limit: '50' })).toEqual({
			page: 3,
			limit: 50,
		});
	});

	it('throws when page is less than 1', () => {
		expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
	});

	it('throws when limit exceeds 100', () => {
		expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
	});

	it('throws when page or limit is not an integer', () => {
		expect(() => PaginationSchema.parse({ page: 1.5 })).toThrow();
	});
});
