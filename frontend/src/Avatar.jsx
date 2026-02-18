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

export default function Avatar({ state, auraColor, stress, speechText, speechNonce, wpm = 0, mouseErraticism = 0 }) {
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
  }, [speechNonce, speechText])

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
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#060b1a] p-5">
      <motion.div
        style={{ boxShadow: auraShadow, scale: auraScale }}
        className="absolute inset-8 rounded-full"
      />

      <motion.svg viewBox="0 0 170 190" className="relative z-10 h-52 w-52" animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
        <defs>
          <linearGradient id="faceShell" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="visor" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        <path d="M84 16C121 16 148 41 148 78V116C148 151 122 174 84 174C46 174 20 151 20 116V78C20 41 47 16 84 16Z" fill="url(#faceShell)" />
        <path d="M44 61C44 47 55 36 69 36H99C113 36 124 47 124 61V96C124 109 113 120 99 120H69C55 120 44 109 44 96V61Z" fill="url(#visor)" />

        <motion.path d={leftBrowCalm} animate={{ d: stress > 0.66 ? leftBrowStress : leftBrowCalm }} transition={{ duration: 0.35 }} stroke={auraColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <motion.path d={rightBrowCalm} animate={{ d: stress > 0.66 ? rightBrowStress : rightBrowCalm }} transition={{ duration: 0.35 }} stroke={auraColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />

        <motion.ellipse cx={69 + look.x} cy={expression.eyeY + look.y} rx="8" ry={eyeHeight} fill="#67e8f9" animate={{ opacity: [0.82, 1, 0.82] }} transition={{ duration: 1.2, repeat: Infinity }} />
        <motion.ellipse cx={101 + look.x} cy={expression.eyeY + look.y} rx="8" ry={eyeHeight} fill="#67e8f9" animate={{ opacity: [0.82, 1, 0.82] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.14 }} />

        <motion.path d={mouthPath} fill={isSpeaking ? '#22d3ee' : '#0891b2'} stroke="#7dd3fc" strokeWidth="2.5" style={{ transformBox: 'fill-box', transformOrigin: 'center', scaleY: jawDrop }} />
        <path d="M84 126L84 152" stroke={auraColor} strokeWidth="3" strokeLinecap="round" />
      </motion.svg>

      <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-100/80">Emotional Sync: {state} • Viseme: {viseme}</p>
    </div>
  )
}
