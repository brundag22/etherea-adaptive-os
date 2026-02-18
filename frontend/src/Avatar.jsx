import { useEffect, useMemo, useState } from 'react'
import { motion, useMotionTemplate, useSpring } from 'framer-motion'

const expressionMap = {
  calm: { browShift: 0, browCurve: 0, eyeScale: 1, eyeY: 84 },
  focused: { browShift: -4, browCurve: -3, eyeScale: 0.88, eyeY: 84 },
  strained: { browShift: -8, browCurve: -7, eyeScale: 0.62, eyeY: 86 },
  welcoming: { browShift: 2, browCurve: 1, eyeScale: 1.08, eyeY: 83 },
  booting: { browShift: 6, browCurve: 4, eyeScale: 0.76, eyeY: 85 }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const getVisemeFromWord = (word = '') => {
  const sample = word.toLowerCase()
  if (/\b(f|v)\w*/.test(sample)) return 'fv'
  if (/\b(m|b|p)\w*/.test(sample)) return 'closed'
  if (/[ou]/.test(sample)) return 'round'
  if (/[aei]/.test(sample)) return 'open'
  return 'neutral'
}

const mouthShapes = {
  neutral: { open: 0.22, width: 1 },
  open: { open: 0.95, width: 0.9 },
  round: { open: 0.72, width: 0.72 },
  fv: { open: 0.42, width: 1.15 },
  closed: { open: 0.12, width: 1.05 }
}

const visemeHandEnergy = {
  neutral: 0.08,
  open: 0.62,
  round: 0.44,
  fv: 0.31,
  closed: 0.18
}

const markdownToLines = (source = '') => source.split('\n').filter(Boolean)

export default function Avatar({
  state,
  auraColor,
  stress,
  speechText,
  speechNonce,
  wpm = 0,
  mouseErraticism = 0,
  isSearching = false,
  isTeaching = false,
  isEmpathetic = false,
  fullScreen = false,
  comicMode = false,
  bubbleText = '',
  teachingAid
}) {
  const expression = expressionMap[state] || expressionMap.calm
  const [mouthOpen, setMouthOpen] = useState(0.2)
  const [mouthWidth, setMouthWidth] = useState(1)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [blink, setBlink] = useState(false)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const [viseme, setViseme] = useState('neutral')

  const auraScale = useSpring(1, { stiffness: 120, damping: 18, mass: 0.8 })
  const auraSpread = useSpring(16, { stiffness: 90, damping: 18 })
  const auraOpacity = useSpring(0.38, { stiffness: 90, damping: 18 })
  const eyeHeight = blink ? 1.4 : 11 * expression.eyeScale * (stress > 0.75 ? 0.72 : stress < 0.28 ? 1.16 : 1)
  const mouthSpringOpen = useSpring(mouthOpen, { stiffness: 230, damping: 22 })
  const mouthSpringWidth = useSpring(mouthWidth, { stiffness: 210, damping: 24 })
  const jawDrop = useMotionTemplate`${mouthSpringOpen}`

  const auraShadow = useMotionTemplate`0 0 0 ${auraSpread}px ${auraColor}${auraOpacity}`

  const handEnergy = isSpeaking ? visemeHandEnergy[viseme] ?? 0.2 : 0
  const leftHandLift = -(6 + handEnergy * 14)
  const rightHandLift = -(4 + handEnergy * 11)

  useEffect(() => {
    const combinedLoad = clamp(stress * 0.6 + (wpm / 120) * 0.25 + (mouseErraticism / 100) * 0.35, 0, 1)
    auraScale.set(1 + combinedLoad * 0.22)
    auraSpread.set(12 + combinedLoad * 14)
    auraOpacity.set(0.25 + combinedLoad * 0.48)
  }, [auraOpacity, auraScale, auraSpread, mouseErraticism, stress, wpm])

  useEffect(() => {
    let blinkTimer
    let nextBlinkTimer

    const scheduleBlink = () => {
      setBlink(true)
      blinkTimer = window.setTimeout(() => setBlink(false), 120 + Math.random() * 50)
      nextBlinkTimer = window.setTimeout(scheduleBlink, 1800 + Math.random() * 3200)
    }

    nextBlinkTimer = window.setTimeout(scheduleBlink, 1100)

    return () => {
      window.clearTimeout(blinkTimer)
      window.clearTimeout(nextBlinkTimer)
    }
  }, [])

  useEffect(() => {
    const randomLook = () => {
      const stressWeight = clamp(stress * 1.5, 0.3, 1.2)
      const nextX = (Math.random() * 2 - 1) * 5 * stressWeight
      const nextY = (Math.random() * 2 - 1) * 3.5 * stressWeight
      setLook({ x: nextX, y: nextY })
    }

    randomLook()
    const interval = window.setInterval(randomLook, 950 + Math.random() * 900)
    return () => window.clearInterval(interval)
  }, [stress])

  useEffect(() => {
    if (comicMode) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    if (!speechText || !speechNonce) return
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return

    const utterance = new window.SpeechSynthesisUtterance(speechText)
    utterance.rate = 1.02
    utterance.pitch = 1.08

    const syncViseme = (shapeKey) => {
      const shape = mouthShapes[shapeKey] || mouthShapes.neutral
      setViseme(shapeKey)
      setMouthOpen(shape.open)
      setMouthWidth(shape.width)
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      syncViseme('open')
    }

    utterance.onboundary = (event) => {
      if (event.name !== 'word') return
      const fragment = speechText.slice(event.charIndex, event.charIndex + (event.charLength || 6))
      const shapeKey = getVisemeFromWord(fragment)
      syncViseme(shapeKey)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      syncViseme('neutral')
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      syncViseme('neutral')
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)

    return () => {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      syncViseme('neutral')
    }
  }, [comicMode, speechNonce, speechText])

  const mouthPath = useMemo(() => {
    const open = clamp(mouthOpen, 0.08, 1)
    const widthScale = clamp(mouthWidth, 0.68, 1.2)
    const left = 56 - (widthScale - 1) * 10
    const right = 112 + (widthScale - 1) * 10
    const upper = 123 - open * 10
    const lower = 128 + open * 16
    return `M${left} 126Q84 ${upper} ${right} 126Q84 ${lower} ${left} 126Z`
  }, [mouthOpen, mouthWidth])

  const leftBrowCalm = `M58 ${56 + expression.browShift}C66 ${49 + expression.browCurve} 72 ${49 + expression.browCurve} 80 ${56 + expression.browShift}`
  const leftBrowStress = `M58 ${52 + expression.browShift}C66 ${43 + expression.browCurve} 72 ${42 + expression.browCurve} 80 ${54 + expression.browShift}`
  const rightBrowCalm = `M90 ${56 + expression.browShift}C98 ${49 + expression.browCurve} 104 ${49 + expression.browCurve} 112 ${56 + expression.browShift}`
  const rightBrowStress = `M90 ${52 + expression.browShift}C98 ${43 + expression.browCurve} 104 ${42 + expression.browCurve} 112 ${54 + expression.browShift}`

  return (
    <div className={fullScreen ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#01040f] px-5 py-7' : 'relative'}>
      <div className="relative flex w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#060b1a] p-5">
        <motion.div
          style={{ boxShadow: auraShadow, scale: auraScale }}
          className="absolute inset-8 rounded-full"
        />

        {comicMode && bubbleText && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: [1, 1.03, 1] }}
            transition={{ duration: 0.45 }}
            className="absolute left-1/2 top-4 z-30 w-[min(90%,32rem)] -translate-x-1/2 rounded-[2rem] border border-cyan-300/40 bg-cyan-100/15 px-5 py-3 text-sm leading-relaxed text-cyan-50 shadow-[0_10px_40px_-18px_rgba(34,211,238,0.95)] backdrop-blur-xl"
          >
            <p>{bubbleText}</p>
          </motion.div>
        )}

        <motion.svg viewBox="0 0 240 420" className="relative z-10 h-[25rem] w-56" animate={{ y: [0, -2.5, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}>
          <defs>
            <linearGradient id="faceShell" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="visor" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="frame" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.78" />
            </linearGradient>
          </defs>

          <motion.g animate={{ scaleY: [1, 1.023, 1] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '120px 220px' }}>
            <path d="M84 16C121 16 148 41 148 78V116C148 151 122 174 84 174C46 174 20 151 20 116V78C20 41 47 16 84 16Z" fill="url(#faceShell)" transform="translate(36 10)" />
            <path d="M44 61C44 47 55 36 69 36H99C113 36 124 47 124 61V96C124 109 113 120 99 120H69C55 120 44 109 44 96V61Z" fill="url(#visor)" transform="translate(36 10)" />

            <motion.path d={leftBrowCalm} animate={{ d: stress > 0.66 ? leftBrowStress : leftBrowCalm }} transition={{ duration: 0.35 }} stroke={auraColor} strokeWidth="3.5" strokeLinecap="round" fill="none" transform="translate(36 10)" />
            <motion.path d={rightBrowCalm} animate={{ d: stress > 0.66 ? rightBrowStress : rightBrowCalm }} transition={{ duration: 0.35 }} stroke={auraColor} strokeWidth="3.5" strokeLinecap="round" fill="none" transform="translate(36 10)" />

            <motion.ellipse cx={105 + look.x} cy={expression.eyeY + look.y + 10} rx="8" ry={eyeHeight} fill="#67e8f9" animate={{ opacity: [0.82, 1, 0.82] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <motion.ellipse cx={137 + look.x} cy={expression.eyeY + look.y + 10} rx="8" ry={eyeHeight} fill="#67e8f9" animate={{ opacity: [0.82, 1, 0.82] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.14 }} />

            <motion.path d={mouthPath} fill={isSpeaking ? '#22d3ee' : '#0891b2'} stroke="#7dd3fc" strokeWidth="2.5" style={{ transformBox: 'fill-box', transformOrigin: 'center', scaleY: jawDrop }} transform="translate(36 10)" />
            <path d="M120 136L120 174" stroke={auraColor} strokeWidth="3" strokeLinecap="round" />

            <motion.path
              d="M80 176C95 166 145 166 160 176L168 260C162 276 77 276 72 260Z"
              fill="url(#frame)"
              animate={{ scaleY: [1, 1.04, 1], y: [0, -1, 0] }}
              transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '120px 220px' }}
            />

            <motion.rect x="103" y="192" width="34" height="8" rx="4" fill="#0f172a" animate={{ opacity: [0.45, 0.88, 0.45] }} transition={{ duration: 1.8, repeat: Infinity }} />
          </motion.g>

          <motion.g
            animate={isSpeaking ? { rotate: [-7, -11 - handEnergy * 3, -8], y: [0, leftHandLift, -2] } : { rotate: [-2, 1.4, -2], y: [0, -2, 0] }}
            transition={{ duration: isSpeaking ? 0.62 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '88px 192px' }}
          >
            <rect x="74" y="182" width="18" height="76" rx="9" fill="#94a3b8" />
            <circle cx="84" cy="262" r="9" fill="#cbd5e1" />
          </motion.g>

          <motion.g
            animate={isSpeaking ? { rotate: [7, 10 + handEnergy * 3, 8], y: [0, rightHandLift, -1] } : { rotate: [2, -1, 2], y: [0, -1.2, 0] }}
            transition={{ duration: isSpeaking ? 0.67 : 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.08 }}
            style={{ transformOrigin: '152px 192px' }}
          >
            <rect x="148" y="182" width="18" height="76" rx="9" fill="#94a3b8" />
            <circle cx="157" cy="262" r="9" fill="#cbd5e1" />
          </motion.g>

          {isSearching && (
            <motion.g initial={{ opacity: 0, y: 16, rotate: -12 }} animate={{ opacity: 1, y: [8, -2, 6], rotate: [-12, -2, -10] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
              <rect x="126" y="226" width="54" height="36" rx="4" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
              <rect x="126" y="262" width="60" height="5" rx="2" fill="#64748b" />
            </motion.g>
          )}

          <motion.g animate={{ x: [0, -1.5, 0, 1.2, 0], y: [0, 1, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}>
            <rect x="96" y="268" width="18" height="88" rx="9" fill="#94a3b8" />
            <motion.rect
              x="88"
              y="354"
              width="34"
              height="13"
              rx="6"
              fill="#0f172a"
              animate={{ y: [354, 356, 354] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>

          <motion.g animate={{ x: [0, 1.6, 0, -1, 0], y: [0, 0, -1.6, 0] }} transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}>
            <rect x="126" y="268" width="18" height="88" rx="9" fill="#94a3b8" />
            <motion.rect
              x="118"
              y="354"
              width="34"
              height="13"
              rx="6"
              fill="#0f172a"
              animate={{ y: [354, 351.5, 354, 355, 354] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.8 }}
            />
          </motion.g>

          {isEmpathetic && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.8, repeat: Infinity }}>
              <circle cx="72" cy="62" r="6" fill="#fb7185" />
              <circle cx="166" cy="56" r="5" fill="#fda4af" />
              <circle cx="188" cy="88" r="4" fill="#f9a8d4" />
            </motion.g>
          )}
        </motion.svg>

        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-100/80">Emotional Sync: {state} • Viseme: {viseme}</p>

        {isEmpathetic && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl border border-rose-200/40 bg-rose-100/10 px-4 py-3 text-center text-sm text-rose-100 backdrop-blur-lg">
            I sensed stress. I prepared a personalized micro-break: {teachingAid?.surprise || '2-minute breathing + task slicing support.'}
          </motion.div>
        )}

        {isTeaching && (
          <motion.aside
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-4 top-8 z-20 w-[min(35rem,44vw)] rounded-3xl border border-cyan-200/30 bg-white/10 p-5 text-slate-100 shadow-[0_30px_80px_-35px_rgba(34,211,238,1)] backdrop-blur-xl"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Offline Teaching Aid</p>
            <h3 className="mt-2 text-xl font-semibold">{teachingAid?.title || 'Structured learning module'}</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-100/95">
              {markdownToLines(teachingAid?.markdown).map((line, index) => (
                <p key={`mk-${index}`} className={line.startsWith('#') ? 'font-semibold text-cyan-50' : ''}>
                  {line.replace(/^#+\s*/, '')}
                </p>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(teachingAid?.chart || []).map((bar, index) => (
                <div key={`${bar.label}-${index}`} className="rounded-xl border border-white/20 bg-slate-900/35 p-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300">{bar.label}</p>
                  <div className="mt-2 h-20 rounded-lg bg-slate-950/50 p-1">
                    <motion.div className="h-full rounded-md bg-cyan-300/80" initial={{ height: 0 }} animate={{ height: `${clamp(bar.value, 8, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </div>
    </div>
  )
}
