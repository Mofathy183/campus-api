import { Router } from 'express';
import {
	requireAuth,
	validateBody,
	validateQuery,
	validateUuidParam,
} from '@shared/middleware';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import {
	CreateStudentSchema,
	StudentQuerySchema,
	UpdateStudentSchema,
} from './students.schema';

/**
 * @module features/students/students.routes
 * @description Mounts the students feature's five routes, all gated
 * behind `requireAuth` — mounted at `/students` in app.ts. `GET /`
 * validates against `StudentQuerySchema` (pagination + optional
 * `search`) rather than the bare shared `PaginationSchema`.
 */
const router = Router();

const studentsService = new StudentsService();
const studentsController = new StudentsController(studentsService);

router.use(requireAuth);

router.get('/', validateQuery(StudentQuerySchema), studentsController.list);
router.get('/:id', validateUuidParam, studentsController.getById);
router.post('/', validateBody(CreateStudentSchema), studentsController.create);
router.put(
	'/:id',
	validateUuidParam,
	validateBody(UpdateStudentSchema),
	studentsController.update
);
router.delete('/:id', validateUuidParam, studentsController.remove);

export const studentsRouter = router;
