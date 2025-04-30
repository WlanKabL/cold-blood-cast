#!/usr/bin/env bash
#
# deploy.sh — Zero-downtime deployment mit Symlinks
# und automatischem PM2-Restart (falls ecosystem.config.js vorhanden).
#
# Usage:
#   ./deploy.sh <version> [--keep <n>] 
#
# Env-Overrides:
#   GITHUB_OWNER   GitHub-Org oder User (Default: WlanKabL)
#   GITHUB_REPO    Repo-Name           (Default: cold-blood-cast)
#   DEPLOY_BASE    Basis-Pfad           (Default: ${HOME}/${GITHUB_REPO}-prod/deploy)
#   KEEP_RELEASES  Anzahl alte Releases (Default: 5)
#   ENVIRONMENT    PM2-Environment      (Default: production)
# 

set -euo pipefail
IFS=$'\n\t'

#### Cleanup Tempfiles on exit
TMP_ARCHIVE=""
cleanup() {
  [[ -n "$TMP_ARCHIVE" && -f "$TMP_ARCHIVE" ]] && rm -f "$TMP_ARCHIVE"
}
trap cleanup EXIT

#### Prevent running as root
if [ "$(id -u)" -eq 0 ]; then
  echo "❌ Bitte nicht als root ausführen — nutze deinen Nutzer!"
  exit 1
fi

#### Check dependencies
for cmd in curl unzip pm2 sort; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ Benötigt: '$cmd' ist nicht installiert."
    exit 2
  fi
done

#### Defaults (kann via ENV überschrieben werden)
GITHUB_OWNER="${GITHUB_OWNER:-WlanKabL}"
GITHUB_REPO="${GITHUB_REPO:-cold-blood-cast}"
DEPLOY_BASE="${DEPLOY_BASE:-${HOME}/${GITHUB_REPO}-prod/deploy}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
ENVIRONMENT="${ENVIRONMENT:-production}"

#### Usage
usage() {
  echo "Usage: $0 <version> [--keep <n>]"
  exit 3
}

#### Parse args
[ $# -ge 1 ] || usage
VERSION="$1"; shift

while [ $# -gt 0 ]; do
  case "$1" in
    --keep) KEEP_RELEASES="$2"; shift 2 ;;
    *) echo "❌ Unknown option: $1"; usage ;;
  esac
done

#### Paths
RELEASES_DIR="${DEPLOY_BASE}/releases"
RELEASE_DIR="${RELEASES_DIR}/${VERSION}"
CURRENT_LINK="${DEPLOY_BASE}/current"

echo
echo "📦 Deploying ${GITHUB_REPO} — version: ${VERSION}"
echo "📂 Base:    ${DEPLOY_BASE}"
echo "⏳ Releases:${RELEASES_DIR}"
echo "🔗 Current: ${CURRENT_LINK}"
echo "🗑️  Keep:    ${KEEP_RELEASES} releases"
echo

#### Prepare
mkdir -p "${RELEASES_DIR}" "${DEPLOY_BASE}/shared"
if [ -d "${RELEASE_DIR}" ]; then
  echo "⚠️  Release exists, removing old: ${RELEASE_DIR}"
  rm -rf "${RELEASE_DIR}"
fi

#### Download artifact
TMP_ARCHIVE="$(mktemp -p /tmp "${GITHUB_REPO}-${VERSION}-XXXXXX.zip")"
DOWNLOAD_URL="https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${VERSION}/build.zip"
echo "⬇️  Downloading ${DOWNLOAD_URL}"
curl -fSL "${DOWNLOAD_URL}" -o "${TMP_ARCHIVE}"

#### Extract
echo "📂 Extracting to ${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}"
unzip -o -q "${TMP_ARCHIVE}" -d "${RELEASE_DIR}"

#### (optional) Link shared dirs
# ln -nfs "${DEPLOY_BASE}/shared/uploads" "${RELEASE_DIR}/uploads"

#### Switch symlink
echo "🔀 Updating symlink ${CURRENT_LINK} → ${RELEASE_DIR}"
ln -nfs "${RELEASE_DIR}" "${CURRENT_LINK}"

#### Cleanup old releases
echo "🧹 Cleaning up old releases"
cd "${RELEASES_DIR}"
# sortiere semver (v1.2.3 ..), behalte die ersten $KEEP_RELEASES, rest löschen
ls -1d */ | sort -rV | tail -n +$((KEEP_RELEASES+1)) | xargs -r rm -rf --

#### PM2 Restart
echo "🔄 PM2 deployment (${ENVIRONMENT} environment)"
if [ -f "${CURRENT_LINK}/ecosystem.config.js" ]; then
  pm2 startOrRestart "${CURRENT_LINK}/ecosystem.config.js" --env "${ENVIRONMENT}"
else
  pm2 reload all || pm2 restart all
fi

echo
echo "✅ Deploy of ${VERSION} complete!"
