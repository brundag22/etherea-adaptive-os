import { motion } from 'framer-motion'

export default function FocusMode({ metrics, emergency }) {
  const stressPercent = Math.round(metrics.stress * 100)
  const ringWidth = `${Math.max(16, stressPercent)}%`

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
            <motion.div className="h-2 rounded-full" style={{ backgroundColor: metrics.auraColor }} animate={{ width: ringWidth }} transition={{ duration: 0.3 }} />
          </div>
          <p className="mt-2 text-sm text-slate-200">Stress Signature {stressPercent}%</p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#060d1f] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Typing Speed</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-100">{metrics.wpm} WPM</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#060d1f] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mouse Frequency</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-100">{metrics.mouseRate}/s</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
