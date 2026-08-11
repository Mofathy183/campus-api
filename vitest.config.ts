/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		setupFiles: ['./tests/vitest.setup.ts'],

		include: ['**/__tests__/*.test.ts'],
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/__tests__/*.integration.test.ts',
		],

		sequence: {
			concurrent: false,
		},

		globals: true,
		clearMocks: true,
		restoreMocks: true,
		mockReset: true,

		coverage: {
			provider: 'v8',
			reportsDirectory: 'coverage/vitest',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.ts'],
			exclude: ['src/tests/**', 'src/index.ts', '**/*.d.ts'],
		},
	},
});
