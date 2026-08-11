import { Router } from 'express';
import {
	requireAuth,
	validateBody,
	validateQuery,
	validateUuidParam,
} from '@shared/middleware';
import { PaginationSchema } from '@shared/schemas';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CreateCourseSchema } from './courses.schema';

/**
 * @module features/courses/courses.routes
 * @description Mounts the courses feature's three routes, all gated
 * behind `requireAuth` — mounted at `/courses` in app.ts. No update
 * or delete route: the spec defines only GET / GET:id / POST for
 * this feature.
 */
const router = Router();

const coursesService = new CoursesService();
const coursesController = new CoursesController(coursesService);

router.use(requireAuth);

router.get('/', validateQuery(PaginationSchema), coursesController.list);
router.get('/:id', validateUuidParam, coursesController.getById);
router.post('/', validateBody(CreateCourseSchema), coursesController.create);

export const coursesRouter = router;
