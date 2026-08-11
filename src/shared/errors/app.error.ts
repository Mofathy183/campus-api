import { type ErrorCode, ErrorMessages } from './error.catalog';

/**
 * @module shared/errors/app.error
 * @description
 * Defines {@link AppError}, the application's canonical error type,
 * along with the HTTP status-code constants and factory helpers used
 * to construct it. Every error thrown intentionally by application
 * code (as opposed to an unexpected exception) should be an
 * `AppError`, so {@link module:shared/errors/error.handler} can
 * translate it into a response in one place.
 */

/** Canonical HTTP status codes used across the API. */
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

/** Union of every valid HTTP status code value in {@link STATUS_CODE}. */
export type StatusCode = (typeof STATUS_CODE)[keyof typeof STATUS_CODE];

/** Optional per-throw-site overrides for an {@link AppError}. */
export interface ErrorResponseOptions {
	/** Overrides the catalog message for this one throw site. */
	customMessage?: string;
}

/**
 * The application's canonical, typed error.
 *
 * Wraps a stable {@link ErrorCode}, an HTTP {@link StatusCode}, and an
 * optional `details` payload (e.g. a validation tree or the original
 * cause) into a single immutable object that
 * {@link module:shared/errors/error.handler} knows how to serialize.
 * Application code should throw this — via the {@link appErrorMap}
 * helpers below — rather than a bare `Error`, so every intentional
 * failure carries enough structure to produce a consistent response.
 *
 * `details` is retained as a plain field regardless of its type
 * (`Error` instance, Zod validation tree, or otherwise), so the error
 * handler always has something to surface without extra type
 * narrowing. The instance is frozen after construction — an
 * `AppError` is a value, not something callers should mutate once
 * created.
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
 * Factory helpers for constructing an {@link AppError} at the correct
 * HTTP status without repeating status codes at every throw site.
 *
 * @example
 * ```ts
 * throw appErrorMap.notFound(ErrorCode.STUDENT_NOT_FOUND);
 * ```
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
