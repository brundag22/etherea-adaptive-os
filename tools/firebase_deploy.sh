#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ID="${FIREBASE_PROJECT_ID:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "ERROR: Set FIREBASE_PROJECT_ID to your Blaze project id before running."
  echo "Example: export FIREBASE_PROJECT_ID=my-etherea-prod"
  exit 1
fi

command -v firebase >/dev/null 2>&1 || {
  echo "Installing Firebase CLI globally..."
  npm install -g firebase-tools
}

echo "Firebase CLI version: $(firebase --version)"

echo "Authenticating with Firebase (interactive browser flow)..."
firebase login

echo "Selecting Firebase project: $PROJECT_ID"
firebase use "$PROJECT_ID" --add

echo "Ensuring functions secret GEMINI_API_KEY exists..."
firebase functions:secrets:set GEMINI_API_KEY --project "$PROJECT_ID"

echo "Installing frontend dependencies and building..."
cd "$ROOT_DIR/frontend"
npm ci
npm run build

if [[ ! -d "$ROOT_DIR/frontend/dist" ]]; then
  echo "ERROR: frontend/dist not found after build"
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
