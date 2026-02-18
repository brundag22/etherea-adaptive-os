#!/usr/bin/env python3
"""Deprecated compatibility stub.

This repository's canonical desktop window is corund/ui/main_window_v3.py,
launched through `python main.py` (or `python etherea_launcher.py`).
"""

from __future__ import annotations

import sys


def main() -> int:
    print("Deprecated: use corund/ui/main_window_v3.py via main.py", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
