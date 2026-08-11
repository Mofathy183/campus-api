/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: 'node',

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
