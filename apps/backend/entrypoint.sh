#!/bin/sh
set -e

# ── Fix volume permissions ────────────────────
# Bind-mounted volumes (docker-compose) are created as root.
# Ensure the upload directories exist and are owned by the app user.
mkdir -p /app/uploads/petPhotos /app/uploads/petDocs /app/uploads/vetDocs /app/uploads/exports
chown -R coldblood:nodejs /app/uploads

# ── Run database migrations ──────────────────
# Fail hard if migrations cannot be applied — a running server with a
# mismatched schema causes silent data errors, which is worse than a
# container that refuses to start.
#
# If a previous deploy left a failed migration (P3009), auto-resolve it
# and retry. This works because all migration SQL is idempotent.
if ! npx prisma migrate deploy > /tmp/migrate_out 2>&1; then
    if grep -q "P3009" /tmp/migrate_out; then
        FAILED=$(grep -o '`[^`]*`' /tmp/migrate_out | head -1 | tr -d '`')
        echo "[entrypoint] Auto-resolving failed migration: $FAILED"
        npx prisma migrate resolve --rolled-back "$FAILED"
        npx prisma migrate deploy
    else
        cat /tmp/migrate_out >&2
        exit 1
    fi
fi

# ── Start server as non-root user ─────────────
exec node dist/server.js
