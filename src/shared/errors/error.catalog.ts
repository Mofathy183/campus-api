/**
 * error.catalog.ts
 * -----------------
 * Single source of truth for every error this API can return —
 * the "typed ErrorCode catalog" the spec's error-handling section
 * (§8) explicitly asks for, same pattern as PyLedger's.
 *
 * Trimmed hard from Beggy's ErrorCode enum (see
 * beggy-reuse-audit.html §2, app-error.util.ts entry) down to only
 * what auth/students/courses/assignments need. No CASL/permission
 * codes, no OAuth codes, no session/refresh-token codes — see
 * beggy-reuse-audit.html §4 "Skip Entirely" for why each of those
 * categories doesn't exist here.
 */
export enum ErrorCode {
	// ---- Validation / transport ----
	INVALID_REQUEST_DATA = 'INVALID_REQUEST_DATA',
	INVALID_FORMAT = 'INVALID_FORMAT',

	// ---- Auth ----
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
	UNAUTHORIZED = 'UNAUTHORIZED',
	TOKEN_MISSING = 'TOKEN_MISSING',
	TOKEN_INVALID = 'TOKEN_INVALID',
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',
	FORBIDDEN = 'FORBIDDEN',

	// ---- Students (also covers the User identity behind a Student) ----
	EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
	STUDENT_NOT_FOUND = 'STUDENT_NOT_FOUND',
	STUDENT_CODE_ALREADY_EXISTS = 'STUDENT_CODE_ALREADY_EXISTS',

	// ---- Courses ----
	COURSE_NOT_FOUND = 'COURSE_NOT_FOUND',
	COURSE_CODE_ALREADY_EXISTS = 'COURSE_CODE_ALREADY_EXISTS',

	// ---- Assignments ----
	ASSIGNMENT_NOT_FOUND = 'ASSIGNMENT_NOT_FOUND',

	// ---- Generic / infra fallbacks (used by prismaErrorMap when a
	//      specific domain code above doesn't apply) ----
	RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
	RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
	INVALID_RELATION_REFERENCE = 'INVALID_RELATION_REFERENCE',
	PASSWORD_HASH_FAILED = 'PASSWORD_HASH_FAILED',
	PASSWORD_VERIFY_FAILED = 'PASSWORD_VERIFY_FAILED',
	DATABASE_ERROR = 'DATABASE_ERROR',
	DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
	ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
	RATE_LIMITED = 'RATE_LIMITED',
	INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

/**
 * Human-readable, client-safe message per code. This is what actually
 * lands in the response body's `message` field per the spec's
 * `{ success: false, message: "Student not found" }` example — keep
 * these short and literal, not internal debugging detail.
 */
export const ErrorMessages: Record<ErrorCode, string> = {
	[ErrorCode.INVALID_REQUEST_DATA]: 'The request data is invalid.',
	[ErrorCode.INVALID_FORMAT]: 'One or more fields are in an invalid format.',

	[ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
	[ErrorCode.UNAUTHORIZED]: 'You must be authenticated to do this.',
	[ErrorCode.TOKEN_MISSING]: 'No authentication token was provided.',
	[ErrorCode.TOKEN_INVALID]: 'Your authentication token is invalid.',
	[ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
	[ErrorCode.FORBIDDEN]: 'You do not have permission to do this.',

	[ErrorCode.EMAIL_ALREADY_EXISTS]:
		'An account with this email already exists.',
	[ErrorCode.STUDENT_NOT_FOUND]: 'Student not found.',
	[ErrorCode.STUDENT_CODE_ALREADY_EXISTS]:
		'That student code is already in use.',

	[ErrorCode.COURSE_NOT_FOUND]: 'Course not found.',
	[ErrorCode.COURSE_CODE_ALREADY_EXISTS]:
		'That course code is already in use.',

	[ErrorCode.ASSIGNMENT_NOT_FOUND]: 'Assignment not found.',

	[ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
	[ErrorCode.RESOURCE_ALREADY_EXISTS]: 'This resource already exists.',
	[ErrorCode.INVALID_RELATION_REFERENCE]:
		'This request references a resource that does not exist.',
	[ErrorCode.PASSWORD_HASH_FAILED]: 'Could not process the password.',
	[ErrorCode.PASSWORD_VERIFY_FAILED]: 'Could not verify the password.',
	[ErrorCode.DATABASE_ERROR]: 'A database error occurred.',
	[ErrorCode.DATABASE_CONNECTION_FAILED]:
		'Could not connect to the database.',
	[ErrorCode.ROUTE_NOT_FOUND]: 'This route does not exist.',
	[ErrorCode.RATE_LIMITED]: 'Too many requests. Please slow down.',
	[ErrorCode.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end.',
};
