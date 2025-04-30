#!/usr/bin/env bash
#
# build.sh - Download a specific build from GitHub and restart with pm2
#
# Usage:
#   ./build.sh [ref]
#     ref = release tag (e.g. v1.2.3), branch name, or commit SHA
#     default = latest release tag
#
# Requires: curl, tar (or unzip), pm2

set -euo pipefail

REPO_OWNER="WlanKabL"
REPO_NAME="cold-blood-cast"
ASSET_NAME="build.rar"
TMPDIR=$(mktemp -d)

cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

REF="${1:-latest}"

echo "📦 Installing ref: $REF"

if [[ "$REF" == "latest" ]]; then
  # Fetch latest release tag name
  TAG=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest" \
    | grep -Po '"tag_name":\s*"\K[^"]+')
  echo "→ latest release is $TAG"
  REF="$TAG"
fi

# Try to fetch a release asset for this tag
echo "🔍 Checking for release asset '$ASSET_NAME' under tag '$REF'..."
DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/tags/$REF" \
  | grep '"browser_download_url"' \
  | grep "$ASSET_NAME" \
  | head -n1 \
  | cut -d '"' -f4 || true)

if [[ -n "$DOWNLOAD_URL" ]]; then
  echo "✅ Found release asset: $DOWNLOAD_URL"
  echo "⬇️ Downloading $ASSET_NAME..."
  curl -L "$DOWNLOAD_URL" -o "$TMPDIR/$ASSET_NAME"
  
  echo "📂 Extracting $ASSET_NAME..."
  if command -v unrar &>/dev/null; then
    unrar x -o+ "$TMPDIR/$ASSET_NAME" "$TMPDIR"
  elif command -v 7z &>/dev/null; then
    7z x "$TMPDIR/$ASSET_NAME" -o"$TMPDIR"
  else
    echo "❌ Please install 'unrar' or '7z' to extract RAR files." >&2
    exit 1
  fi
else
  echo "⚠️ No $ASSET_NAME asset found for release '$REF'. Falling back to archive download..."
  ARCHIVE_URL="https://github.com/$REPO_OWNER/$REPO_NAME/archive/$REF.tar.gz"
  
  echo "⬇️ Downloading archive $ARCHIVE_URL..."
  curl -L "$ARCHIVE_URL" -o "$TMPDIR/archive.tar.gz"
  
  echo "📂 Extracting archive..."
  tar -xzf "$TMPDIR/archive.tar.gz" -C "$TMPDIR"
fi

# Locate build artifacts
# If release asset was used, assume it dropped things into $TMPDIR/{frontend,snake-link-raspberry}
# If archive was used, it'll be in $TMPDIR/$REPO_NAME-$REF/{frontend,snake-link-raspberry}
if [[ -d "$TMPDIR/$REPO_NAME-$REF" ]]; then
  BASE="$TMPDIR/$REPO_NAME-$REF"
elif ls "$TMPDIR" | grep -q "^$REPO_NAME"; then
  BASE="$TMPDIR/$(ls "$TMPDIR" | grep "^$REPO_NAME")"
else
  BASE="$TMPDIR"
fi

FRONTEND_PATH="$BASE/frontend/.output/server/index.mjs"
BACKEND_PATH="$BASE/snake-link-raspberry/dist/index.js"

echo "🚀 Starting/updating with pm2..."

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
echo "✅ Deployment of '$REF' complete!"
