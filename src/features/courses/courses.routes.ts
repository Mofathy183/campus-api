import { Router } from 'express';
import {
	requireAuth,
	validateBody,
	validateQuery,
	validateUuidParam,
} from '@shared/middleware';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseQuerySchema, CreateCourseSchema } from './courses.schema';

/**
 * @module features/courses/courses.routes
 * @description Mounts the courses feature's three routes, all gated
 * behind `requireAuth` — mounted at `/courses` in app.ts. No update
 * or delete route: the spec defines only GET / GET:id / POST for
 * this feature. `GET /` validates against `CourseQuerySchema`
 * (pagination + optional `search`/`code`) rather than the bare
 * shared `PaginationSchema`.
 */
const router = Router();

const coursesService = new CoursesService();
const coursesController = new CoursesController(coursesService);

router.use(requireAuth);

router.get('/', validateQuery(CourseQuerySchema), coursesController.list);
router.get('/:id', validateUuidParam, coursesController.getById);
router.post('/', validateBody(CreateCourseSchema), coursesController.create);

export const coursesRouter = router;
