import { prisma } from '@config';
import { hashPassword } from '@shared/crypto';

async function main() {
	const hashed = await hashPassword('Password123!');

	const adminUser = await prisma.user.create({
		data: {
			email: 'admin@campus.test',
			hashedPassword: hashed,
			role: 'ADMIN',
		},
	});

	const course = await prisma.course.create({
		data: {
			code: 'CS201',
			title: 'Data Structures',
			description: 'Intro to DS & algorithms',
		},
	});

	const studentUser = await prisma.user.create({
		data: {
			email: 'jane.doe@campus.test',
			hashedPassword: hashed,
			role: 'STUDENT',
		},
	});
	const student = await prisma.student.create({
		data: {
			userId: studentUser.id,
			firstName: 'Jane',
			lastName: 'Doe',
			studentCode: 'STU-001',
		},
	});

	await prisma.assignment.create({
		data: {
			title: 'Assignment 1',
			studentId: student.id,
			status: 'PENDING',
		},
	});

	console.log('Seed complete:', {
		adminUser: adminUser.email,
		course: course.code,
		student: student.studentCode,
	});
}

main().finally(() => prisma.$disconnect());
