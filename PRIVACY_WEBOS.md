# Etherea WebOS Privacy Notes

## Default behavior
- Telemetry/analytics is **OFF by default**.
- WebOS runs in local mock mode by default (`VITE_USE_API=false`).

## Local data stored
- Browser `localStorage` entries for:
  - workspace list/data
  - client diagnostics logs
  - UI settings/preferences

## Network behavior
- In mock mode, no API calls are required for core interactions.
- If `VITE_USE_API=true`, command behavior may call optional backend endpoints.

## User controls
- Privacy toggle in Settings.
- Analytics opt-in toggle in Settings.
- Command bar kill switch in Settings.

## Policy summary
- No hidden telemetry.
- No automatic export of local user data.
- Any external telemetry requires explicit user opt-in.
