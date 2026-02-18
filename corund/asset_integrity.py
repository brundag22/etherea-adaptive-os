from __future__ import annotations

import math
import os
import struct
import tempfile
import wave
from pathlib import Path

PNG_SIG = b"\x89PNG\r\n\x1a\n"
JPEG_SOI = b"\xff\xd8"
WEBP_RIFF = b"RIFF"
WEBP_TAG = b"WEBP"


def validate_asset(path: str | Path) -> tuple[bool, str]:
    p = Path(path)
    if not p.exists():
        return False, "missing"
    size = p.stat().st_size
    if size <= 0:
        return False, "empty"

    suffix = p.suffix.lower()
    if suffix == ".wav":
        try:
            with wave.open(str(p), "rb") as wf:
                if wf.getnframes() <= 0:
                    return False, "wav has no frames"
                _ = wf.getframerate()
            return True, "ok"
        except Exception as exc:
            return False, f"invalid wav: {exc}"

    header = p.read_bytes()[:16]
    if suffix == ".png":
        return (header.startswith(PNG_SIG), "ok" if header.startswith(PNG_SIG) else "invalid png header")
    if suffix in {".jpg", ".jpeg"}:
        return (header.startswith(JPEG_SOI), "ok" if header.startswith(JPEG_SOI) else "invalid jpeg header")
    if suffix == ".webp":
        ok = len(header) >= 12 and header[:4] == WEBP_RIFF and header[8:12] == WEBP_TAG
        return (ok, "ok" if ok else "invalid webp header")

    return True, "unchecked"


def ensure_click_beep() -> str:
    path = Path(tempfile.gettempdir()) / "etherea_fallback_click.wav"
    if path.exists() and path.stat().st_size > 44:
        return str(path)

    sample_rate = 22050
    duration = 0.12
    total = int(sample_rate * duration)
    freq = 880.0
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for i in range(total):
            env = 1.0 - (i / max(1, total - 1))
            amp = int(32767 * 0.35 * env * math.sin(2.0 * math.pi * freq * i / sample_rate))
            wf.writeframesraw(struct.pack("<h", amp))
    return str(path)


def resolve_audio_with_fallback(path: str | None, *, label: str = "audio") -> str | None:
    if path:
        ok, detail = validate_asset(path)
        if ok:
            return path
        print(f"[asset_integrity] Invalid {label} asset '{path}': {detail}. Using generated fallback beep.")
    return ensure_click_beep()


def resolve_image_valid(path: str | Path) -> tuple[bool, str]:
    ok, detail = validate_asset(path)
    if not ok:
        return False, detail
    return True, "ok"
