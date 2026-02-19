# Etherea WebOS Prototype

## One-command checks

```bash
cd etherea-webos
npm install
npm run build
npm run selfcheck
```

## Local run

```bash
# terminal 1
npm run api:dev

# terminal 2
npm run web:dev
```

The web app will automatically use `http://localhost:8787` when no `VITE_ETHEREA_API_BASE_URL` is set.

## Packaging

- Windows/macOS/Linux desktop (Tauri): `npm run build -w @etherea/desktop-tauri`
- Android: `npm run sync -w @etherea/android-capacitor && npm run build:apk -w @etherea/android-capacitor`
