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

// Feature routers are mounted below as each module lands. Nothing in
// shared/ depends on these — app.ts is the only file that wires
// features together, keeping the shared layer framework-agnostic and
// independent of route registration order.
//
import { authRouter } from './features/auth/auth.routes';
import { studentsRouter } from './features/students/students.routes';
// import { coursesRouter } from './features/courses/courses.routes';
// import { assignmentsRouter } from './features/assignments/assignments.routes';

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
app.get('/health', healthCheck);

app.use('/login', authRouter); // POST /login
app.use('/students', studentsRouter); // GET / GET:id / POST / PUT / DELETE
// app.use('/courses', coursesRouter);         // GET / GET:id / POST
// app.use('/assignments', assignmentsRouter); // GET / POST / PATCH:id

// ------------------------------------------------------------------
// Error handling — MUST be registered last, in this exact order:
// unmatched-route handler first, generic error handler second.
// ------------------------------------------------------------------
app.all('/{*splat}', routeNotFoundHandler);
app.use(errorHandler);

export default app;
