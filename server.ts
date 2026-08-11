// MUST be first — before any other imports, so env.config.ts's
// process.env validation sees real values when it runs at import time.
import 'dotenv/config';

import app from '@/app';
import { envConfig } from '@config';

/**
 * server.ts
 * -----------
 * Lives at the project root (not src/server.ts) to match package.json's
 * `"dev": "tsx watch --clear-screen=false server.ts"` script — kept
 * separate from app.ts purely for Supertest importability (app.ts has
 * no app.listen() call, so tests can import the Express app without
 * binding a port).
 */
app.listen(envConfig.server.port, () => {
	// eslint-disable-next-line no-console
	console.log(
		`campus-api listening on http://localhost:${envConfig.server.port}`
	);
});
