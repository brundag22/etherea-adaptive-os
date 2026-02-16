# WebOS Truth Scan

## What exists already

- `etherea-webos/apps/web/src/components/WorkspacePanel.tsx` already provides a working workspace editor with markdown preview, file/folder creation, rename/delete, and `etherea_state` fenced block persistence.
- `etherea-webos/apps/web/src/components/AvatarStage.tsx` already includes the procedural SVG avatar, drag handling, mood-based expression changes, and always-on idle motion loops.
- `etherea-webos/apps/web/src/lib/brain.ts` already provides offline local response generation with a stable JSON contract (`response`, `command`, `save_memory`, `emotion_update`).
- `etherea-webos/apps/web/src/lib/voice.ts` already provides Web Speech API TTS with voice preference fallback (`hi-IN`, `kn-IN`, `ta-IN`, `te-IN`, `en-IN`, `en-US`) and mouth animation envelopes.
- `etherea-webos/packages/core/src/registry.ts` already has a working offline `runAgentAction` registry for non-network agent actions.

## What the current PR/branch broke or removed

- `etherea-webos/apps/web/src/App.tsx` had tabs and a command dock but did not present a full OS shell layout with top bar + left workspace sidebar + explicit panel switching in the required format.
- Agent surface was chat-only and did not wire the dedicated agent action runner (`runAgentAction`) in the visible UI.
- Settings/selfcheck were fragmented and did not provide one explicit in-app verification surface for avatar drag, contract checks, notes persistence, and agent wiring.
- CI workflow generated lockfile during every run, introducing nondeterminism.

## Minimal-churn restoration plan

1. Rework `App.tsx` only (without renaming architecture/files) to restore a full shell:
   - top menu bar,
   - left workspace/action sidebar,
   - main panel switching (notes/agent/settings),
   - always-visible command bar.
2. Keep existing `WorkspacePanel`, `AvatarStage`, offline brain, and voice libraries, and wire them together in the restored shell.
3. Wire real agent actions using `runAgentAction` from `@etherea/core` in the Agent panel.
4. Add in-app selfcheck section in Settings to verify real feature behavior.
5. Stabilize deploy workflow by requiring committed lockfile and removing runtime lockfile generation.
6. Harden PWA precache behavior with ignores + runtime caching for large vendor chunks to avoid Workbox precache size failures.
