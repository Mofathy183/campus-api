import { Router } from 'express';
import {
	requireAuth,
	validateBody,
	validateQuery,
	validateUuidParam,
} from '@shared/middleware';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import {
	AssignmentQuerySchema,
	CreateAssignmentSchema,
	UpdateAssignmentStatusSchema,
} from './assignments.schema';

/**
 * @module features/assignments/assignments.routes
 * @description Mounts the assignments feature's three routes, all
 * gated behind `requireAuth` — mounted at `/assignments` in app.ts.
 * No `GET /:id` or `DELETE`: the spec defines only
 * GET / POST / PATCH:id for this feature. `GET /` validates against
 * `AssignmentQuerySchema` (pagination + optional `status`/
 * `studentId`/`search`) rather than the bare shared
 * `PaginationSchema`.
 */
const router = Router();

const assignmentsService = new AssignmentsService();
const assignmentsController = new AssignmentsController(assignmentsService);

router.use(requireAuth);

router.get(
	'/',
	validateQuery(AssignmentQuerySchema),
	assignmentsController.list
);
router.post(
	'/',
	validateBody(CreateAssignmentSchema),
	assignmentsController.create
);
router.patch(
	'/:id',
	validateUuidParam,
	validateBody(UpdateAssignmentStatusSchema),
	assignmentsController.updateStatus
);

export const assignmentsRouter = router;
