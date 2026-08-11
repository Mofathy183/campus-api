import 'dotenv/config';
import * as z from 'zod';

/**
 * @module config/env.config
 * @description
 * Validates `process.env` at process boot using Zod and exports a
 * typed, validated `env` object plus a derived `envConfig` grouping.
 * The rest of the application reads configuration through these
 * exports and never touches `process.env` directly, so a missing or
 * malformed variable fails fast at startup with a readable error
 * rather than surfacing as an obscure runtime failure later.
 */

const envSchema = z.object({
	// ------------------------------------------------------------------
	// Server
	// ------------------------------------------------------------------
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(4000),

	// ------------------------------------------------------------------
	// Database
	// ------------------------------------------------------------------
	/** Consumed by `prisma.config.ts` and the Prisma `PrismaPg` adapter. */
	DATABASE_URL: z.url({ protocol: /^postgresql|postgres$/ }),

	// ------------------------------------------------------------------
	// JWT — a single access token, no refresh token
	// ------------------------------------------------------------------
	JWT_ACCESS_TOKEN_SECRET: z
		.string()
		.min(32, 'JWT secret should be at least 32 characters'),

	/** `jsonwebtoken` `expiresIn` format (e.g. "1d", "24h", "15m"),
	 *  validated by the library itself at sign time. */
	JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('1d'),

	JWT_ISSUER: z.string().default('campus-api'),
	JWT_AUDIENCE: z.string().default('campus-api-client'),

	// ------------------------------------------------------------------
	// Security — bcrypt, CORS, rate limiting
	// ------------------------------------------------------------------
	BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

	/** Comma-separated origin list, split at use-site into the `cors`
	 *  package's `origin` array. Defaults to `'*'` for local
	 *  development; must be overridden with a real origin list before
	 *  deploying to production. */
	CORS_ORIGIN: z.string().default('*'),

	RATE_LIMIT_WINDOW_MS: z.coerce
		.number()
		.int()
		.positive()
		.default(15 * 60 * 1000),
	RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

	// ------------------------------------------------------------------
	// Logging
	// ------------------------------------------------------------------
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Parsed once at import time. A validation failure throws immediately
 * — a missing `DATABASE_URL` or JWT secret should crash the process
 * on boot, not surface later as a 500 on the first request that needs it.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error('❌ Invalid environment variables:');
	console.error(z.treeifyError(parsed.error));
	throw new Error('Invalid environment variables — see log above.');
}

/**
 * Typed, validated environment variables. Import this everywhere
 * instead of reading `process.env` directly.
 */
export const env = parsed.data;

/**
 * Grouped, derived configuration built on top of {@link env}, so
 * consuming modules (e.g. `jwt.util.ts`, `app.middleware.ts`) read
 * configuration through a small, purpose-shaped surface rather than
 * individual environment variable names.
 */
export const envConfig = {
	server: {
		port: env.PORT,
		isProduction: env.NODE_ENV === 'production',
		isTest: env.NODE_ENV === 'test',
	},

	security: {
		bcrypt: {
			saltRounds: env.BCRYPT_SALT_ROUNDS,
		},
		jwt: {
			access: {
				secret: env.JWT_ACCESS_TOKEN_SECRET,
				signOptions: {
					expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN,
					issuer: env.JWT_ISSUER,
					audience: env.JWT_AUDIENCE,
				},
			},
			base: {
				issuer: env.JWT_ISSUER,
				audience: env.JWT_AUDIENCE,
			},
		},
	},

	cors: {
		/** `'*'` stays a literal string for dev convenience; split into
		 *  an array only when a real allow-list is configured. */
		origin:
			env.CORS_ORIGIN === '*'
				? '*'
				: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
	},

	rateLimit: {
		windowMs: env.RATE_LIMIT_WINDOW_MS,
		max: env.RATE_LIMIT_MAX,
	},

	logging: {
		level: env.LOG_LEVEL,
	},
} as const;
