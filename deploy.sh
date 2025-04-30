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
# Requires: bash, curl or wget, unzip (for .zip), tar (for .tar.gz), pm2

set -euo pipefail
IFS=$'\n\t'

# --- Configuration ---
REPO_OWNER="WlanKabL"
REPO_NAME="cold-blood-cast"
ASSET_NAME="build.zip"
DEFAULT_REF="latest"
PM2_FRONTEND_NAME="frontend"
PM2_BACKEND_NAME="snake-link-raspberry"

# Base directory where releases are deployed
DEPLOY_BASE="${HOME}/cold-blood-cast-prod/deploy/releases"

# --- Dependency Checks ---
check_dependencies() {
  # Ensure required commands are available
  local deps=(bash pm2 tar unzip)
  local downloader=""
  if command -v curl &>/dev/null; then
    downloader="curl"
  elif command -v wget &>/dev/null; then
    downloader="wget"
  else
    echo "❌ Please install curl or wget to download files." >&2
    exit 1
  fi
  deps+=("$downloader")

  for cmd in "${deps[@]}"; do
    if ! command -v "$cmd" &>/dev/null; then
      echo "❌ Required command '$cmd' not found." >&2
      exit 1
    fi
  done
}

# fetch_json: Fetch JSON from a URL using curl or wget
# Globals:
#   None
# Arguments:
#   $1 - URL to fetch
# Outputs:
#   JSON to stdout
fetch_json() {
  local url="$1"
  if command -v curl &>/dev/null; then
    curl -sSL --retry 3 "$url"
  else
    wget -qO- "$url"
  fi
}

# get_latest_tag: Retrieve the latest release tag from GitHub API
# Globals:
#   REPO_OWNER, REPO_NAME
# Outputs:
#   Latest release tag
get_latest_tag() {
  echo "🔍 Fetching latest release tag..."
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest"
  local tag
  if command -v jq &>/dev/null; then
    tag=$(fetch_json "$api_url" | jq -r '.tag_name // empty')
  else
    tag=$(fetch_json "$api_url" \
      | grep -Po '"tag_name":\s*"\K[^"]+' || true)
  fi
  if [[ -z "$tag" ]]; then
    echo "❌ Could not determine latest release tag." >&2
    exit 1
  fi
  echo "→ latest release is $tag"
  printf '%s' "$tag"
}

# get_asset_download_url: Find the download URL for a named asset in a given ref
# Globals:
#   REPO_OWNER, REPO_NAME, ASSET_NAME
# Arguments:
#   $1 - ref (tag, branch, or SHA)
# Outputs:
#   URL string or empty if not found
get_asset_download_url() {
  local ref="$1"
  local api_url="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${ref}"
  local url=""
  if command -v jq &>/dev/null; then
    url=$(fetch_json "$api_url" \
      | jq -r --arg name "$ASSET_NAME" '
          .assets[]? | select(.name == $name) | .browser_download_url
        // empty')
  else
    url=$(fetch_json "$api_url" \
      | grep '"browser_download_url"' \
      | grep "$ASSET_NAME" \
      | head -n1 \
      | cut -d '"' -f4 \
      || true)
  fi
  printf '%s' "$url"
}

# download_file: Download a file from a URL to a destination path
# Globals:
#   None
# Arguments:
#   $1 - URL
#   $2 - output file path
download_file() {
  local url="$1"
  local dest="$2"
  echo "⬇️ Downloading $(basename "$dest")..."
  if command -v curl &>/dev/null; then
    curl -L "$url" -o "$dest"
  else
    wget -O "$dest" "$url"
  fi
}

# extract_zip: Unzip a ZIP archive
# Globals:
#   None
# Arguments:
#   $1 - zip file
#   $2 - target directory
extract_zip() {
  local zipfile="$1"
  local target="$2"
  echo "📂 Extracting $(basename "$zipfile")..."
  unzip -o "$zipfile" -d "$target"
}

# extract_tar_gz: Extract a .tar.gz archive
# Globals:
#   None
# Arguments:
#   $1 - tar.gz file
#   $2 - target directory
extract_tar_gz() {
  local archive="$1"
  local target="$2"
  echo "📂 Extracting $(basename "$archive")..."
  tar -xzf "$archive" -C "$target"
}

# find_entrypoints: Locate frontend and backend entrypoint files
# Globals:
#   DEPLOY_DIR, REPO_NAME
# Sets:
#   FRONTEND_PATH, BACKEND_PATH
find_entrypoints() {
  # Find frontend index.mjs
  FRONTEND_PATH=$(find "$DEPLOY_DIR" -type f -path "*/frontend/.output/server/index.mjs" | head -n1 || true)
  if [[ -z "$FRONTEND_PATH" ]]; then
    echo "❌ Could not find frontend entrypoint." >&2
    exit 1
  fi

  # Find backend index.js
  BACKEND_PATH=$(find "$DEPLOY_DIR" -type f -path "*/snake-link-raspberry/dist/index.js" | head -n1 || true)
  if [[ -z "$BACKEND_PATH" ]]; then
    echo "❌ Could not find backend entrypoint." >&2
    exit 1
  fi
}

# start_or_restart: Start or restart a PM2 process
# Globals:
#   None
# Arguments:
#   $1 - process name
#   $2 - script path
start_or_restart() {
  local name="$1"
  local script="$2"
  if pm2 describe "$name" &>/dev/null; then
    echo "🔄 Restarting PM2 process '$name'..."
    pm2 restart "$name" --update-env
  else
    echo "🚀 Starting PM2 process '$name'..."
    pm2 start "$script" --name "$name" --update-env
  fi
}

# deploy_ref: Main deployment logic for a given ref
# Globals:
#   DEFAULT_REF, DEPLOY_BASE, REPO_OWNER, REPO_NAME, ASSET_NAME
# Arguments:
#   $1 - ref to deploy
deploy_ref() {
  local ref="$1"
  mkdir -p "$DEPLOY_BASE"

  # Resolve "latest" to actual tag
  if [[ "$ref" == "$DEFAULT_REF" ]]; then
    ref=$(get_latest_tag)
  fi

  local deploy_dir="${DEPLOY_BASE}/${ref}"
  mkdir -p "$deploy_dir"
  DEPLOY_DIR="$deploy_dir"
  echo "📦 Deploying ref: $ref into $DEPLOY_DIR"

  # Try to download asset
  local download_url
  download_url=$(get_asset_download_url "$ref")
  if [[ -n "$download_url" ]]; then
    echo "✅ Found asset: $download_url"
    download_file "$download_url" "${DEPLOY_DIR}/${ASSET_NAME}"
    extract_zip "${DEPLOY_DIR}/${ASSET_NAME}" "$DEPLOY_DIR"
  else
    # Fallback to Git archive
    local archive_url="https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${ref}.tar.gz"
    echo "⚠️ Asset not found, falling back to archive: $archive_url"
    download_file "$archive_url" "${DEPLOY_DIR}/archive.tar.gz"
    extract_tar_gz "${DEPLOY_DIR}/archive.tar.gz" "$DEPLOY_DIR"
  fi

  # Locate entrypoints and start/restart
  find_entrypoints
  start_or_restart "$PM2_FRONTEND_NAME" "$FRONTEND_PATH"
  start_or_restart "$PM2_BACKEND_NAME"  "$BACKEND_PATH"

  pm2 save
  echo "✅ Deployment of '$ref' completed!"
}

# --- Script Entry Point ---
main() {
  check_dependencies
  local ref="${1:-$DEFAULT_REF}"
  deploy_ref "$ref"
}

main "$@"
