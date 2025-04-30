#!/usr/bin/env bash
#
# deploy.sh — Download a specific release (or tag/branch) from GitHub
#             and start/restart Frontend & Backend with PM2.
#
# Usage:
#   ./deploy.sh [<ref>]
#     ref = release tag (e.g. v1.2.3), branch name, or commit SHA
#     default = latest release tag
#
# Requires: bash, curl or wget, tar (for .tar.gz), unrar or 7z (for .rar), pm2

REPO_OWNER="WlanKabL"
REPO_NAME="cold-blood-cast"
ASSET_NAME="build.rar"
DEFAULT_REF="latest"

REF="${1:-$DEFAULT_REF}"
# Use a fixed deploy directory inside the project
DEPLOY_DIR="~/cold-blood-cast-prod/deploy/releases/${REF}"
mkdir -p "$DEPLOY_DIR"

echo "📦 Deploying ref: $REF into $DEPLOY_DIR"

# helper to fetch JSON and parse with grep
fetch_json() {
  if command -v curl &>/dev/null; then
    curl -s "$1"
  elif command -v wget &>/dev/null; then
    wget -qO- "$1"
  else
    echo "❌ Please install curl or wget" >&2
    exit 1
  fi
}

# resolve "latest" → actual tag
if [[ "$REF" == "$DEFAULT_REF" ]]; then
  TAG="$(fetch_json https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest \
    | grep -Po '"tag_name":\s*"\K[^"]+' )"
  if [[ -z "$TAG" ]]; then
    echo "❌ Could not determine latest release tag" >&2
    exit 1
  fi
  echo "→ latest release is $TAG"
  REF="$TAG"
  DEPLOY_DIR="./deploy/releases/${REF}"
  mkdir -p "$DEPLOY_DIR"
fi

# 1) Try to download build.rar asset
echo "🔍 Checking for asset '${ASSET_NAME}' in release '$REF'..."
DOWNLOAD_URL="$(fetch_json https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/tags/$REF \
  | grep '"browser_download_url"' \
  | grep "$ASSET_NAME" \
  | head -n1 \
  | cut -d '"' -f4 || true)"

if [[ -n "$DOWNLOAD_URL" ]]; then
  echo "✅ Found asset: $DOWNLOAD_URL"
  echo "⬇️ Downloading ${ASSET_NAME}..."
  if command -v curl &>/dev/null; then
    curl -L "$DOWNLOAD_URL" -o "$DEPLOY_DIR/$ASSET_NAME"
  else
    wget -O "$DEPLOY_DIR/$ASSET_NAME" "$DOWNLOAD_URL"
  fi

  echo "📂 Extracting ${ASSET_NAME}..."
  if command -v unrar &>/dev/null; then
    unrar x -o+ "$DEPLOY_DIR/$ASSET_NAME" "$DEPLOY_DIR"
  elif command -v 7z &>/dev/null; then
    7z x "$DEPLOY_DIR/$ASSET_NAME" -o"$DEPLOY_DIR"
  else
    echo "❌ Please install 'unrar' or '7z' to extract RAR files." >&2
    exit 1
  fi
else
  # 2) Fallback: download Git archive
  ARCHIVE_URL="https://github.com/$REPO_OWNER/$REPO_NAME/archive/$REF.tar.gz"
  echo "⚠️ Asset not found, falling back to archive: $ARCHIVE_URL"
  echo "⬇️ Downloading archive..."
  if command -v curl &>/dev/null; then
    curl -L "$ARCHIVE_URL" -o "$DEPLOY_DIR/archive.tar.gz"
  else
    wget -O "$DEPLOY_DIR/archive.tar.gz" "$ARCHIVE_URL"
  fi

  echo "📂 Extracting archive..."
  tar -xzf "$DEPLOY_DIR/archive.tar.gz" -C "$DEPLOY_DIR"
fi

# determine base dir
if [[ -d "$DEPLOY_DIR/$REPO_NAME-$REF" ]]; then
  BASE="$DEPLOY_DIR/$REPO_NAME-$REF"
elif compgen -G "$DEPLOY_DIR/$REPO_NAME*" >/dev/null; then
  BASE="$DEPLOY_DIR/$(ls "$DEPLOY_DIR" | grep "^$REPO_NAME")"
else
  BASE="$DEPLOY_DIR"
fi

FRONTEND_PATH="$BASE/frontend/.output/server/index.mjs"
BACKEND_PATH="$BASE/snake-link-raspberry/dist/index.js"

echo "🚀 Starting/updating with PM2..."

# Frontend
if pm2 list | grep -q "frontend"; then
  pm2 restart frontend --update-env
else
  pm2 start "$FRONTEND_PATH" --name frontend --update-env
fi

# Backend
if pm2 list | grep -q "snake-link-raspberry"; then
  pm2 restart snake-link-raspberry --update-env
else
  pm2 start "$BACKEND_PATH" --name snake-link-raspberry --update-env
fi

pm2 save
echo "✅ Deployment of '$REF' completed!"
