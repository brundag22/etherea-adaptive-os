const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

export const stressBandColor = (stress) => {
  const s = clamp01(stress)
  if (s >= 0.8) return '#ef4444'
  if (s >= 0.6) return '#f97316'
  if (s >= 0.3) return '#60a5fa'
  return '#ffffff'
}

const mean = (values) => (values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 0)

export class DynamicFocusTracker {
  constructor({ windowSize = 180, baselineFocus = 0.55, baselineStress = 0.2 } = {}) {
    this.windowSize = Math.max(30, windowSize)
    this.focus = clamp01(baselineFocus)
    this.stress = clamp01(baselineStress)
    this.history = []
    this.previousStressWindows = []
  }

  ingest({ focusSignal = this.focus, stressSignal = this.stress }) {
    const rawFocus = clamp01(focusSignal)
    const rawStress = clamp01(stressSignal)

    this.focus = clamp01(this.focus * 0.7 + rawFocus * 0.3)
    const pressure = Math.max(0, rawFocus - 0.65) * 0.2
    this.stress = clamp01(this.stress * 0.68 + rawStress * 0.32 + pressure)
    const calm = clamp01((1 - this.stress) * 0.72 + Math.max(0, 0.55 - this.focus) * 0.28)

    this.history.push({ focus: this.focus, stress: this.stress, calm })
    if (this.history.length > this.windowSize) this.history.shift()

    const avgFocus = mean(this.history.map((entry) => entry.focus))
    const avgStress = mean(this.history.map((entry) => entry.stress))
    const avgCalm = mean(this.history.map((entry) => entry.calm))

    if (this.history.length % 30 === 0) {
      this.previousStressWindows.push(avgStress)
      if (this.previousStressWindows.length > 12) this.previousStressWindows.shift()
    }

    const previousAvgStress = this.previousStressWindows.length ? mean(this.previousStressWindows) : avgStress

    return {
      focus: this.focus,
      stress: this.stress,
      calm,
      avgFocus,
      avgStress,
      avgCalm,
      previousAvgStress,
      stressColor: stressBandColor(this.stress)
    }
  }
}
