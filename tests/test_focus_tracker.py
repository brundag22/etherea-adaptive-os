from corund.focus_tracker import FocusTrackerModel


def test_stress_band_color_thresholds():
    assert FocusTrackerModel.stress_band_color(0.9) == "#ff3b30"
    assert FocusTrackerModel.stress_band_color(0.65) == "#ff8a3d"
    assert FocusTrackerModel.stress_band_color(0.45) == "#8bc6ff"
    assert FocusTrackerModel.stress_band_color(0.2) == "#ffffff"


def test_ingest_tracks_averages_and_calm():
    model = FocusTrackerModel(window_size=60)
    snap = None
    for _ in range(65):
        snap = model.ingest({"focus": 0.85, "stress": 0.35})

    assert snap is not None
    assert 0.0 <= snap.calm <= 1.0
    assert snap.focus > 0.6
    assert snap.stress >= 0.3
    assert 0.0 <= snap.prev_avg_stress <= 1.0
