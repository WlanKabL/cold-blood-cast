# ── Build stage ──
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Use hoisted node_modules layout (flat like npm → no symlink issues in Docker)
RUN echo "node-linker=hoisted" > .npmrc

# Copy ALL workspace package.json files (pnpm lockfile needs every member)
COPY packages/shared/ ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy backend source
COPY apps/backend/ ./apps/backend/

# Build shared package (TS → JS) so it can be imported at runtime
WORKDIR /app/packages/shared
RUN rm -f tsconfig.tsbuildinfo && pnpm run build

WORKDIR /app/apps/backend

# Generate Prisma client & compile TypeScript
RUN pnpm exec prisma generate
RUN pnpm run build

# ── Production stage ──
FROM node:22-alpine

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# curl for Docker healthcheck probes
RUN apk add --no-cache curl

WORKDIR /app

# Copy compiled output + Prisma schema + legal files
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/legal ./legal
COPY --from=builder /app/apps/backend/package.json ./

# Copy hoisted node_modules (flat layout, Docker-safe)
COPY --from=builder /app/node_modules ./node_modules

# Ensure compiled shared package is available (overwrite symlink with real files)
COPY --from=builder /app/packages/shared/dist ./node_modules/@cold-blood-cast/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@cold-blood-cast/shared/package.json

# Copy entrypoint (handles volume permissions + migrations)
COPY apps/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S coldblood -u 1001 -G nodejs
RUN chown -R coldblood:nodejs /app

EXPOSE 3301

ENTRYPOINT ["/entrypoint.sh"]
