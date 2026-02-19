# README Lock (Immutable Baseline)

## ⚠️ DO NOT EDIT ROOT README.md

The repository root `README.md` is locked for the WebOS hardening effort.

- **Rule:** Do not modify `README.md` at repo root.
- **WebOS documentation location:** `WEBOS_README.md` and/or `docs/webos.md`.

## Baseline

- File: `README.md`
- SHA256: `67c3d906a40a9d6391979deb0a296524a01c20ad84edf40846b8044b58f0e91d`
- Size (bytes): `10358`
- Line endings: `LF`

## Verification Procedure

1. Recompute SHA256 and size before and after WebOS changes.
2. If hash or size differs, immediately revert `README.md` and restore baseline.
3. Continue work only after exact match is restored.
