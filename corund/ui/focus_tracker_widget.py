from __future__ import annotations

import math
import time

from PySide6.QtCore import QTimer, Qt
from PySide6.QtGui import QColor, QLinearGradient, QPainter, QPainterPath, QPen
from PySide6.QtWidgets import QFrame, QGridLayout, QLabel, QVBoxLayout

from corund.focus_tracker import FocusSnapshot, FocusTrackerModel


class FocusTrackerWidget(QFrame):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setProperty("panel", True)
        self.setObjectName("FocusTrackerWidget")
        self.model = FocusTrackerModel()
        self.snapshot = self.model.ingest({"focus": 0.5, "stress": 0.2})
        self._phase = 0.0
        self._t0 = time.time()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(18, 16, 18, 16)
        layout.setSpacing(10)

        self.stress_band = QFrame()
        self.stress_band.setFixedHeight(10)
        self.stress_band.setStyleSheet("background:#8bc6ff; border-radius:5px;")
        layout.addWidget(self.stress_band)

        metrics = QGridLayout()
        metrics.setHorizontalSpacing(12)
        metrics.setVerticalSpacing(6)
        self.focus_label = QLabel("Focus: 50%")
        self.stress_label = QLabel("Stress: 20%")
        self.calm_label = QLabel("Calm: 57%")
        self.avg_label = QLabel("Average stress: 20% · previous avg: 20%")
        for i, label in enumerate((self.focus_label, self.stress_label, self.calm_label)):
            label.setStyleSheet("font-size:14px; font-weight:600;")
            metrics.addWidget(label, 0, i)
        self.avg_label.setStyleSheet("font-size:12px; color:#a7acd3;")
        metrics.addWidget(self.avg_label, 1, 0, 1, 3)
        layout.addLayout(metrics)

        self._anim = QTimer(self)
        self._anim.setInterval(33)
        self._anim.timeout.connect(self._tick)
        self._anim.start()

    def update_emotion(self, emotion_vec: dict) -> None:
        self.snapshot = self.model.ingest(emotion_vec)
        self._apply_snapshot(self.snapshot)

    def _apply_snapshot(self, snap: FocusSnapshot) -> None:
        self.focus_label.setText(f"Focus: {int(round(snap.focus * 100))}%")
        self.stress_label.setText(f"Stress: {int(round(snap.stress * 100))}%")
        self.calm_label.setText(f"Calm: {int(round(snap.calm * 100))}%")
        self.avg_label.setText(
            f"Average stress: {int(round(snap.avg_stress * 100))}% · previous avg: {int(round(snap.prev_avg_stress * 100))}%"
        )
        band_color = FocusTrackerModel.stress_band_color(snap.stress)
        self.stress_band.setStyleSheet(f"background:{band_color}; border-radius:5px;")
        self.update()

    def _tick(self) -> None:
        self._phase = (time.time() - self._t0) * (1.0 + self.snapshot.stress)
        self.update()

    def paintEvent(self, event) -> None:
        super().paintEvent(event)
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        r = self.rect().adjusted(10, 40, -10, -10)
        cx = r.center().x()
        cy = r.center().y() + 16

        base = 20 + self.snapshot.focus * 28
        float_y = math.sin(self._phase * 0.8) * 8

        calm_color = QColor("#e9f3ff")
        stress_color = QColor(FocusTrackerModel.stress_band_color(self.snapshot.stress))
        aura = QColor(stress_color)
        aura.setAlpha(95)

        grad = QLinearGradient(r.left(), r.top(), r.right(), r.bottom())
        grad.setColorAt(0.0, calm_color)
        grad.setColorAt(0.55, QColor("#c7ddff"))
        grad.setColorAt(1.0, aura)

        path = QPainterPath()
        for i in range(6):
            angle = (i / 6.0) * math.tau + self._phase * 0.15
            wobble = 1.0 + 0.18 * math.sin(self._phase + i)
            px = cx + math.cos(angle) * (base * wobble + i * 4)
            py = cy + float_y + math.sin(angle) * (base * 0.65 * wobble + i * 2)
            if i == 0:
                path.moveTo(px, py)
            else:
                path.lineTo(px, py)
        path.closeSubpath()

        painter.setPen(Qt.NoPen)
        painter.setBrush(grad)
        painter.drawPath(path)

        pen = QPen(QColor("#ffffff"), 1.5)
        pen.setCosmetic(True)
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)
        painter.drawPath(path)
