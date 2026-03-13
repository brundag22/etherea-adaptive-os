from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from statistics import fmean


@dataclass(frozen=True)
class FocusSnapshot:
    focus: float
    stress: float
    calm: float
    avg_focus: float
    avg_stress: float
    avg_calm: float
    prev_avg_stress: float


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


class FocusTrackerModel:
    """Smoothed focus/stress/calm model with rolling averages."""

    def __init__(self, window_size: int = 180, baseline_focus: float = 0.5, baseline_stress: float = 0.2) -> None:
        self.window_size = max(20, int(window_size))
        self._focus = clamp01(baseline_focus)
        self._stress = clamp01(baseline_stress)
        self._history: deque[tuple[float, float, float]] = deque(maxlen=self.window_size)
        self._prev_stress_windows: deque[float] = deque(maxlen=12)

    @staticmethod
    def stress_band_color(stress: float) -> str:
        s = clamp01(stress)
        if s >= 0.80:
            return "#ff3b30"
        if s >= 0.60:
            return "#ff8a3d"
        if s >= 0.30:
            return "#8bc6ff"
        return "#ffffff"

    def ingest(self, emotion_vec: dict) -> FocusSnapshot:
        raw_focus = clamp01(emotion_vec.get("focus", self._focus))
        raw_stress = clamp01(emotion_vec.get("stress", self._stress))

        # Smooth and gently bias stress upward while deeply focused.
        self._focus = clamp01((self._focus * 0.70) + (raw_focus * 0.30))
        pressure = max(0.0, raw_focus - 0.65) * 0.18
        self._stress = clamp01((self._stress * 0.68) + (raw_stress * 0.32) + pressure)

        calm = clamp01((1.0 - self._stress) * 0.72 + max(0.0, 0.55 - self._focus) * 0.28)

        self._history.append((self._focus, self._stress, calm))
        history = list(self._history)

        avg_focus = fmean(x[0] for x in history)
        avg_stress = fmean(x[1] for x in history)
        avg_calm = fmean(x[2] for x in history)

        if len(history) % 30 == 0:
            self._prev_stress_windows.append(avg_stress)
        prev_avg_stress = fmean(self._prev_stress_windows) if self._prev_stress_windows else avg_stress

        return FocusSnapshot(
            focus=self._focus,
            stress=self._stress,
            calm=calm,
            avg_focus=avg_focus,
            avg_stress=avg_stress,
            avg_calm=avg_calm,
            prev_avg_stress=prev_avg_stress,
        )
