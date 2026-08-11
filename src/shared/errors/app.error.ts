import { type ErrorCode, ErrorMessages } from './error.catalog';

export const STATUS_CODE = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_ERROR: 500,
} as const;

export type StatusCode = (typeof STATUS_CODE)[keyof typeof STATUS_CODE];

export interface ErrorResponseOptions {
	/** Overrides the catalog message for this one throw site. */
	customMessage?: string;
}

/**
 * AppError
 * --------
 * This *is* the typed ErrorCode catalog the spec's §8 asks for —
 * reused near-verbatim from Beggy's app-error.util.ts
 * (beggy-reuse-audit.html §2), with one deliberate correction:
 *
 * Beggy's version only preserves `cause` on the native `Error.cause`
 * property when `cause instanceof Error`, which silently drops plain-
 * object causes (e.g. a Zod field-errors tree, a Prisma error meta
 * blob) — their own test suite documents this as expected behavior
 * (`app-error.util.test.ts`: "does not attach non-Error cause to
 * native cause property"), but it means error.handler.ts has nothing
 * to put in the response's `error` field for those cases.
 *
 * Here, `details` is a plain class field that always carries whatever
 * was passed in, Error or not, so error.handler.ts can surface it
 * (e.g. Zod validation trees) without extra plumbing.
 */
export class AppError extends Error {
	public readonly details?: unknown;

	constructor(
		public readonly code: ErrorCode,
		public readonly status: StatusCode,
		details?: unknown,
		public readonly options?: ErrorResponseOptions
	) {
		const message = options?.customMessage ?? ErrorMessages[code];
		super(
			message,
			details instanceof Error ? { cause: details } : undefined
		);
		this.name = 'AppError';
		this.details = details;
		Object.freeze(this);
	}
}

/**
 * Small factory helpers so services/controllers can throw expressively
 * (`throw appErrorMap.notFound(ErrorCode.STUDENT_NOT_FOUND)`) without
 * repeating status codes everywhere.
 */
export const appErrorMap = {
	notFound: (
		code: ErrorCode,
		details?: unknown,
		options?: ErrorResponseOptions
	) => new AppError(code, STATUS_CODE.NOT_FOUND, details, options),

	badRequest: (
		code: ErrorCode,
		details?: unknown,
		options?: ErrorResponseOptions
	) => new AppError(code, STATUS_CODE.BAD_REQUEST, details, options),

	unauthorized: (
		code: ErrorCode,
		details?: unknown,
		options?: ErrorResponseOptions
	) => new AppError(code, STATUS_CODE.UNAUTHORIZED, details, options),

	forbidden: (
		code: ErrorCode,
		details?: unknown,
		options?: ErrorResponseOptions
	) => new AppError(code, STATUS_CODE.FORBIDDEN, details, options),

	conflict: (
		code: ErrorCode,
		details?: unknown,
		options?: ErrorResponseOptions
	) => new AppError(code, STATUS_CODE.CONFLICT, details, options),

	serverError: (
		code: ErrorCode,
		details?: unknown,
		options?: ErrorResponseOptions
	) => new AppError(code, STATUS_CODE.INTERNAL_ERROR, details, options),
};
