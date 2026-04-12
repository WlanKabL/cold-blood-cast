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
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build shared package (TS → JS) so Vite can resolve it
WORKDIR /app/packages/shared
RUN rm -f tsconfig.tsbuildinfo && pnpm run build

# Copy frontend source
WORKDIR /app/apps/frontend
COPY apps/frontend/ ./

# Build-time env vars (baked into the SPA bundle)
ARG BASE_URL=http://localhost:3000
ARG API_BASE_URL=http://localhost:3001
ARG SITE_URL=http://localhost:3000
ARG APP_VERSION=dev
ENV BASE_URL=$BASE_URL
ENV API_BASE_URL=$API_BASE_URL
ENV SITE_URL=$SITE_URL
ENV APP_VERSION=$APP_VERSION

# Build Nuxt app
RUN pnpm run build

# ── Production stage ──
FROM node:22-alpine

WORKDIR /app

# curl for Docker healthcheck probes
RUN apk add --no-cache curl

# Nuxt .output is self-contained
COPY --from=builder /app/apps/frontend/.output ./.output

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S coldblood -u 1001 -G nodejs
RUN chown -R coldblood:nodejs /app
USER coldblood

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
