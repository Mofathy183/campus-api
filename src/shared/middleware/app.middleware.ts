import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import type { Request, Response } from 'express';

import { envConfig, env } from '@config';
import { STATUS_CODE, ErrorCode } from '@shared/errors';
import { createResponse } from '@shared/utils';

/**
 * app.middleware.ts
 * -------------------
 * Reused from Beggy's app.middleware.ts (beggy-reuse-audit.html §2)
 * for the parts that are pure infra: Pino setup, CORS, health check,
 * 404 handler. Rate limiting is kept too (cheap, "Optional" on the
 * package audit, no reason to skip). Everything CSRF/session-related
 * that used to live in this file is gone — see app.ts for the
 * corresponding cuts to the middleware stack.
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

export const corsMiddleware = cors({
	origin: envConfig.cors.origin,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});

/**
 * @route GET /health
 * Liveness check for Docker/host platform (Render/Railway/Fly.io).
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

export const limiter = rateLimit({
	windowMs: envConfig.rateLimit.windowMs,
	max: envConfig.rateLimit.max,
	skip: () => env.NODE_ENV === 'test',
	standardHeaders: true,
	handler: rateLimitHandler,
});

/**
 * Registered after all routes, before errorHandler — catches anything
 * that didn't match a route.
 */
export const routeNotFoundHandler = (req: Request, res: Response): void => {
	const details = { requestedPath: req.path, method: req.method };
	logger.warn(details, 'Route not found');
	res.status(STATUS_CODE.NOT_FOUND).json(
		createResponse.error(ErrorCode.ROUTE_NOT_FOUND, details)
	);
};
