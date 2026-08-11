import { defineConfig } from 'eslint/config';
import path from 'node:path';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
	// Base recommended configs
	js.configs.recommended,

	// Global ignores
	{
		ignores: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/coverage/**',
			'**/out/**',
			'*.config.js',
			'*.config.mjs',
			'*.config.ts',

			// ✅ tests
			'**/__tests__/**',
			'**/tests/**',
			'**/*.test.*',
		],
	},

	// Base configuration for all TypeScript files
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
			import: importPlugin,
			prettier: prettier,
		},
		rules: {
			...typescript.configs.recommended.rules,
			...prettierConfig.rules,

			// TypeScript rules
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{
					prefer: 'type-imports',
					fixStyle: 'inline-type-imports',
				},
			],

			// Import rules
			'import/no-unresolved': 'off',
			'import/named': 'off',
			'import/namespace': 'off',
			'import/default': 'off',
			'import/no-named-as-default-member': 'off',
			'import/first': 'error',
			'import/newline-after-import': 'off',
			'import/no-duplicates': 'error',

			// Prettier
			'prettier/prettier': 'off',

			// General rules
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-debugger': 'warn',
			'prefer-const': 'error',
			'no-var': 'error',
		},
	},

	// JavaScript files configuration
	{
		files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				console: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
			},
		},
		rules: {
			'no-console': 'off',
		},
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: path.resolve(import.meta.dirname, './tsconfig.json'),
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
		},

		files: ['**/prisma/**/*.ts', '**/scripts/**/*.ts'],
		rules: {
			'no-console': 'off',
		},
	},
]);
