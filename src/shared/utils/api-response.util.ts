import {
	type ErrorCode,
	ErrorMessages,
	type ErrorResponseOptions,
} from '@shared/errors';

/**
 * api-response.util.ts
 * ---------------------
 * Adjusted from Beggy's api-response.util.ts (beggy-reuse-audit.html
 * §3). Beggy's envelope is
 *   { success, status, message, data, meta, timestamp, suggestion }
 * — the spec's example is just { success, message } (+ data on reads).
 * Simplified here to: success + message, data on reads, meta only for
 * paginated list endpoints (pagination is one of the three chosen
 * bonuses). `code` is kept on error responses — it's the cheap,
 * genuinely useful part of PyLedger's ErrorCode pattern the spec's
 * §8 points at, and costs nothing to include alongside `message`.
 */
export interface PaginationMeta {
	page: number;
	limit: number;
	count: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface SuccessResponse<T> {
	success: true;
	message: string;
	data: T;
	meta?: PaginationMeta;
}

export interface ErrorBody {
	success: false;
	message: string;
	code: ErrorCode;
	/** Present only for validation failures (Zod field-errors tree) or
	 *  when an AppError was thrown with `details` — omitted otherwise
	 *  so a plain 404/401 doesn't carry a stray `error: undefined`. */
	error?: unknown;
}

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
 * Pre-configured helpers for the common cases — use these from
 * controllers instead of `createResponse` directly.
 */
export const apiResponseMap = {
	ok: <T>(data: T, message = 'Request successful', meta?: PaginationMeta) =>
		createResponse.success(data, message, meta),

	created: <T>(data: T, message = 'Resource created') =>
		createResponse.success(data, message),
};
