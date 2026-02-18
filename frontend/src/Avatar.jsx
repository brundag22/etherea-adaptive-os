import { motion } from 'framer-motion'

const expressionMap = {
  calm: { eyeScale: 1, mouthCurve: 'M58 118C70 130 94 130 106 118', browShift: 0, cheek: 0.18 },
  focused: { eyeScale: 0.8, mouthCurve: 'M58 122C72 114 92 114 106 122', browShift: -4, cheek: 0.25 },
  strained: { eyeScale: 0.62, mouthCurve: 'M58 126C74 104 90 104 106 126', browShift: -8, cheek: 0.34 },
  welcoming: { eyeScale: 1.08, mouthCurve: 'M56 114C72 134 92 134 108 114', browShift: 2, cheek: 0.2 },
  booting: { eyeScale: 0.7, mouthCurve: 'M60 124L104 124', browShift: 6, cheek: 0.1 }
}

export default function Avatar({ state, auraColor, stress }) {
  const expression = expressionMap[state] || expressionMap.calm
  const pulse = 1 + stress * 0.1

  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#060b1a] p-5">
      <motion.div animate={{ boxShadow: [`0 0 0 10px ${auraColor}20`, `0 0 0 18px ${auraColor}45`, `0 0 0 10px ${auraColor}20`], scale: [1, pulse, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="absolute inset-8 rounded-full" />
      <motion.svg viewBox="0 0 170 190" className="relative z-10 h-52 w-52" animate={{ y: [0, -4, 0] }} transition={{ duration: 2.6, repeat: Infinity }}>
        <defs>
          <linearGradient id="faceShell" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="visor" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="innerGlow" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={auraColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M84 16C121 16 148 41 148 78V116C148 151 122 174 84 174C46 174 20 151 20 116V78C20 41 47 16 84 16Z" fill="url(#faceShell)" />
        <path d="M44 61C44 47 55 36 69 36H99C113 36 124 47 124 61V96C124 109 113 120 99 120H69C55 120 44 109 44 96V61Z" fill="url(#visor)" />
        <path d="M44 61C44 47 55 36 69 36H99C113 36 124 47 124 61V96C124 109 113 120 99 120H69C55 120 44 109 44 96V61Z" fill="url(#innerGlow)" />
        <path d={`M58 ${56 + expression.browShift}C66 ${49 + expression.browShift} 72 ${49 + expression.browShift} 80 ${56 + expression.browShift}`} stroke={auraColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d={`M90 ${56 + expression.browShift}C98 ${49 + expression.browShift} 104 ${49 + expression.browShift} 112 ${56 + expression.browShift}`} stroke={auraColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <motion.ellipse cx="69" cy="82" rx="8" ry={10 * expression.eyeScale} fill="#67e8f9" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.3, repeat: Infinity }} />
        <motion.ellipse cx="101" cy="82" rx="8" ry={10 * expression.eyeScale} fill="#67e8f9" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.3, repeat: Infinity, delay: 0.15 }} />
        <path d={expression.mouthCurve} stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" fill="none" />
        <motion.path d="M84 126L84 152" stroke={auraColor} strokeWidth="3" strokeLinecap="round" animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <path d="M50 150C63 159 104 159 118 150" stroke="#0f172a" strokeOpacity={expression.cheek} strokeWidth="6" strokeLinecap="round" fill="none" />
      </motion.svg>
      <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-100/80">Emotional Sync: {state}</p>
    </div>
  )
}
