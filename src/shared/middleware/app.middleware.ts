import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import type { Request, Response } from 'express';

import { envConfig, env } from '@config';
import { STATUS_CODE, ErrorCode } from '@shared/errors';
import { createResponse } from '@shared/utils';

/**
 * @module shared/middleware/app.middleware
 * @description
 * Application-wide infrastructure middleware: structured logging
 * (Pino), CORS, rate limiting, the liveness health check, and the
 * catch-all handler for unmatched routes.
 */

/**
 * Base Pino logger instance. Pretty-printed in non-production
 * environments for local readability; structured JSON in production
 * for log-aggregation tooling.
 */
export const logger = pino({
	level: envConfig.logging.level,
	base: { app: 'campus-api' },
	transport:
		env.NODE_ENV !== 'production'
			? {
					target: 'pino-pretty',
					options: {
						colorize: true,
						translateTime: 'yyyy-mm-dd HH:MM:ss',
						ignore: 'pid,hostname',
					},
				}
			: undefined,
});

/**
 * HTTP request/response logging middleware, mounted globally in
 * `app.ts`. Logs one line per request with method, URL, status code,
 * and response time; escalates to `warn`/`error` level based on the
 * resulting status code or a thrown error.
 */
export const pinoHttpLogger = pinoHttp({
	logger,
	customLogLevel: (_req, res, err) => {
		if (res.statusCode >= 500 || err) return 'error';
		if (res.statusCode >= 400) return 'warn';
		return 'info';
	},
	customSuccessMessage: (req, res, responseTime) =>
		`${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`,
	serializers: {
		req: (req) => ({ method: req.method, url: req.url }),
		res: (res) => ({ statusCode: res.statusCode }),
	},
});

/** CORS middleware, configured from `CORS_ORIGIN`. */
export const corsMiddleware = cors({
	origin: envConfig.cors.origin,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});

/**
 * Liveness check for the hosting platform.
 *
 * @route GET /health
 */
export const healthCheck = (_req: Request, res: Response): void => {
	res.status(STATUS_CODE.OK).json({
		status: 'ok',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
};

const rateLimitHandler = (_req: Request, res: Response): void => {
	res.status(STATUS_CODE.TOO_MANY_REQUESTS).json(
		createResponse.error(ErrorCode.RATE_LIMITED)
	);
};

/**
 * Fixed-window rate limiter applied globally. Disabled during
 * automated tests (`NODE_ENV=test`) so test suites aren't throttled
 * by their own request volume.
 */
export const limiter = rateLimit({
	windowMs: envConfig.rateLimit.windowMs,
	max: envConfig.rateLimit.max,
	skip: () => env.NODE_ENV === 'test',
	standardHeaders: true,
	handler: rateLimitHandler,
});

/**
 * Catch-all handler for any request that didn't match a mounted
 * route. Registered after every feature router and before
 * {@link module:shared/errors/error.handler.errorHandler} in `app.ts`.
 */
export const routeNotFoundHandler = (req: Request, res: Response): void => {
	const details = { requestedPath: req.path, method: req.method };
	logger.warn(details, 'Route not found');
	res.status(STATUS_CODE.NOT_FOUND).json(
		createResponse.error(ErrorCode.ROUTE_NOT_FOUND, details)
	);
};
