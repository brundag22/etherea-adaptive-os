# Etherea WebOS (Primary)

Primary path: `etherea-webos/apps/web`

## Prerequisites
- Node.js 20 LTS
- npm 10+

## Install
```bash
cd etherea-webos
npm ci
```

## Development
```bash
cd etherea-webos
npm run web:dev
```

## Build
```bash
cd etherea-webos
npm run web:build
```

## Lint + Typecheck
```bash
cd etherea-webos
npm run lint
npm run typecheck
```

## Environment variables
Create `etherea-webos/apps/web/.env.local` when needed:

```bash
VITE_USE_API=false
```

- `VITE_USE_API=false` (default recommended): mock/local mode only.
- `VITE_USE_API=true`: WebOS will attempt API-backed command behavior if optional endpoints are available.

## Mock/local mode
Mock/local mode is fully supported and is default-safe:
- Workspaces, settings, diagnostics logs are stored in browser `localStorage`.
- Command bar returns local mock outputs.
- No backend is required.

## Firebase Hosting deploy
Configuration lives in `etherea-webos/firebase.json`.

### Local CLI deploy
```bash
cd etherea-webos
npm ci
npm run web:build
npx firebase-tools deploy --only hosting
```

### GitHub Actions deploy
- Workflow: `.github/workflows/firebase-hosting.yml`
- Auth options:
  - preferred: `FIREBASE_SERVICE_ACCOUNT` (JSON string secret)
  - fallback: `FIREBASE_TOKEN`
- Optional project override: `FIREBASE_PROJECT_ID`

When service account auth is used, workflow writes secret JSON into a temp file and authenticates using `GOOGLE_APPLICATION_CREDENTIALS`.
