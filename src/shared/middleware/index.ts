/**
 * @module shared/middleware
 * @description Public entry point for all Express middleware:
 * infrastructure (logging, CORS, rate limiting, health check,
 * 404 handling), request validation, and authentication.
 */
export {
	logger,
	pinoHttpLogger,
	corsMiddleware,
	healthCheck,
	limiter,
	routeNotFoundHandler,
} from './app.middleware';
export {
	validateRequest,
	validateBody,
	validateQuery,
	validateParams,
	validateUuidParam,
} from './validate.middleware';
export { requireAuth } from './auth.middleware';
