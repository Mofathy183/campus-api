import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * @module prisma.config
 * @description Prisma CLI configuration — points the CLI at the
 * multi-file `prisma/` schema directory and the migrations folder,
 * and supplies the database connection string from the validated
 * environment.
 */
export default defineConfig({
	schema: 'prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: process.env['DATABASE_URL'],
	},
});
