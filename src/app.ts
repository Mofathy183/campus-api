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

// Feature routers get mounted below as each module lands. Nothing in
// shared/ depends on these — this is the only file that wires
// features together, matching the app.ts/server.ts split decision
// (campus-api-project-context.html §3/§4).
//
// import { authRouter } from './features/auth/auth.routes';
// import { studentsRouter } from './features/students/students.routes';
// import { coursesRouter } from './features/courses/courses.routes';
// import { assignmentsRouter } from './features/assignments/assignments.routes';

const app: Express = express();

// ------------------------------------------------------------------
// Security & parsing — cheap, standard hardening (beggy-reuse-audit
// .html §3 "app.ts middleware stack"). No cookie-parser, no
// express-session, no express-flash, no CSRF, no Swagger mount —
// none of it applies to a stateless bearer-token API, and Swagger
// isn't asked for (README + API examples is, per spec §9).
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

// app.use('/login', authRouter);           // POST /login
// app.use('/students', studentsRouter);    // GET/GET:id/POST/PUT/DELETE
// app.use('/courses', coursesRouter);      // GET/GET:id/POST
// app.use('/assignments', assignmentsRouter); // GET/POST/PATCH:id

// ------------------------------------------------------------------
// Error handling — MUST be last, in this order
// ------------------------------------------------------------------
app.all('/{*splat}', routeNotFoundHandler);
app.use(errorHandler);

export default app;
