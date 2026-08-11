import type { Logger } from 'pino';
import { appErrorMap, type ErrorCode } from '@shared/errors';
import { logger } from '@shared/middleware';

interface BaseServiceOptions {
	/** e.g. 'students' | 'courses' | 'assignments' | 'auth' */
	domain: string;
	/** e.g. 'StudentService' */
	service: string;
}

/**
 * @module shared/core/base.service
 * @description
 * Abstract base class for feature services, providing a scoped
 * logger and a small set of helpers for the not-found / partial-update
 * patterns that recur across every domain's data-access layer.
 */

/**
 * Base class every feature service (`students.service.ts`,
 * `courses.service.ts`, etc.) extends. Centralizes a scoped Pino
 * logger and the two operations every service performs repeatedly:
 * stripping empty fields from an update payload, and turning a
 * `null` lookup result into a typed 404.
 */
export abstract class BaseService {
	protected readonly log: Logger;

	constructor(options: BaseServiceOptions) {
		this.log = logger.child({
			domain: options.domain,
			service: options.service,
		});
	}

	/**
	 * Strips `undefined`/`null` entries from a partial update payload
	 * before passing it to a Prisma `update` call, so a `PUT`/`PATCH`
	 * only writes fields the client actually sent. Preserves falsy-but-
	 * meaningful values (`false`, `0`, `''`).
	 *
	 * @param input - The raw update payload.
	 * @returns The payload with `undefined`/`null` entries removed.
	 */
	protected stripNullish<T extends Record<string, unknown>>(
		input: T
	): Partial<T> {
		return Object.fromEntries(
			Object.entries(input).filter(
				([, value]) => value !== undefined && value !== null
			)
		) as Partial<T>;
	}

	/**
	 * Throws a typed 404 {@link AppError} for the given error code.
	 */
	protected throwNotFound(code: ErrorCode): never {
		throw appErrorMap.notFound(code);
	}

	/**
	 * Collapses the "null-check, log, throw" pattern that follows every
	 * `findUnique`-style lookup into a single call. Returns the entity
	 * narrowed to non-nullable if present; throws a typed 404 otherwise.
	 *
	 * @example
	 * ```ts
	 * const student = await this.prisma.student.findUnique({ where: { id } });
	 * return this.assertFound(student, ErrorCode.STUDENT_NOT_FOUND, { id });
	 * ```
	 *
	 * @param entity - The lookup result to check.
	 * @param code - Error code to throw if `entity` is `null`/`undefined`.
	 * @param logContext - Optional structured context logged as a warning on miss.
	 * @returns `entity`, narrowed to `T`.
	 * @throws {AppError} If `entity` is `null` or `undefined`.
	 */
	protected assertFound<T>(
		entity: T | null | undefined,
		code: ErrorCode,
		logContext?: Record<string, unknown>
	): T {
		if (entity == null) {
			if (logContext)
				this.log.warn(logContext, `Entity not found [${code}]`);
			this.throwNotFound(code);
		}
		return entity;
	}
}
