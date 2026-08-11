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
 * BaseService
 * -------------
 * Trimmed from Beggy's base.service.ts (beggy-reuse-audit.html §2,
 * flagged as "the single biggest write-once-use-everywhere win
 * available"). campus-api's base class didn't need any cuts beyond
 * what base.controller.ts needed — the OAuth/orderBy coupling in
 * Beggy's version lives entirely in its controller, not its service.
 *
 * NOTE: this folder (shared/core/) isn't in the original folder-
 * structure doc — it's a deliberate addition on top of that plan,
 * directly because the reuse audit calls out base.controller/
 * base.service as worth porting. Domain folder, mixed types, same
 * pattern as shared/errors/ and shared/crypto/.
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
	 * Strips `undefined`/`null` from a partial update payload before a
	 * Prisma `update` call, so PUT/PATCH only writes fields the client
	 * actually sent. Preserves `false` and `0`.
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

	protected throwNotFound(code: ErrorCode): never {
		throw appErrorMap.notFound(code);
	}

	/**
	 * Collapses the null-check + log + throw pattern that follows every
	 * `findUnique` call into one line.
	 *
	 *   const student = await this.prisma.student.findUnique({ where: { id } });
	 *   return this.assertFound(student, ErrorCode.STUDENT_NOT_FOUND, { id });
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
