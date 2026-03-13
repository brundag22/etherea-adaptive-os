import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { DynamicFocusTracker } from './lib/focusTracker'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const pct = (value) => `${Math.round(value * 100)}%`

export default function FocusMode({ emergency, onSignal }) {
  const [metrics, setMetrics] = useState({
    wpm: 0,
    mouseErraticism: 0,
    focus: 0.55,
    stress: 0.2,
    calm: 0.6,
    avgFocus: 0.55,
    avgStress: 0.2,
    avgCalm: 0.6,
    previousAvgStress: 0.2,
    auraColor: '#60a5fa'
  })

  const keyTimestampsRef = useRef([])
  const movementRef = useRef([])
  const trackerRef = useRef(new DynamicFocusTracker())
  const signalRef = useRef(onSignal)
  const rafTokenRef = useRef(null)

  useEffect(() => {
    signalRef.current = onSignal
  }, [onSignal])

  useEffect(() => {
    const trackTyping = (event) => {
      if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Enter') {
        keyTimestampsRef.current.push(Date.now())
      }
    }

    const trackMouse = (event) => {
      if (rafTokenRef.current !== null) return
      rafTokenRef.current = window.requestAnimationFrame(() => {
        const now = Date.now()
        const points = movementRef.current
        const previous = points[points.length - 1]
        const dx = previous ? event.clientX - previous.x : 0
        const dy = previous ? event.clientY - previous.y : 0
        const dt = previous ? Math.max(now - previous.t, 1) : 16
        const speed = Math.hypot(dx, dy) / dt
        const heading = Math.atan2(dy, dx)
        const headingChange = previous ? Math.abs(heading - previous.heading) : 0
        points.push({ t: now, x: event.clientX, y: event.clientY, speed, heading, headingChange })
        rafTokenRef.current = null
      })
    }

    const evaluate = () => {
      const now = Date.now()
      const keyLog = keyTimestampsRef.current
      const mouseLog = movementRef.current

      while (keyLog.length && now - keyLog[0] > 60000) keyLog.shift()
      while (mouseLog.length && now - mouseLog[0].t > 12000) mouseLog.shift()

      const wpm = keyLog.length / 5
      const recentMotions = mouseLog.filter((sample) => now - sample.t <= 4000)
      const jitter = recentMotions.reduce((sum, sample) => sum + sample.headingChange, 0) / Math.max(recentMotions.length, 1)
      const avgSpeed = recentMotions.reduce((sum, sample) => sum + sample.speed, 0) / Math.max(recentMotions.length, 1)
      const mouseErraticism = clamp((jitter * 0.35 + avgSpeed * 6.5) * 100, 0, 100)

      const focusSignal = clamp((1 - mouseErraticism / 100) * 0.55 + clamp((75 - wpm) / 75, 0, 1) * 0.45, 0, 1)
      const stressSignal = clamp(clamp((wpm - 30) / 80, 0, 1) * 0.58 + (mouseErraticism / 100) * 0.42, 0, 1)
      const snapshot = trackerRef.current.ingest({ focusSignal, stressSignal })

      const next = {
        wpm: Number(wpm.toFixed(1)),
        mouseErraticism: Number(mouseErraticism.toFixed(1)),
        ...snapshot,
        auraColor: snapshot.stressColor
      }

      document.documentElement.style.setProperty('--aura-ring-color', snapshot.stressColor)
      setMetrics(next)
      signalRef.current?.(next)
    }

    window.addEventListener('keydown', trackTyping)
    window.addEventListener('mousemove', trackMouse, { passive: true })
    const timer = window.setInterval(evaluate, 220)

    return () => {
      window.removeEventListener('keydown', trackTyping)
      window.removeEventListener('mousemove', trackMouse)
      if (rafTokenRef.current !== null) {
        window.cancelAnimationFrame(rafTokenRef.current)
      }
      window.clearInterval(timer)
    }
  }, [])

  const stressPercent = useMemo(() => Math.round(metrics.stress * 100), [metrics.stress])
  const calmingPrompt = useMemo(() => {
    if (stressPercent >= 80) return 'High strain. Pause for 90 seconds and slow your breathing before the next step.'
    if (stressPercent >= 45) return 'Load rising. Keep one tab, one task, one intention for the next 5 minutes.'
    return 'Calm state stable. Keep the current pace and checkpoint progress every few minutes.'
  }, [stressPercent])

  return (
    <aside className="rounded-3xl border border-white/10 bg-[#050914]/90 p-5 backdrop-blur-xl">
      <div className="mb-4 h-2 w-full rounded-full" style={{ backgroundColor: metrics.auraColor }} />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.28em] text-slate-300">Focus Tracker</h2>
        <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${emergency ? 'bg-red-400/20 text-red-100' : 'bg-cyan-400/20 text-cyan-100'}`}>
          {emergency ? 'Safe Exit' : 'Live'}
        </span>
      </div>

      <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-[#070f23] p-4">
        <motion.div
          className="absolute -left-10 -top-10 h-40 w-40 rounded-full blur-2xl"
          style={{ backgroundColor: `${metrics.auraColor}66` }}
          animate={{ x: [0, 30, -10, 0], y: [0, -10, 20, 0], scale: [1, 1.12, 0.96, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative space-y-2">
          <p className="text-sm text-slate-100">Focus {pct(metrics.focus)} · Stress {pct(metrics.stress)} · Calm {pct(metrics.calm)}</p>
          <p className="text-xs text-slate-300">Average: Focus {pct(metrics.avgFocus)} · Stress {pct(metrics.avgStress)} · Calm {pct(metrics.avgCalm)}</p>
          <p className="text-xs text-slate-400">Previous average stress: {pct(metrics.previousAvgStress)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-[#060d1f] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Stress Signature</p>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
            <motion.div className="h-2 rounded-full" style={{ backgroundColor: metrics.auraColor }} animate={{ width: `${Math.max(stressPercent, 8)}%` }} transition={{ duration: 0.25 }} />
          </div>
          <p className="mt-2 text-sm text-slate-200">{stressPercent}%</p>
          <p className="mt-2 text-xs text-slate-300">{calmingPrompt}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#060d1f] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Typing Speed</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-100">{metrics.wpm} WPM</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#060d1f] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mouse Erraticism</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-100">{metrics.mouseErraticism}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
