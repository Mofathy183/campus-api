# syntax=docker/dockerfile:1
#
# campus-api — multi-stage Dockerfile
#
# RUNTIME STRATEGY — read before changing anything:
# This ships and runs TypeScript directly via `tsx` (the same tool
# `pnpm dev` already uses), instead of `tsc`-compiling to `dist/` and
# running `node dist/server.js`.
#
# Why: tsconfig.json's "paths" (@shared/*, @config/*, @features/*, ...)
# are a TypeScript-only convenience — plain `tsc` does NOT rewrite them
# into relative imports in emitted JS. Combined with `"module": "ESNext"`
# (not "NodeNext") and extensionless relative imports, `node dist/server.js`
# would fail at boot with ERR_MODULE_NOT_FOUND — Node's native ESM loader
# can't resolve either the bare `@shared/...` specifiers or the missing
# `.js` extensions. `tsx` (esbuild-based) resolves both correctly, so
# production runs the exact same code path already proven by `pnpm dev`.
# `pnpm build` (tsc) stays in CI purely as a type-check/compile gate.
#
# Trade-off accepted: the image ships full `node_modules` (tsx +
# typescript included) rather than a pruned `dist/` + prod-only deps.
# Slightly bigger image, zero path-resolution risk. Revisit with
# `tsc-alias` post-submission if a leaner image ever matters.

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=11.21.0

# ---------------------------------------------------------------------------
# deps — installed once; cached independently of source-code changes
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# dev — used by docker-compose for local development (hot reload via
# `tsx watch`, source mounted as a volume in docker-compose.yml)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS dev
WORKDIR /app

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma:generate

EXPOSE 4000
CMD ["pnpm", "dev"]

# ---------------------------------------------------------------------------
# runtime — the image that actually ships (also the default build target,
# since it's last — matters for platforms like Render that build the
# Dockerfile without an explicit `--target`)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma's engines need OpenSSL + glibc compat on Alpine.
RUN apk add --no-cache openssl libc6-compat

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY server.ts ./server.ts

# Generates prisma/generated/prisma/client — must run after the schema
# is in the image, before the app can boot.
RUN pnpm prisma:generate

RUN addgroup -S nodejs && adduser -S campus -G nodejs
USER campus

EXPOSE 4000

CMD ["pnpm", "start:prod"]