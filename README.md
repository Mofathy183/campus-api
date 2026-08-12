# campus-api

## Overview

`campus-api` is a REST API for a student dashboard: authentication, students, courses, and assignments on Node.js, Express, TypeScript, PostgreSQL, Prisma, and Zod. It uses stateless bearer-token auth, a shared response envelope, and a single error-handling path so the API is easy to exercise from curl or Postman. Live deployment: [https://campus-api-production-f792.up.railway.app/](https://campus-api-production-f792.up.railway.app/)

## Installation

```bash
git clone https://github.com/Mofathy183/campus-api.git
cd campus-api
pnpm install
cp .env.example .env
pnpm prisma:generate
```

Fill in `.env` before starting the app. `pnpm prisma:generate` is required because the Prisma client is generated into `prisma/generated/prisma`.

## Running Locally

### Docker Compose path

This is the intended local path. It starts PostgreSQL and the API together with hot reload.

```bash
docker compose up --build
```

The API will be available on `http://localhost:4000` and the database on `localhost:5432`.

### Bare-metal path

Use this if you already have PostgreSQL running locally.

```bash
pnpm dev
```

Before that, point `DATABASE_URL` at your local database, run `pnpm prisma:generate`, and apply the schema with Prisma migrations.

## Environment Variables

The Zod schema in `src/config/env.config.ts` is the source of truth.

| Variable                      | Purpose                                                                              | Required / default               |
| ----------------------------- | ------------------------------------------------------------------------------------ | -------------------------------- |
| `NODE_ENV`                    | Environment switch used for logging, test behavior, and production/runtime branching | Default: `development`           |
| `PORT`                        | HTTP port for `server.ts`                                                            | Default: `4000`                  |
| `DATABASE_URL`                | PostgreSQL connection string used by Prisma                                          | Required                         |
| `JWT_ACCESS_TOKEN_SECRET`     | Signing secret for bearer access tokens                                              | Required, at least 32 characters |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | JWT lifetime passed to `jsonwebtoken`                                                | Default: `1d`                    |
| `JWT_ISSUER`                  | JWT issuer claim                                                                     | Default: `campus-api`            |
| `JWT_AUDIENCE`                | JWT audience claim                                                                   | Default: `campus-api-client`     |
| `BCRYPT_SALT_ROUNDS`          | Hash cost used when creating student passwords                                       | Default: `12`                    |
| `CORS_ORIGIN`                 | Allowed origin list for CORS, comma-separated or `*`                                 | Default: `*`                     |
| `RATE_LIMIT_WINDOW_MS`        | Fixed-window rate limit window                                                       | Default: `900000`                |
| `RATE_LIMIT_MAX`              | Request cap per rate-limit window                                                    | Default: `100`                   |
| `LOG_LEVEL`                   | Pino log level                                                                       | Default: `info`                  |

## API Examples

All success responses use the same envelope: `{ success, message, data }`, with `meta` added on paginated list responses. Errors use `{ success: false, message, code, error? }`.

Base URL used below: `https://campus-api-production-f792.up.railway.app`

Set a token after login:

```bash
ACCESS_TOKEN="<paste accessToken from /login>"
```

### Auth

#### `POST /login`

Seeded login:

```bash
curl -X POST "https://campus-api-production-f792.up.railway.app/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@campus.test",
    "password": "Password123!"
  }'
```

Response:

```json
{
	"success": true,
	"message": "Login successful",
	"data": {
		"accessToken": "eyJhbGciOi...",
		"user": {
			"id": "<user-id>",
			"email": "jane.doe@campus.test",
			"role": "STUDENT",
			"student": {
				"id": "<student-id>",
				"firstName": "Jane",
				"lastName": "Doe",
				"studentCode": "STU-001"
			}
		}
	}
}
```

### Students

Students routes are protected. Include `Authorization: Bearer $ACCESS_TOKEN` on every request below.

#### `GET /students`

```bash
curl "https://campus-api-production-f792.up.railway.app/students?page=1&limit=20&search=STU-001" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:

```json
{
	"success": true,
	"message": "Students fetched",
	"data": [
		{
			"id": "<student-id>",
			"firstName": "Jane",
			"lastName": "Doe",
			"studentCode": "STU-001",
			"email": "jane.doe@campus.test",
			"role": "STUDENT"
		}
	],
	"meta": {
		"page": 1,
		"limit": 20,
		"count": 1,
		"hasNextPage": false,
		"hasPreviousPage": false
	}
}
```

#### `GET /students/:id`

```bash
curl "https://campus-api-production-f792.up.railway.app/students/<student-id>" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:

```json
{
	"success": true,
	"message": "Student fetched",
	"data": {
		"id": "<student-id>",
		"firstName": "Jane",
		"lastName": "Doe",
		"studentCode": "STU-001",
		"email": "jane.doe@campus.test",
		"role": "STUDENT"
	}
}
```

#### `POST /students`

```bash
curl -X POST "https://campus-api-production-f792.up.railway.app/students" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sam.wilson@campus.test",
    "password": "Password123!",
    "firstName": "Sam",
    "lastName": "Wilson",
    "studentCode": "STU-002"
  }'
```

Response:

```json
{
	"success": true,
	"message": "Student created",
	"data": {
		"id": "<student-id>",
		"firstName": "Sam",
		"lastName": "Wilson",
		"studentCode": "STU-002",
		"email": "sam.wilson@campus.test",
		"role": "STUDENT"
	}
}
```

#### `PUT /students/:id`

```bash
curl -X PUT "https://campus-api-production-f792.up.railway.app/students/<student-id>" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastName": "Doe-Smith"
  }'
```

Response:

```json
{
	"success": true,
	"message": "Student updated",
	"data": {
		"id": "<student-id>",
		"firstName": "Jane",
		"lastName": "Doe-Smith",
		"studentCode": "STU-001",
		"email": "jane.doe@campus.test",
		"role": "STUDENT"
	}
}
```

#### `DELETE /students/:id`

```bash
curl -i -X DELETE "https://campus-api-production-f792.up.railway.app/students/<student-id>" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response: `204 No Content` with no JSON body.

### Courses

Courses routes are protected. Include `Authorization: Bearer $ACCESS_TOKEN` on every request below.

#### `GET /courses`

```bash
curl "https://campus-api-production-f792.up.railway.app/courses?page=1&limit=20&search=Data&code=CS201" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:

```json
{
	"success": true,
	"message": "Courses fetched",
	"data": [
		{
			"id": "<course-id>",
			"code": "CS201",
			"title": "Data Structures",
			"description": "Intro to DS & algorithms",
			"createdAt": "2026-08-11T...",
			"updatedAt": "2026-08-11T..."
		}
	],
	"meta": {
		"page": 1,
		"limit": 20,
		"count": 1,
		"hasNextPage": false,
		"hasPreviousPage": false
	}
}
```

#### `GET /courses/:id`

```bash
curl "https://campus-api-production-f792.up.railway.app/courses/<course-id>" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:

```json
{
	"success": true,
	"message": "Course fetched",
	"data": {
		"id": "<course-id>",
		"code": "CS201",
		"title": "Data Structures",
		"description": "Intro to DS & algorithms",
		"createdAt": "2026-08-11T...",
		"updatedAt": "2026-08-11T..."
	}
}
```

#### `POST /courses`

```bash
curl -X POST "https://campus-api-production-f792.up.railway.app/courses" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CS202",
    "title": "Algorithms",
    "description": "Search, sorting, and graph fundamentals"
  }'
```

Response:

```json
{
	"success": true,
	"message": "Course created",
	"data": {
		"id": "<course-id>",
		"code": "CS202",
		"title": "Algorithms",
		"description": "Search, sorting, and graph fundamentals",
		"createdAt": "2026-08-12T...",
		"updatedAt": "2026-08-12T..."
	}
}
```

### Assignments

Assignments routes are protected. Include `Authorization: Bearer $ACCESS_TOKEN` on every request below.

The seeded database includes one pending assignment linked to `STU-001`. Use the student UUID returned by `GET /students?search=STU-001` for assignment requests that need `studentId`.

#### `GET /assignments`

```bash
curl "https://campus-api-production-f792.up.railway.app/assignments?page=1&limit=20&studentId=<student-id>&status=PENDING&search=Assignment" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Response:

```json
{
	"success": true,
	"message": "Assignments fetched",
	"data": [
		{
			"id": "<assignment-id>",
			"title": "Assignment 1",
			"description": null,
			"studentId": "<student-id>",
			"status": "PENDING",
			"dueAt": null,
			"createdAt": "2026-08-11T...",
			"updatedAt": "2026-08-11T..."
		}
	],
	"meta": {
		"page": 1,
		"limit": 20,
		"count": 1,
		"hasNextPage": false,
		"hasPreviousPage": false
	}
}
```

#### `POST /assignments`

```bash
curl -X POST "https://campus-api-production-f792.up.railway.app/assignments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Assignment 2",
    "description": "Practice problems for chapter 2",
    "studentId": "<student-id>",
    "dueAt": "2026-08-20T17:00:00.000Z"
  }'
```

Response:

```json
{
	"success": true,
	"message": "Assignment created",
	"data": {
		"id": "<assignment-id>",
		"title": "Assignment 2",
		"description": "Practice problems for chapter 2",
		"studentId": "<student-id>",
		"status": "PENDING",
		"dueAt": "2026-08-20T17:00:00.000Z",
		"createdAt": "2026-08-12T...",
		"updatedAt": "2026-08-12T..."
	}
}
```

#### `PATCH /assignments/:id`

```bash
curl -X PATCH "https://campus-api-production-f792.up.railway.app/assignments/<assignment-id>" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUBMITTED"
  }'
```

Response:

```json
{
	"success": true,
	"message": "Assignment status updated",
	"data": {
		"id": "<assignment-id>",
		"title": "Assignment 1",
		"description": null,
		"studentId": "<student-id>",
		"status": "SUBMITTED",
		"dueAt": null,
		"createdAt": "2026-08-11T...",
		"updatedAt": "2026-08-12T..."
	}
}
```

## Decisions

- I chose stateless bearer JWTs instead of cookie sessions so the API stays easy to test with curl/Postman and avoids a CSRF surface that would only exist with browser-managed cookies.
- I centralized error handling around a typed `ErrorCode` catalog and one Express error middleware so every intentional failure serializes into the same response shape.
- I split shared helpers into `BaseController` and `BaseService` so logging, auth assertions, null-checks, and response helpers live in one place instead of being repeated in every feature module.
- I kept the naming convention as `<domain>.<type>.ts` so each module reads the same way across routes, controllers, services, schemas, tests, and shared utilities.
- I separated `app.ts` from `server.ts` so the Express app can be imported directly by tests without binding a socket, while `server.ts` remains the only process entry point.

## Assumptions

- There is no email-verification flow, password-reset flow, or refresh-token rotation.
- Authentication is a single 1-day bearer access token, and there is no session cookie or browser-only login state.
- `POST /students` is the account-registration path as well as the student-creation path; there is no separate public registration endpoint.
- Students, courses, and assignments are protected by authentication, but they are not scoped to the requesting user. Any authenticated user can list and read them.
- There is no deeper role-based authorization layer beyond accepting a verified token and attaching `req.user`.
- Filtering is present only where the schemas define it: students support `search`, courses support `search` and `code`, assignments support `status`, `studentId`, and `search`.

## Improvements at Scale

If this reached 50,000 students, I would prioritize these three changes:

1. Cursor-based pagination in `src/shared/utils/pagination.util.ts` and the three list endpoints in `src/features/students`, `src/features/courses`, and `src/features/assignments`. Offset pagination gets slower and less stable as tables grow; cursors would make deep pages cheaper and reduce the chance of skipping or repeating rows during concurrent writes. The trade-off is a more complex client contract, because `page`/`limit` would become `cursor`/`take` and the API would no longer support arbitrary page jumps as cleanly.
2. A Redis-backed cache and rate-limit layer in `src/shared/middleware/app.middleware.ts`, with cache reads/writes around the hot Prisma reads in the feature services. That would reduce repeated database work for list and detail endpoints, especially if many students are reading the same course and assignment data. The trade-off is cache invalidation complexity, plus one more dependency to operate and monitor.
3. A short-lived access token plus refresh-token flow in `src/shared/crypto/jwt.util.ts`, `src/features/auth/auth.service.ts`, `src/config/env.config.ts`, and a new token persistence layer in Prisma. A 1-day bearer token is fine for a small internal API, but at larger scale it increases the blast radius of token theft and makes revocation weaker. The trade-off is more moving parts: token storage, rotation logic, revocation paths, and more edge cases in login/logout.

## Bonus Features Implemented

- Pagination: all list endpoints accept `page` and `limit`, and the response includes `meta` with counts and next/previous flags.
- Real JWT: login issues a signed bearer access token with a 1-day expiry, and protected routes verify it on every request.
- Docker: the repo ships a multi-stage Dockerfile plus `docker-compose.yml` for local PostgreSQL and hot-reload development.

## Seeded Test Data

The Railway deployment is seeded, so a reviewer can try the API immediately without creating a fresh account first.

| Type          | Seeded value                               | Notes                                                           |
| ------------- | ------------------------------------------ | --------------------------------------------------------------- |
| Admin login   | `admin@campus.test` / `Password123!`       | Use this if you want to test with an admin account              |
| Student login | `jane.doe@campus.test` / `Password123!`    | This is the easiest account for the protected endpoints         |
| Course        | `CS201` - `Data Structures`                | Stable course code for list/filter examples                     |
| Student       | `STU-001` - `Jane Doe`                     | Stable student code; the UUID will differ if the DB is reseeded |
| Assignment    | One pending assignment linked to `STU-001` | Useful for `GET /assignments` and `PATCH /assignments/:id`      |

## Live Deployment

Live API: [https://campus-api-production-f792.up.railway.app/](https://campus-api-production-f792.up.railway.app/)

It uses stateless bearer-token auth, so you can test it directly with curl or Postman without any browser session setup. Pushes to `main` run CI first, and Railway only deploys after CI passes because wait-for-CI is enabled.
