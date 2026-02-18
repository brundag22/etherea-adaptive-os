#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ID="${FIREBASE_PROJECT_ID:-}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: required command not found: $1"
    exit 1
  }
}

if [[ -z "$PROJECT_ID" ]]; then
  echo "ERROR: Set FIREBASE_PROJECT_ID to your Blaze project id before running."
  echo "Example: export FIREBASE_PROJECT_ID=my-etherea-prod"
  exit 1
fi

require_cmd npm
require_cmd curl

if ! command -v firebase >/dev/null 2>&1; then
  echo "Installing Firebase CLI globally..."
  npm install -g firebase-tools
fi

require_cmd firebase
echo "Firebase CLI version: $(firebase --version)"

if ! firebase projects:list --json >/dev/null 2>&1; then
  echo "Authenticating with Firebase (interactive browser flow)..."
  firebase login
fi

echo "Selecting Firebase project: $PROJECT_ID"
firebase use "$PROJECT_ID" --add

if [[ ! -d "$ROOT_DIR/functions" || ! -d "$ROOT_DIR/frontend" ]]; then
  echo "ERROR: expected frontend/ and functions/ directories were not found."
  exit 1
fi

echo "Ensuring functions secret GEMINI_API_KEY exists..."
firebase functions:secrets:set GEMINI_API_KEY --project "$PROJECT_ID"

echo "Installing frontend dependencies and building..."
cd "$ROOT_DIR/frontend"
npm ci
npm run build

if [[ ! -f "$ROOT_DIR/frontend/dist/index.html" ]]; then
  echo "ERROR: frontend/dist/index.html not found after build"
  exit 1
fi

echo "Deploying Hosting + Functions..."
cd "$ROOT_DIR"
firebase deploy --project "$PROJECT_ID"

echo "Post-deploy checks"
SITE_URL="https://${PROJECT_ID}.web.app"
echo "Checking $SITE_URL"
curl -fsSL "$SITE_URL" >/dev/null

echo "Deployment complete: $SITE_URL"
