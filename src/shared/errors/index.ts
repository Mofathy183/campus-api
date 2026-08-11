/**
 * @module shared/errors
 * @description Public entry point for the error-handling layer:
 * the typed error catalog, the {@link AppError} type and its factory
 * helpers, and the Express error-handling middleware.
 */
export { ErrorCode, ErrorMessages } from './error.catalog';
export { AppError, appErrorMap, STATUS_CODE } from './app.error';
export type { StatusCode, ErrorResponseOptions } from './app.error';
export { errorHandler } from './error.handler';
