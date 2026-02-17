# Verification Guide

## 1) Firebase deploy reliability
1. Push to `main` with changes under `etherea-webos/**`.
2. Watch `.github/workflows/firebase-hosting.yml` run.
3. Confirm steps pass in order:
   - `npm ci --no-audit --no-fund`
   - `npm run build -w @etherea/core`
   - `npm run build -w @etherea/ui`
   - `npm run build -w @etherea/web`
   - `npm run selfcheck`
4. Confirm preflight checks pass for `apps/web/dist/index.html`, `apps/web/dist/sw.js`, and `firebase.json`.
5. Expected production URL: `https://etherea-adaptive-os.web.app`.

## 2) Offline behavior
1. From `etherea-webos/`, install once: `npm ci --no-audit --no-fund`.
2. Build web app: `npm run build -w @etherea/web`.
3. Start dev server: `npm run dev -w @etherea/web`.
4. Serve preview: `npm run preview -w @etherea/web` and load once.
5. In browser devtools, enable offline mode.
6. Refresh app and verify shell, notes, avatar UI still load and interact.

## 3) Avatar alive checks
1. Drag avatar and release near left/right/bottom zones.
2. Confirm it auto-docks to nearest edge.
3. Toggle **Explaining Mode** in settings or avatar button; confirm avatar shrinks and docks to right side.
4. Observe idle loop: subtle floating + breathing + random blink + aura pulse.
5. Send messages with different tones (question/frustrated/happy) and confirm expression changes.

## 4) Voice + mouth animation
1. Keep **Voice ON** and send a prompt in agent input.
2. Confirm speech starts with Web Speech API and avatar mouth animates while speaking.
3. If browser has no speech voices, verify an info toast appears and app continues.
4. Toggle **Voice OFF** and confirm no speech output while app responses continue.

## 5) Notes + hidden state
1. Create a new note from Notes panel.
2. Save and reload.
3. Verify file extension is `.md` under selected workspace.
4. Inspect saved content and confirm trailing block:
   - fenced code block named `etherea_state`
   - JSON payload persists hidden state metadata.
