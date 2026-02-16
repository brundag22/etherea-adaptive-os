# WebOS Verification Steps

## 1) Run locally

1. `cd etherea-webos`
2. `npm ci`
3. `npm run build -w @etherea/core`
4. `npm run build -w @etherea/ui`
5. `npm run build -w @etherea/web`
6. `npm run dev -w @etherea/web`

## 2) UI shell restoration checks

1. Confirm top menu bar is visible with brand, Wi-Fi placeholder, clock, and Settings button.
2. Confirm left sidebar is visible with workspace list and quick action buttons (Notes, Agent, Settings).
3. Confirm command input bar is always visible at bottom.
4. Switch among Notes, Agent, and Settings and verify each panel is functional.

## 3) Notes/workspace checks

1. In Notes panel, click **New file** and create `notes.md`.
2. Edit markdown content and click **Save**.
3. Refresh browser and confirm file is still present (IndexedDB/localStorage fallback).
4. Open saved markdown and confirm preview renders and `etherea_state` block persists.

## 4) Agent wiring checks

1. Open Agent panel.
2. Pick each task (`generate_notes`, `summarize_pdf`, `create_ppt`) and click **Run action**.
3. Confirm JSON output appears and status changes to `done`.
4. Confirm system chat records action completion event.

## 5) Avatar behavior checks

1. Confirm avatar is floating as overlay, not trapped in panel.
2. Drag avatar and release near edges to confirm docking behavior.
3. Open avatar menu and verify dock options work.
4. Type command containing `teach` or `explain` and confirm avatar auto-docks to right.
5. Enable voice output and submit a prompt; confirm mouth movement animates while speaking.
6. Submit multiple prompts and confirm emotion changes are visible in expression.

## 6) Privacy and offline checks

1. Confirm mic is OFF by default.
2. Enable kill switch and confirm mic opt-in cannot be enabled until kill switch is disabled.
3. Disconnect network and verify app still loads and responds through offline brain.
4. Confirm no Gemini/network dependency is required for startup interactions.

## 7) Selfcheck section checks

1. Open Settings panel.
2. Review Selfcheck cards:
   - avatar overlay status,
   - brain contract availability,
   - emotion update status,
   - voice availability,
   - notes save/load status,
   - agent action wiring status.
3. Submit a command and rerun agent action to update selfcheck pass details.

## 8) Deploy preflight checks

1. Ensure `etherea-webos/package-lock.json` is committed.
2. Run workflow-equivalent checks:
   - `test -f etherea-webos/apps/web/dist/index.html`
   - `python -c "import json; json.load(open('etherea-webos/firebase.json','r',encoding='utf-8'))"`
3. Confirm `firebase.json` hosting `public` path is `apps/web/dist`.
