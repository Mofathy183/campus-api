// MUST be first — before any other imports, so env.config.ts's
// process.env validation observes real values when it runs at
// import time.
import 'dotenv/config';

import app from '@/app';
import { envConfig } from '@config';

/**
 * @module server
 * @description
 * Process entry point. Binds the configured Express application
 * ({@link module:app}) to a port and starts listening for
 * connections.
 *
 * Kept separate from `app.ts` on purpose: `app.ts` exports a fully
 * configured `Express` instance with no listening socket, so test
 * suites (e.g. Supertest) can import it directly and issue requests
 * in-process without opening a real port. This file is the only place
 * `app.listen()` is called.
 */
app.listen(envConfig.server.port, () => {
	// eslint-disable-next-line no-console
	console.log(
		`campus-api listening on http://localhost:${envConfig.server.port}`
	);
});
