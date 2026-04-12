#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Cold Blood Cast — Deploy Script
# Called by deploy.yml. Never run manually.
#
# Required env vars:
#   DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_PATH
#   GHCR_USER, GHCR_TOKEN
#   DOTENV_RAW          — Full .env file content
#   BACKEND_IMAGE       — e.g. ghcr.io/wlankabl/cold-blood-cast/backend
#   FRONTEND_IMAGE      — e.g. ghcr.io/wlankabl/cold-blood-cast/frontend
#   DEPLOY_TAG          — Image tag (e.g. latest, sha-abc1234)
#   COMPOSE_FILE        — Local path to compose file (e.g. docker-compose.production.yml)
# ──────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_TAG="${DEPLOY_TAG:-latest}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"

# ── Validate required env vars ──
MISSING=""
for VAR in DEPLOY_HOST DEPLOY_USER DEPLOY_SSH_KEY DEPLOY_PATH GHCR_USER GHCR_TOKEN DOTENV_RAW BACKEND_IMAGE FRONTEND_IMAGE; do
    if [ -z "${!VAR:-}" ]; then MISSING="$MISSING $VAR"; fi
done
if [ -n "$MISSING" ]; then
    echo "❌ Missing required env vars:$MISSING"
    exit 1
fi

# ── Setup SSH ──
setup_ssh() {
    mkdir -p ~/.ssh
    echo "$DEPLOY_SSH_KEY" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts 2>/dev/null
    cat >> ~/.ssh/config <<CFG
Host deploy-target
  HostName $DEPLOY_HOST
  User $DEPLOY_USER
  IdentityFile ~/.ssh/deploy_key
  StrictHostKeyChecking no
CFG
    echo "✅ SSH configured"
}

# ── Pre-deploy system check ──
pre_check() {
    echo "🔍 Pre-deploy system check..."
    ssh deploy-target bash <<PRECHECK
set -euo pipefail

if [ ! -d "$DEPLOY_PATH" ] || [ ! -f "$DEPLOY_PATH/docker-compose.yml" ]; then
    echo "  ℹ️  First deploy — no previous state found"
    mkdir -p "$DEPLOY_PATH"
    echo "ROLLBACK_POSSIBLE=false" > "$DEPLOY_PATH/.deploy-state"
    exit 0
fi

cd $DEPLOY_PATH

# Count running containers
RUNNING=\$(docker compose ps --status running --format '{{.Name}}' 2>/dev/null | wc -l || echo "0")

if [ "\$RUNNING" -eq 0 ]; then
    echo "  ⚠️  No running containers — rollback not available"
    echo "ROLLBACK_POSSIBLE=false" > .deploy-state
    exit 0
fi

# Capture current image references for rollback
BACKEND_IMG=\$(docker inspect --format='{{.Config.Image}}' \$(docker compose ps -q backend) 2>/dev/null || echo "")
FRONTEND_IMG=\$(docker inspect --format='{{.Config.Image}}' \$(docker compose ps -q frontend) 2>/dev/null || echo "")

cat > .deploy-state <<STATE
ROLLBACK_POSSIBLE=true
PREV_BACKEND_IMAGE=\$BACKEND_IMG
PREV_FRONTEND_IMAGE=\$FRONTEND_IMG
TIMESTAMP=\$(date -u +%Y-%m-%dT%H:%M:%SZ)
STATE

echo "  ✅ System healthy — \$RUNNING containers running"
echo "     Backend:  \$BACKEND_IMG"
echo "     Frontend: \$FRONTEND_IMG"
echo "     Rollback: available"
PRECHECK
}

# ── Transfer files to server ──
transfer_files() {
    local DIR="$DEPLOY_PATH"

    # Verify write permissions
    ssh deploy-target "mkdir -p $DIR && test -w $DIR || { echo '❌ No write permission on $DIR'; exit 1; }"

    # Backup current state for rollback
    ssh deploy-target "cd $DIR && \
        cp docker-compose.yml docker-compose.yml.rollback 2>/dev/null || true && \
        cp .env .env.rollback 2>/dev/null || true"
    echo "✅ Rollback state saved"

    # Transfer compose file → always deployed as docker-compose.yml
    cat "$COMPOSE_FILE" | ssh deploy-target "cat > $DIR/docker-compose.yml"
    echo "✅ Transferred $COMPOSE_FILE → docker-compose.yml"

    # Remove legacy compose file from previous deploy format
    ssh deploy-target "rm -f $DIR/docker-compose.prod.yml" 2>/dev/null || true

    # Write .env via base64 round-trip (safe binary transport)
    printf '%s' "$DOTENV_RAW" | base64 -w 0 | ssh deploy-target "base64 -d > $DIR/.env"

    # Append deploy-injected image tags
    ssh deploy-target "printf '\n# ── Deploy-injected (managed by CI/CD — do not edit) ──\nBACKEND_IMAGE=${BACKEND_IMAGE}:${DEPLOY_TAG}\nFRONTEND_IMAGE=${FRONTEND_IMAGE}:${DEPLOY_TAG}\n' >> $DIR/.env"
    echo "✅ .env written (tag: $DEPLOY_TAG)"
}

# ── Deploy services ──
deploy_services() {
    ssh deploy-target bash <<DEPLOY
set -euo pipefail
cd $DEPLOY_PATH

# ── Ensure data directories exist ──
DATA_DIR=\$(grep -oP '^DATA_DIR=\K.*' .env 2>/dev/null || echo "./data")
mkdir -p "\$DATA_DIR/postgres"
mkdir -p "./uploads"

# ── GHCR login ──
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

# ── Pull new images ──
docker compose pull backend frontend

# ── Infrastructure first (postgres) ──
docker compose up -d postgres
echo "⏳ Waiting for database..."
sleep 10

# ── Start/restart all services ──
docker compose up -d

# ── Verify services via HTTP health checks ──
echo "⏳ Waiting 15s for services to start..."
sleep 15

RETRIES=12
INTERVAL=10
for i in \$(seq 1 \$RETRIES); do
    echo "🔍 Health check attempt \$i/\$RETRIES..."

    BACKEND_HEALTH=\$(curl -sf http://localhost:3001/api/health 2>&1 || echo "FAIL")
    FRONTEND_STATUS=\$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>&1 || echo "000")

    BACKEND_OK=false
    FRONTEND_OK=false

    if echo "\$BACKEND_HEALTH" | grep -q '"status":"ok"'; then
        echo "  ✅ Backend: healthy (DB connected)"
        BACKEND_OK=true
    else
        echo "  ⚠️  Backend: not ready (\$BACKEND_HEALTH)"
    fi

    if [ "\$FRONTEND_STATUS" = "200" ]; then
        echo "  ✅ Frontend: responding (HTTP 200)"
        FRONTEND_OK=true
    else
        echo "  ⚠️  Frontend: not ready (HTTP \$FRONTEND_STATUS)"
    fi

    if [ "\$BACKEND_OK" = "true" ] && [ "\$FRONTEND_OK" = "true" ]; then
        echo "✅ All services verified"
        break
    fi

    if [ "\$i" -lt "\$RETRIES" ]; then
        echo "  ... retrying in \${INTERVAL}s"
        sleep \$INTERVAL
    else
        echo "❌ Health check failed after \$RETRIES attempts — triggering auto-rollback"
        docker compose ps
        echo "--- Backend logs ---"
        docker compose logs --tail=50 backend
        echo "--- Frontend logs ---"
        docker compose logs --tail=50 frontend
        echo "--- Docker healthcheck details ---"
        docker inspect --format='{{json .State.Health}}' cbc-backend 2>/dev/null | head -c 500 || true
        docker inspect --format='{{json .State.Health}}' cbc-frontend 2>/dev/null | head -c 500 || true
        exit 1
    fi
done

echo "🎉 Deployment verified — all services healthy"

# ── Seed (idempotent — skips existing data) ──
echo "Running seed..."
docker compose exec -T backend node dist/config/seed.js 2>&1 || echo "WARN: seed.js returned non-zero exit code"
echo "Seed complete"

docker image prune -f
DEPLOY
}

# ── Rollback to previous state ──
rollback_services() {
    echo "🔄 Starting rollback..."
    ssh deploy-target bash <<ROLLBACK
set -euo pipefail
cd $DEPLOY_PATH

if [ ! -f docker-compose.yml.rollback ] && [ ! -f .env.rollback ]; then
    echo "❌ No rollback state found — nothing to roll back to"
    exit 1
fi

if [ -f docker-compose.yml.rollback ]; then
    cp docker-compose.yml.rollback docker-compose.yml
    echo "  ✅ Restored docker-compose.yml"
fi
if [ -f .env.rollback ]; then
    cp .env.rollback .env
    echo "  ✅ Restored .env"
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

if [ -f .deploy-state ]; then
    PREV_BE=\$(grep -oP 'PREV_BACKEND_IMAGE=\K.*' .deploy-state || echo "")
    PREV_FE=\$(grep -oP 'PREV_FRONTEND_IMAGE=\K.*' .deploy-state || echo "")
    if [ -n "\$PREV_BE" ]; then
        echo "  Pulling previous backend: \$PREV_BE"
        docker pull "\$PREV_BE" 2>/dev/null || true
    fi
    if [ -n "\$PREV_FE" ]; then
        echo "  Pulling previous frontend: \$PREV_FE"
        docker pull "\$PREV_FE" 2>/dev/null || true
    fi
fi

docker compose pull backend frontend 2>/dev/null || true
docker compose up -d
echo "⏳ Waiting 15s for services to start..."
sleep 15

BACKEND_HEALTH=\$(curl -sf http://localhost:3001/api/health || echo "FAIL")
FRONTEND_STATUS=\$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")

if echo "\$BACKEND_HEALTH" | grep -q '"status":"ok"' && [ "\$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Rollback successful — all services healthy"
else
    echo "❌ Rollback completed but services not fully healthy"
    echo "   Backend: \$BACKEND_HEALTH"
    echo "   Frontend: HTTP \$FRONTEND_STATUS"
    echo "   Check manually: ssh $DEPLOY_USER@$DEPLOY_HOST 'cd $DEPLOY_PATH && docker compose logs'"
    exit 1
fi

echo "🎉 Rollback complete — running on previous version"
ROLLBACK
}

# ── Auto-rollback wrapper ──
deploy_with_rollback() {
    pre_check
    transfer_files
    if deploy_services; then
        echo ""
        echo "════════════════════════════════════════"
        echo "  ✅ Deploy successful (tag: $DEPLOY_TAG)"
        echo "════════════════════════════════════════"
    else
        echo ""
        echo "════════════════════════════════════════"
        echo "  ❌ Deploy failed — auto-rolling back"
        echo "════════════════════════════════════════"
        echo ""
        ROLLBACK_POSSIBLE=$(ssh deploy-target "grep -oP 'ROLLBACK_POSSIBLE=\K.*' $DEPLOY_PATH/.deploy-state 2>/dev/null" || echo "false")
        if [ "$ROLLBACK_POSSIBLE" = "true" ]; then
            rollback_services
        else
            echo "⚠️  No previous state to roll back to (first deploy) — manual intervention required"
        fi
        exit 1
    fi
}

# ── Main ──
setup_ssh
deploy_with_rollback
