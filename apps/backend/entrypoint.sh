#!/bin/sh
set -e

# ── Ensure upload directories exist ──────────
mkdir -p /app/uploads/petPhotos /app/uploads/petDocs /app/uploads/vetDocs /app/uploads/exports

# ── Run database migrations ──────────────────
# Fail hard if migrations cannot be applied — a running server with a
# mismatched schema causes silent data errors, which is worse than a
# container that refuses to start.
npx prisma migrate deploy

# ── Start server ─────────────────────────────
exec node dist/server.js
