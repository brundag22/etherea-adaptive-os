import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function FocusMode({ emergency, onSignal }) {
  const [metrics, setMetrics] = useState({ wpm: 0, mouseErraticism: 0, stress: 0.2, auraColor: '#3B82F6' })
  const keyTimestampsRef = useRef([])
  const movementRef = useRef([])
  const signalRef = useRef(onSignal)
  const rafTokenRef = useRef(null)

  useEffect(() => {
    signalRef.current = onSignal
  }, [onSignal])

  useEffect(() => {
    let smoothedStress = 0.2

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

      const typingPressure = clamp((wpm - 36) / 64, 0, 1)
      const motionPressure = mouseErraticism / 100
      const blend = clamp(typingPressure * 0.62 + motionPressure * 0.38, 0, 1)
      smoothedStress += (blend - smoothedStress) * 0.12

      const auraColor = smoothedStress < 0.42 ? '#3B82F6' : smoothedStress < 0.7 ? '#f59e0b' : '#ef4444'
      const next = {
        wpm: Number(wpm.toFixed(1)),
        mouseErraticism: Number(mouseErraticism.toFixed(1)),
        stress: Number(smoothedStress.toFixed(2)),
        auraColor
      }

      document.documentElement.style.setProperty('--aura-ring-color', auraColor)
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

  return (
    <aside className="rounded-3xl border border-white/10 bg-[#050914] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.28em] text-slate-300">Focus Mode</h2>
        <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${emergency ? 'bg-red-400/20 text-red-100' : 'bg-cyan-400/20 text-cyan-100'}`}>
          {emergency ? 'Safe Exit' : 'Live'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#060d1f] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Aura Ring State</p>
          <div className="mt-3 h-2 w-full rounded-full bg-white/10">
            <motion.div className="h-2 rounded-full" style={{ backgroundColor: metrics.auraColor }} animate={{ width: `${Math.max(stressPercent, 8)}%` }} transition={{ duration: 0.25 }} />
          </div>
          <p className="mt-2 text-sm text-slate-200">Stress Signature {stressPercent}%</p>
        </div>

        <div className="grid gap-3">
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
