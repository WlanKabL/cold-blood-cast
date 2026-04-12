FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG BASE_URL=http://localhost:3000
ARG API_BASE_URL=http://localhost:3001
ARG SITE_URL=http://localhost:3000
ARG APP_VERSION=0.0.0
ENV BASE_URL=${BASE_URL}
ENV API_BASE_URL=${API_BASE_URL}
ENV SITE_URL=${SITE_URL}
ENV APP_VERSION=${APP_VERSION}
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/ packages/shared/
COPY apps/frontend/ apps/frontend/
RUN pnpm --filter @cold-blood-cast/shared build
RUN pnpm --filter @cold-blood-cast/frontend build

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/apps/frontend/.output ./apps/frontend/.output
WORKDIR /app/apps/frontend
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
