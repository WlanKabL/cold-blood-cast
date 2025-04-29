#!/usr/bin/env bash
# build.sh - Build both frontend and snake-link-raspberry projects and package them into a release zip
# Requirements: npm, zip

set -euo pipefail

# Directories
FRONTEND_DIR="frontend"
BACKEND_DIR="snake-link-raspberry"
OUTPUT_DIR="build"
ZIP_FILE="build.zip"

# Clean previous outputs
echo "Cleaning previous build artifacts..."
rm -rf "$OUTPUT_DIR" "$ZIP_FILE"

# Build frontend
echo "Building frontend..."
pushd "$FRONTEND_DIR" >/dev/null
npm install
npm run build
popd >/dev/null

# Build backend
echo "Building snake-link-raspberry..."
pushd "$BACKEND_DIR" >/dev/null
npm install
npm run build
popd >/dev/null

# Prepare output structure
echo "Preparing output directory..."
mkdir -p "$OUTPUT_DIR/frontend" "$OUTPUT_DIR/snake-link-raspberry"

# Copy build artifacts
echo "Copying frontend build artifacts..."
cp -r "$FRONTEND_DIR/.output" "$OUTPUT_DIR/frontend/"

echo "Copying backend build artifacts..."
cp -r "$BACKEND_DIR/dist" "$OUTPUT_DIR/snake-link-raspberry/"

# Package into zip archive
echo "Creating zip archive $ZIP_FILE..."
# Choose archiver: zip -> 7z -> PowerShell Compress-Archive
if command -v zip &> /dev/null; then
  zip -r "$ZIP_FILE" "$OUTPUT_DIR"
elif command -v 7z &> /dev/null; then
  7z a "$ZIP_FILE" "$OUTPUT_DIR"
elif command -v powershell &> /dev/null; then
  # Windows PowerShell Compress-Archive
  powershell -NoLogo -NoProfile -Command "Compress-Archive -Path '$OUTPUT_DIR\*' -DestinationPath '$ZIP_FILE' -Force"
else
  echo "Error: No archiver found. Please install 'zip', '7z' or ensure PowerShell is available." >&2
  exit 1
fi

echo "Build and packaging complete: $ZIP_FILE"
