# Firebase Production Deployment (Etherea OS v3)

Run these exact commands from the repo root:

```bash
export FIREBASE_PROJECT_ID=<your-blaze-project-id>
npm install -g firebase-tools
firebase login
firebase use "$FIREBASE_PROJECT_ID" --add
firebase functions:secrets:set GEMINI_API_KEY --project "$FIREBASE_PROJECT_ID"
cd frontend && npm ci && npm run build && cd ..
firebase deploy --project "$FIREBASE_PROJECT_ID"
```

Automated equivalent:

```bash
./tools/firebase_deploy.sh
```

## Notes
- Hosting uses `frontend/dist` and SPA rewrites in `firebase.json`.
- Functions are configured in `functions/` with Node.js 20 runtime.
- If your environment blocks npm registry access (HTTP 403), run deployment from a network-enabled workstation/CI.
