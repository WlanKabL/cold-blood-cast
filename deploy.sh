#!/usr/bin/env bash
#
# build.sh - Download latest release build.rar from GitHub, extract it,
# and start services with pm2.
#
# Requires: curl, unrar or 7z, pm2

set -euo pipefail

# Configuration
REPO_OWNER="WlanKabL"
REPO_NAME="cold-blood-cast"
ASSET_NAME="build.rar"
TMPDIR=$(mktemp -d)

# Cleanup on exit
function cleanup {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

# Fetch latest release download URL for the asset
echo "Fetching latest release asset URL..."
DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest" \
  | grep '"browser_download_url"' \
  | grep "$ASSET_NAME" \
  | head -n1 \
  | cut -d '"' -f4)

if [[ -z "$DOWNLOAD_URL" ]]; then
  echo "Error: Could not find asset '$ASSET_NAME' in latest release." >&2
  exit 1
fi

echo "Download URL: $DOWNLOAD_URL"

# Download the asset
echo "Downloading $ASSET_NAME..."
curl -L "$DOWNLOAD_URL" -o "$TMPDIR/$ASSET_NAME"

# Extract the archive
echo "Extracting archive..."
if command -v unrar &>/dev/null; then
  unrar x -o+ "$TMPDIR/$ASSET_NAME" "$TMPDIR"
elif command -v 7z &>/dev/null; then
  7z x "$TMPDIR/$ASSET_NAME" -o"$TMPDIR"
else
  echo "Error: neither 'unrar' nor '7z' found. Install one to extract RAR files." >&2
  exit 1
fi

# Define paths to services
FRONTEND_PATH="$TMPDIR/frontend/.output/server/index.mjs"
BACKEND_PATH="$TMPDIR/snake-link-raspberry/dist/index.js"

# Start or reload with pm2
echo "Starting/updating services with pm2..."
# Frontend
if pm2 list | grep -q "frontend"; then
  pm2 restart frontend --update-env
else
  pm2 start "$FRONTEND_PATH" --name frontend --update-env
fi
# Backend (snake-link-raspberry)
if pm2 list | grep -q "snake-link-raspberry"; then
  pm2 restart snake-link-raspberry --update-env
else
  pm2 start "$BACKEND_PATH" --name snake-link-raspberry --update-env
fi

# Save pm2 process list for resurrection
pm2 save

echo "Build and deployment complete."
