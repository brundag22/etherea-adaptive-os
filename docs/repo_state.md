# Etherea WebOS Repo State (Truth Scan)

## Web entry and app shell
- Web entrypoint is `etherea-webos/apps/web/src/main.tsx`, which mounts `App` and imports `styles/app.css`.
- Main app shell is `etherea-webos/apps/web/src/App.tsx` with a single-page panel layout (notes/agent/settings), top status bar, left navigation/workspace rails, command palette, toast host, and floating avatar.
- No router package is currently used; the app uses local state for panel switching.

## Styling system
- Styling is plain CSS in `etherea-webos/apps/web/src/styles/app.css`.
- Theme is glass/neon via CSS variables, gradients, blur, shadows, and animated aurora/canvas background.
- Components primarily consume global classnames; there is no Tailwind or CSS-in-JS.

## Offline brain contract + emotion update flow
- Contract generator/parser logic lives in `etherea-webos/apps/web/src/lib/brain.ts`.
- UI bridge is `etherea-webos/apps/web/src/lib/useEthereaBrain.ts`.
- `App.tsx` calls `processInput`; resulting contract feeds:
  - avatar emotional expression (`emotion_update`, `mood`, `avatarImpulse`)
  - agent contract preview panel
  - optional command execution summaries.

## Monorepo/workspace baseline for WebOS
- Workspace root is `etherea-webos/package.json` (npm workspaces).
- Web workspace name/path: `@etherea/web` -> `etherea-webos/apps/web`.
- Lockfile used by CI/local installs: `etherea-webos/package-lock.json`.
- Reliable local commands (run from `etherea-webos/`):
  - `npm ci --no-audit --no-fund`
  - `npm run build -w @etherea/web`
  - `npm run dev -w @etherea/web`
  - `npm run preview -w @etherea/web`

## Firebase deploy config and workflow
- Hosting config: `etherea-webos/firebase.json`.
  - `hosting.public` points to `apps/web/dist`.
  - SPA rewrite sends all routes to `/index.html`.
- CI workflow: `.github/workflows/firebase-hosting.yml`.
  - checks out repo, sets Node 20, runs `npm ci --no-audit --no-fund` in `etherea-webos`, builds workspaces (`core -> ui -> web`), runs selfcheck, validates build + firebase JSON, then deploys with Firebase Hosting action.

## Vite/PWA/Workbox reliability
- Vite config is `etherea-webos/apps/web/vite.config.ts`.
- Existing mitigations:
  - Workbox `maximumFileSizeToCacheInBytes` set to 10 MiB.
  - heavy vendor chunks split via `manualChunks` (`react`, `react-dom`, `monaco`, `pdfjs`, `three`, `pwa`, `core`).
  - `globIgnores` excludes maps, heavy vendor bundles, wasm/worker artifacts from precache.
- Build failures were historically tied to oversize precache assets; current split + ignore strategy avoids Workbox hard-fail while preserving runtime caching.

## Alive features status (real vs dummy)
Implemented/alive:
- Procedural SVG avatar with idle breathing/float/blink and mood-driven expression.
- TTS playback with mouth animation cadence.
- Toast system for runtime events.
- Offline notes persisted in IndexedDB/localStorage fallback.
- Markdown preview supports Obsidian-style callouts and hidden `etherea_state` fenced JSON block.
- Offline brain parses commands and performs scoped workspace actions.

Still lightweight / mostly shell:
- Some tool buttons (Composer/Memory/Timeline/Diagnostics) are currently non-functional placeholders.
- Panel switching is local state only (no deep-link routing yet).
