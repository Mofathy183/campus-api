import type { Student, User } from '@prisma-generated/client';
import { prisma } from '@config';
import { BaseService } from '@shared/core';
import { ErrorCode } from '@shared/errors';
import { hashPassword } from '@shared/crypto';
import { buildPaginationMeta, type PaginationPayload } from '@shared/utils';
import type { Role } from '@shared/types';
import type { CreateStudentInput, UpdateStudentInput } from './students.schema';

/** Fields pulled off the related `User` on every read — never `hashedPassword`. */
const userSelect = { id: true, email: true, role: true } as const;

type StudentWithUser = Student & {
	user: Pick<User, 'id' | 'email' | 'role'>;
};

/** The student shape returned to the client — merges profile + account fields. */
export interface SafeStudent {
	id: string;
	firstName: string;
	lastName: string;
	studentCode: string;
	email: string;
	role: Role;
}

export interface StudentListResult {
	items: SafeStudent[];
	meta: ReturnType<typeof buildPaginationMeta>;
}

export class StudentsService extends BaseService {
	constructor() {
		super({ domain: 'students', service: 'StudentsService' });
	}

	async list(pagination: PaginationPayload): Promise<StudentListResult> {
		const { skip, take, page, limit } = pagination;

		const [items, count] = await Promise.all([
			prisma.student.findMany({
				skip,
				take,
				orderBy: { createdAt: 'desc' },
				include: { user: { select: userSelect } },
			}),
			prisma.student.count(),
		]);

		return {
			items: items.map(this.toSafeStudent),
			meta: buildPaginationMeta(page, limit, count),
		};
	}

	/** @throws {AppError} `STUDENT_NOT_FOUND` if no student matches `id`. */
	async getById(id: string): Promise<SafeStudent> {
		const student = await prisma.student.findUnique({
			where: { id },
			include: { user: { select: userSelect } },
		});
		return this.toSafeStudent(
			this.assertFound(student, ErrorCode.STUDENT_NOT_FOUND, { id })
		);
	}

	/**
	 * Creates the `User` (login credential) and `Student` (profile) in a
	 * single transaction — there is no standalone registration route,
	 * so this is the only entry point that provisions a student account.
	 *
	 * @throws {AppError} `EMAIL_ALREADY_EXISTS` / `STUDENT_CODE_ALREADY_EXISTS`
	 * (via Prisma P2002, mapped in `error.handler.ts`) if either is taken.
	 */
	async create(input: CreateStudentInput): Promise<SafeStudent> {
		const hashedPassword = await hashPassword(input.password);

		const student = await prisma.$transaction(async (tx) => {
			const user = await tx.user.create({
				data: { email: input.email, hashedPassword, role: 'STUDENT' },
			});

			return tx.student.create({
				data: {
					userId: user.id,
					firstName: input.firstName,
					lastName: input.lastName,
					studentCode: input.studentCode,
				},
				include: { user: { select: userSelect } },
			});
		});

		return this.toSafeStudent(student);
	}

	/**
	 * Updates only Student profile fields. Existence is checked
	 * explicitly first so a missing id surfaces as `STUDENT_NOT_FOUND`
	 * rather than the generic Prisma P2025 → `RESOURCE_NOT_FOUND` fallback.
	 *
	 * @throws {AppError} `STUDENT_NOT_FOUND` if no student matches `id`.
	 */
	async update(id: string, input: UpdateStudentInput): Promise<SafeStudent> {
		await this.getById(id);

		const student = await prisma.student.update({
			where: { id },
			data: this.stripNullish(input),
			include: { user: { select: userSelect } },
		});

		return this.toSafeStudent(student);
	}

	/**
	 * Deletes the `User`, not just the `Student` — `Student.user` cascades
	 * (see `student.prisma`), so this removes both the profile and the
	 * login credential together rather than leaving an orphaned account.
	 *
	 * @throws {AppError} `STUDENT_NOT_FOUND` if no student matches `id`.
	 */
	async delete(id: string): Promise<void> {
		const student = this.assertFound(
			await prisma.student.findUnique({ where: { id } }),
			ErrorCode.STUDENT_NOT_FOUND,
			{ id }
		);

		await prisma.user.delete({ where: { id: student.userId } });
	}

	private toSafeStudent = (student: StudentWithUser): SafeStudent => ({
		id: student.id,
		firstName: student.firstName,
		lastName: student.lastName,
		studentCode: student.studentCode,
		email: student.user.email,
		role: student.user.role,
	});
}
