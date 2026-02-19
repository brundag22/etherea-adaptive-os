# Etherea WebOS Plan

## Primary WebOS Folder
- `etherea-webos/apps/web`

## Why this was chosen
- Existing monorepo structure already supports `core`, `ui`, and `web` workspaces.
- Build and type tooling already works from `etherea-webos` workspace root.
- Existing Firebase configuration already exists at `etherea-webos/firebase.json` and `etherea-webos/.firebaserc`.
- Required production hardening could be added with minimal risk versus older/demo stacks.

## Inventory snapshot (quick)
- `etherea-webos`: Vite + React + TypeScript workspace app; build passed.
- `frontend`: Vite + React; build command failed in current environment due to missing local `vite` binary/deps installation.
- `web-hero-demo`: Vite app; build passed.
- `web_showcase`: React app-rewired stack; build passed.

## Secondary stacks (left untouched as non-primary)
- `frontend/`
- `web-hero-demo/`
- `web_showcase/`

## Risk notes
- `USE_API=true` expects optional endpoints to exist externally; fallback remains mock/local mode.
- Firebase deploy requires repository secrets (`FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_TOKEN`).
- Existing legacy workflows were normalized to avoid duplicate/competing deploy jobs.
