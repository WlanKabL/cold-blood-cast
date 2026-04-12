# Cold Blood Cast — GHCR & CD Setup Guide

> Step-by-step guide to enable the automated deployment pipeline.

---

## 1. GHCR (GitHub Container Registry) — Nothing to Create

GHCR is included with your GitHub account for free. Private repos get 500 MB storage + 1 GB egress/month on the free tier, unlimited on Pro/Team.

Images are pushed automatically by GitHub Actions using `GITHUB_TOKEN` — no extra registry account needed.

---

## 2. Repository Settings — Enable Package Permissions

1. Go to **GitHub → WlanKabL/cold-blood-cast → Settings → Actions → General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests** (optional)
5. **Save**

This allows `GITHUB_TOKEN` to push images to `ghcr.io/wlankabl/cold-blood-cast/*`.

---

## 3. Create a GitHub Environment

1. Go to **Settings → Environments → New environment**
2. Name: `production`
3. (Optional) Add **Required reviewers** for manual approval before deploys
4. (Optional) Add **Wait timer** (e.g. 5 min) for safety
5. **Save protection rules**

---

## 4. Add Secrets

### Repository Secrets (Settings → Secrets and variables → Actions → New repository secret)

| Secret       | Value                                        | Example    |
| ------------ | -------------------------------------------- | ---------- |
| `GHCR_USER`  | GitHub username (for docker login on server) | `WlanKabL` |
| `GHCR_TOKEN` | GitHub PAT with `write:packages` scope       | `ghp_xxx…` |

### Environment Secrets (Settings → Environments → production → Add environment secret)

#### Infrastructure

| Secret           | Value                                      | Example                        |
| ---------------- | ------------------------------------------ | ------------------------------ |
| `DEPLOY_HOST`    | Server IP or hostname                      | `123.45.67.89`                 |
| `DEPLOY_USER`    | SSH user on the server                     | `deploy`                       |
| `DEPLOY_SSH_KEY` | Full private SSH key (ed25519 recommended) | `-----BEGIN OPENSSH PRIVATE…`  |
| `DEPLOY_PATH`    | Absolute path to the project on the server | `/opt/cold-blood-cast`         |

#### Frontend Build Args (baked into SPA at Docker build time)

| Secret         | Value                                | Example                              |
| -------------- | ------------------------------------ | ------------------------------------ |
| `BASE_URL`     | Public frontend URL                  | `https://cold-blood-cast.app`        |
| `API_BASE_URL` | Public backend API URL               | `https://api.cold-blood-cast.app`    |
| `SITE_URL`     | Same as BASE_URL (used for SEO/meta) | `https://cold-blood-cast.app`        |

#### Environment .env (single secret — entire .env file)

| Secret   | Value                                             |
| -------- | ------------------------------------------------- |
| `DOTENV` | Complete `.env` file content for this environment |

**How to create `DOTENV`:**

1. Copy `.env.production.example` from the repo root
2. Fill in all required values (DB_PASSWORD, JWT secrets, HASH_PEPPER, etc.)
3. Uncomment optional sections you need (SMTP, Telegram, Stripe, etc.)
4. Paste the entire file content as the `DOTENV` environment secret value

The deploy workflow writes this to `.env` on the server and appends `BACKEND_IMAGE` / `FRONTEND_IMAGE` automatically.

---

## 5. Server-Side Setup

### 5a. Create a deploy user

```bash
adduser --disabled-password deploy
usermod -aG docker deploy
```

### 5b. Create the deploy directory

```bash
sudo mkdir -p /opt/cold-blood-cast
sudo chown deploy:deploy /opt/cold-blood-cast

# Data + upload directories
sudo mkdir -p /opt/cold-blood-cast/data/postgres
sudo mkdir -p /opt/cold-blood-cast/uploads
sudo chown -R deploy:deploy /opt/cold-blood-cast
```

### 5c. Add the SSH key

```bash
# On LOCAL machine — generate a deploy key
ssh-keygen -t ed25519 -C "cbc-deploy" -f ~/.ssh/cbc-deploy -N ""

# Copy public key to server
ssh-copy-id -i ~/.ssh/cbc-deploy.pub deploy@YOUR_SERVER_IP

# Copy private key → paste as DEPLOY_SSH_KEY secret
cat ~/.ssh/cbc-deploy
```

### 5d. Initial deploy (first time only)

```bash
ssh deploy@YOUR_SERVER_IP
cd /opt/cold-blood-cast

# Log in to GHCR
echo "YOUR_PAT_TOKEN" | docker login ghcr.io -u WlanKabL --password-stdin
```

Then trigger the Deploy workflow from GitHub Actions.

---

## 6. How It Works

```
Manual trigger: workflow_dispatch
    │
    ▼
build-and-push job
    ├─ Build backend + frontend Docker images
    ├─ Push to ghcr.io/wlankabl/cold-blood-cast/backend:latest
    └─ Push to ghcr.io/wlankabl/cold-blood-cast/frontend:latest
    │
    ▼
deploy job (runs .github/scripts/deploy.sh)
    ├─ Setup SSH connection
    ├─ Backup current state (compose + .env → .rollback)
    ├─ Transfer docker-compose.production.yml → docker-compose.yml
    ├─ Write .env (from DOTENV secret + image tags)
    ├─ docker login ghcr.io
    ├─ docker compose pull backend frontend
    ├─ docker compose up -d postgres (wait for healthy)
    ├─ docker compose up -d (all services)
    ├─ Backend entrypoint runs: prisma migrate deploy → node dist/server.js
    ├─ HTTP health checks (12 retries, 10s gaps)
    ├─ docker image prune -f
    │
    ▼ (on failure)
    └─ Auto-rollback: restore .rollback files → restart previous version
```

**Rollback:** Re-trigger Deploy workflow with an older `image_tag` (e.g. a SHA tag from a previous deploy).

---

## 7. Verify Setup

1. Go to **Actions** tab → **Deploy** workflow → **Run workflow**
2. Select branch `main`, leave `image_tag` empty (builds fresh)
3. Check the logs for errors
4. Visit your domain to confirm

---

## Troubleshooting

| Issue                              | Fix                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `denied: installation not allowed` | Check step 2 — workflow permissions must be read+write                       |
| `connection refused` on deploy     | Check `DEPLOY_HOST`, `DEPLOY_USER`, and `DEPLOY_SSH_KEY` secrets             |
| `Permission denied` on file write  | Run `sudo chown -R deploy:deploy /opt/cold-blood-cast` on server             |
| Images pull fails on server        | Run `docker login ghcr.io` manually, check PAT has `read:packages`           |
| Backend crashes on start           | Check `DOTENV` has all required vars, check `docker logs cbc-backend`        |
| Frontend shows old version         | Hard refresh (Ctrl+Shift+R), check if frontend container restarted           |
| Migration fails                    | Check `docker logs cbc-backend` — entrypoint runs `prisma migrate deploy`    |
