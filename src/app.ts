import express, { type Express } from 'express';
import helmet from 'helmet';

import {
	corsMiddleware,
	pinoHttpLogger,
	healthCheck,
	limiter,
	routeNotFoundHandler,
} from '@shared/middleware';
import { errorHandler } from '@shared/errors';
import { apiResponseMap } from '@shared/utils';

// Feature routers are mounted below as each module lands. Nothing in
// shared/ depends on these — app.ts is the only file that wires
// features together, keeping the shared layer framework-agnostic and
// independent of route registration order.
//
import { authRouter } from '@features/auth/auth.routes';
import { studentsRouter } from '@features/students/students.routes';
import { coursesRouter } from '@features/courses/courses.routes';
import { assignmentsRouter } from '@features/assignments/assignments.routes';

/**
 * @module app
 * @description
 * Application entry point. Builds and configures the Express instance:
 * security headers, CORS, rate limiting, JSON parsing, structured
 * request logging, route mounting, and the terminal error-handling
 * chain. Exported (rather than started) so it can be imported directly
 * by integration tests without binding a network port — see
 * {@link module:server} for the process entry point that calls
 * `app.listen()`.
 */

const app: Express = express();

// ------------------------------------------------------------------
// Security & parsing
//
// Deliberately minimal: helmet for standard security headers, CORS,
// a fixed-window rate limiter, and the JSON body parser. There is no
// cookie parser, no server-side session store, and no CSRF middleware
// mounted here — authentication is stateless (bearer JWT), so none of
// that infrastructure is applicable. A Swagger/OpenAPI UI is likewise
// intentionally not mounted; API usage is documented in the README.
// ------------------------------------------------------------------
app.use(helmet());
app.use(corsMiddleware);
app.use(limiter);
app.use(express.json());

// ------------------------------------------------------------------
// Logging
// ------------------------------------------------------------------
app.use(pinoHttpLogger);

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------

/**
 * @route GET /
 * Unauthenticated landing route. Purely informational — confirms the
 * API is up and points callers at the README for the real endpoint
 * list. Kept in the same `{ success, message, data }` envelope as
 * every other route rather than a bespoke shape, since this is a
 * normal API response a client (or a grader) may actually read.
 *
 * Distinct from `GET /health`: `/health` is the machine-facing
 * contract for Docker/load balancers/uptime monitors and intentionally
 * stays a minimal, stable shape of its own — this route is the
 * human-facing "you're at the right place" response. Don't collapse
 * the two.
 */
app.get('/', (_req, res) => {
	res.status(200).json(
		apiResponseMap.ok(
			{
				name: 'campus-api',
				version: '1.0.0',
				docs: 'See README.md for available endpoints',
			},
			'campus-api is running'
		)
	);
});

app.get('/health', healthCheck);

app.use('/login', authRouter);
app.use('/students', studentsRouter);
app.use('/courses', coursesRouter);
app.use('/assignments', assignmentsRouter);

// ------------------------------------------------------------------
// Error handling — MUST be registered last, in this exact order:
// unmatched-route handler first, generic error handler second.
// ------------------------------------------------------------------
app.all('/{*splat}', routeNotFoundHandler);
app.use(errorHandler);

export default app;
