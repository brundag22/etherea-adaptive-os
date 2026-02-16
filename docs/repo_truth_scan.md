# Repo Truth Scan

## Web entry and UI structure
- Web entrypoint is `etherea-webos/apps/web/src/main.tsx` rendering `<App />` and `styles/app.css`.
- Main screen orchestration is in `etherea-webos/apps/web/src/App.tsx` with tabs: Home, Workspace, Agent, Learn, Settings.
- Avatar visuals live in `etherea-webos/apps/web/src/components/AvatarStage.tsx` and toasts in `etherea-webos/apps/web/src/components/Toast.tsx`.
- Workspace editor is in `etherea-webos/apps/web/src/components/WorkspacePanel.tsx` backed by IndexedDB/localStorage in `etherea-webos/apps/web/src/lib/workspaceStore.ts`.

## Brain contract and emotion flow
- Offline brain resolver is `etherea-webos/apps/web/src/lib/brain.ts`.
- Current contract returned by `speak(input)` is JSON with keys:
  - `response`
  - `command`
  - `save_memory`
  - `emotion_update`
- `emotion_update` is consumed in `App.tsx` and passed to avatar component to alter expression.

## Voice and privacy
- Voice implementation is client-side in `etherea-webos/apps/web/src/lib/voice.ts`.
- Uses `speechSynthesis` for output and optional speech recognition for mic input.
- Settings in `App.tsx` control voice output, mic opt-in, privacy kill switch, and reduced motion.

## Deploy pipeline
- Firebase deploy workflow is `.github/workflows/firebase-hosting.yml`.
- Workflow currently sets working directory to `etherea-webos`, installs dependencies, builds workspaces, runs preflight checks, then deploys via `FirebaseExtended/action-hosting-deploy@v0`.
- Hosting config is `etherea-webos/firebase.json` with `public: apps/web/dist` and rewrite to `/index.html`.

## PWA/workbox and bundle risk hotspots
- PWA setup is in `etherea-webos/apps/web/vite.config.ts` via `vite-plugin-pwa` workbox config.
- Existing bundle-risk imports include optional worker/tooling classes such as monaco/pdfjs/three patterns referenced by chunk ignore rules in Vite config.
- Largest deployment risks:
  - malformed `firebase.json`
  - missing `apps/web/dist/index.html` during CI
  - Workbox precache failures when generated assets exceed cache limits.
