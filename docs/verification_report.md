# Verification Report — CI/Deploy Reliability + WebOS Alive Features

## A) CI + Firebase Deploy reliability

### What is now enforced in CI
1. `npm ci` in `etherea-webos`.
2. Build order is explicit and stable:
   - `npm run build -w @etherea/core`
   - `npm run build -w @etherea/ui`
   - `npm run build -w @etherea/web`
3. `npm run selfcheck` runs before deploy.
4. Preflight fail-fast checks run before deploy:
   - Dist output must exist (`apps/web/dist/index.html` path check)
   - `firebase.json` must parse as JSON via Python.
5. Deploy runs only after all of the above pass.

### How to confirm deploy path locally (quick)
From repo root:
```bash
cd etherea-webos
npm ci --no-audit --no-fund
npm run build -w @etherea/core
npm run build -w @etherea/ui
npm run build -w @etherea/web
npm run selfcheck
test -f apps/web/dist/index.html
python -c "import json; json.load(open('firebase.json','r',encoding='utf-8'))"
```

## B) Avatar “alive” verification (real behavior)

### Confirm idle loop always runs
- Avatar uses continuous CSS animations (`avatar-float`, `avatar-breathe`, aura pulse) and blink/glance timing logic.
- Expected behavior: avatar should keep subtle movement even when user is idle.

### Confirm emotion updates change expression
- Any prompt triggers `speak(...)` which returns `emotion_update`.
- App applies `setEmotion(result.emotion_update)`.
- Avatar expression maps mood to different brow + mouth curve shapes.

### Confirm speaking drives mouth movement (approx lip sync)
- `speechSynthesis` TTS publishes animation updates (`speaking`, `mouthLevel`) via `subscribeVoiceAnimation`.
- `AvatarStage` consumes `mouthLevel` and changes mouth ellipse height while speaking.
- Expected behavior: mouth visibly pulses while TTS is active.

## C) Voice behavior verification

### Requirements met
- TTS is browser-native Web Speech API (`speechSynthesis`).
- Voice selection prefers: `hi-IN`, `kn-IN`, `ta-IN`, `te-IN`, `en-IN` (with clean fallback).
- Mic is independent from TTS and remains OFF by default unless user enables opt-in.
- Privacy kill switch forces mic OFF.

### Manual check
1. Open Settings, ensure **Mic opt-in** is disabled.
2. Enable **Voice output** and send a prompt.
3. Verify spoken response starts (if browser allows), and avatar mouth animates.
4. Toggle **Privacy kill switch ON** and verify mic cannot be started.

## D) Workspace + Agent + offline contract verification

### Workspace
- Workspace panel is functional (file create/edit/rename/delete).
- Markdown save includes hidden state block (`etherea_state`) in same `.md` file.

### Agent
- Agent tab actions are visible (quick command chips + action/system logs).
- Command execution actually calls command handlers (not placeholder text).

### Offline brain contract
- Prompts are handled via local brain contract (`speak` + intent/command parsing), with deterministic command objects.
- No network-only dependency is required for core command routing.

## E) Optional local reproducibility checks
```bash
cd etherea-webos
npm run selfcheck
npm run build -w @etherea/core
npm run build -w @etherea/ui
npm run build -w @etherea/web
```
If all pass, CI should follow the same gate path used before Firebase deploy.
