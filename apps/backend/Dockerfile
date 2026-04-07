FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/ packages/shared/
COPY apps/backend/ apps/backend/
RUN pnpm --filter @cold-blood-cast/shared build
RUN pnpm --filter @cold-blood-cast/backend build

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/
COPY --from=build /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/package.json ./

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/index.js"]
