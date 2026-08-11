import 'dotenv/config';
import * as z from 'zod';

/**
 * env.config.ts
 * -------------
 * Validates process.env at boot using Zod, fails fast with a readable
 * error if anything required is missing/malformed, and exports a typed
 * `env` object so the rest of the app never touches `process.env` raw.
 *
 * Trimmed hard from Beggy's version. Beggy's env schema also validates:
 * cookie names, session secret, CSRF secret, refresh-token secrets/TTLs,
 * Google/Facebook OAuth client IDs+secrets+callback URLs, Resend email
 * API key, frontend success/failure redirect URLs. None of that applies
 * here — see beggy-reuse-audit.html §3/§4/§5 for why (bearer tokens only,
 * no sessions, no OAuth, no email flows, no frontend to redirect to).
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
	/**
	 * Consumed directly by prisma.config.ts (`datasource.url`) and by
	 * Prisma's PrismaPg adapter — same pattern as Beggy's DATABASE_URL.
	 */
	DATABASE_URL: z.url({ protocol: /^postgresql|postgres$/ }),

	// ------------------------------------------------------------------
	// JWT — single access token, no refresh token
	// ------------------------------------------------------------------
	/**
	 * Only one secret, unlike Beggy's separate access/refresh secrets —
	 * there's only one token type to sign per the auth-model switch.
	 */
	JWT_ACCESS_TOKEN_SECRET: z
		.string()
		.min(32, 'JWT secret should be at least 32 characters'),

	/**
	 * jsonwebtoken `expiresIn` format (e.g. "1d", "24h", "15m").
	 * Kept as a plain string, validated at jwt.sign() call time by the
	 * jsonwebtoken lib itself — matches Beggy's SignOptions.expiresIn usage.
	 */
	JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('1d'),

	JWT_ISSUER: z.string().default('campus-api'),
	JWT_AUDIENCE: z.string().default('campus-api-client'),

	// ------------------------------------------------------------------
	// Security — bcrypt, CORS, rate limiting
	// ------------------------------------------------------------------
	BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

	/**
	 * Comma-separated list, split at use-site into the `cors` package's
	 * `origin` array — see app.middleware.ts's corsMiddleware.
	 * No frontend exists for this spec, so this defaults to '*' in dev;
	 * MUST be overridden in production once a real client origin exists.
	 */
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
 * Parse once at import time. Throwing here (rather than returning a
 * Zod error object) is intentional — a missing DATABASE_URL or JWT
 * secret should crash the process on boot, not surface as a runtime
 * 500 on the first request that needs it.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error('❌ Invalid environment variables:');
	console.error(z.treeifyError(parsed.error));
	throw new Error('Invalid environment variables — see log above.');
}

/**
 * Typed, validated environment. Import this everywhere instead of
 * reading `process.env` directly.
 */
export const env = parsed.data;

/**
 * envConfig
 * ---------
 * Grouped/derived config built on top of `env`, mirroring Beggy's
 * envConfig shape (envConfig.security.jwt.*, envConfig.cookies.*, etc.)
 * so downstream files (jwt.util.ts, app.middleware.ts) read config the
 * same way Beggy's do — just with a much smaller surface.
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
		/**
		 * '*' stays a literal string for dev convenience; split into an
		 * array only when a real allow-list is configured.
		 */
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
