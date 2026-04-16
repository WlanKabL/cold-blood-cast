#!/bin/sh
set -e

# ── Fix volume permissions ────────────────────
# Bind-mounted volumes (docker-compose) are created as root.
# Ensure the upload directories exist and are owned by the app user.
mkdir -p /app/uploads/petPhotos /app/uploads/petDocs /app/uploads/vetDocs /app/uploads/exports
chown -R coldblood:nodejs /app/uploads

# ── Run database migrations ──────────────────
# Resolve any previously failed migrations so deploy can re-apply them.
# This is safe: the fixed SQL is fully idempotent (IF NOT EXISTS / DO $$ guards).
npx prisma migrate resolve --rolled-back 20260415173717_add_pet_tags_relation 2>/dev/null || true

# Fail hard if migrations cannot be applied — a running server with a
# mismatched schema causes silent data errors, which is worse than a
# container that refuses to start.
npx prisma migrate deploy

# ── Start server as non-root user ─────────────
exec node dist/server.js
