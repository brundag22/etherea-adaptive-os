# CI + Firebase Deploy Truth Scan

## Scope
Scanned these files exactly as requested:
- `etherea-webos/firebase.json`
- `.github/workflows/firebase-hosting.yml`
- `etherea-webos/apps/web/vite.config.ts`
- `etherea-webos/package.json`

## Findings

### 1) `etherea-webos/firebase.json`
- **Current state:** Valid JSON, no trailing markdown fence/junk, has the expected hosting site/public/rewrites/ignore structure.
- **Risk found:** If this file is ever edited manually with trailing text, Firebase deploy can fail with JSON parse errors; CI had no strict UTF-8 parse guard before deploy.
- **Action taken in this task:** Rewrote file as clean JSON-only and added explicit CI parse preflight.

### 2) `.github/workflows/firebase-hosting.yml`
- **Current state:** Already does `npm ci`, builds core→ui→web, and deploys to Firebase Hosting.
- **Problems/risk found:**
  - Needed a stricter fail-fast preflight gate for `dist/index.html` + `firebase.json` parse before deploy.
  - Selfcheck should run in this deploy flow to catch runtime contract drift earlier.
- **Action taken in this task:** Added `Selfcheck` step and hardened preflight checks.

### 3) `etherea-webos/apps/web/vite.config.ts`
- **Current state:** PWA enabled with Workbox + chunk split support.
- **Problems/risk found:**
  - Asset-size-related precache failures can still happen when heavy chunks are emitted unexpectedly.
  - Manual chunking was too coarse for known heavy groups (Monaco/PDFJS/Three).
- **Action taken in this task:** Increased safety for Workbox with larger cache limit + explicit heavy-asset precache ignores + granular vendor chunk splitting.

### 4) `etherea-webos/package.json` workspace build order
- **Current state:** Build script already enforces `core -> ui -> web` in correct order.
- **Problems/risk found:** None in build ordering itself.
- **Action taken in this task:** No package-level change required; workflow preserves this order explicitly.
