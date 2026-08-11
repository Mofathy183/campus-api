import {
	type ErrorCode,
	ErrorMessages,
	type ErrorResponseOptions,
} from '@shared/errors';

/**
 * @module shared/utils/api-response.util
 * @description
 * Defines the API's response envelope and the helper functions that
 * build it, so every route returns success and error bodies in
 * exactly the same shape: `{ success, message, data? }` for success,
 * `{ success, message, code, error? }` for failure. `meta` is added
 * only on paginated list responses.
 */

/** Pagination metadata attached to a paginated list response. */
export interface PaginationMeta {
	page: number;
	limit: number;
	count: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

/** Shape of every successful JSON response. */
export interface SuccessResponse<T> {
	success: true;
	message: string;
	data: T;
	meta?: PaginationMeta;
}

/** Shape of every failed JSON response. */
export interface ErrorBody {
	success: false;
	message: string;
	code: ErrorCode;
	/** Present only for validation failures (a Zod field-errors tree)
	 *  or when an `AppError` was thrown with `details` — omitted
	 *  otherwise so a plain 404/401 doesn't carry a stray
	 *  `error: undefined`. */
	error?: unknown;
}

/**
 * Low-level builders for the two response shapes. Prefer
 * {@link apiResponseMap} from controllers for the common success
 * cases; use `createResponse.error` directly from the error handler.
 */
export const createResponse = {
	success: <T>(
		data: T,
		message: string,
		meta?: PaginationMeta
	): SuccessResponse<T> => ({
		success: true,
		message,
		data,
		...(meta ? { meta } : {}),
	}),

	error: (
		code: ErrorCode,
		details?: unknown,
		options?: ErrorResponseOptions
	): ErrorBody => ({
		success: false,
		message: options?.customMessage ?? ErrorMessages[code],
		code,
		...(details !== undefined ? { error: details } : {}),
	}),
};

/**
 * Pre-configured helpers for the two most common success cases —
 * used by {@link BaseController}'s `ok`/`created` methods instead of
 * calling {@link createResponse} directly.
 */
export const apiResponseMap = {
	ok: <T>(data: T, message = 'Request successful', meta?: PaginationMeta) =>
		createResponse.success(data, message, meta),

	created: <T>(data: T, message = 'Resource created') =>
		createResponse.success(data, message),
};
