import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const expressionMap = {
  calm: { browShift: 0, eyeScale: 1, eyeY: 84 },
  focused: { browShift: -4, eyeScale: 0.84, eyeY: 84 },
  strained: { browShift: -8, eyeScale: 0.64, eyeY: 86 },
  welcoming: { browShift: 2, eyeScale: 1.08, eyeY: 83 },
  booting: { browShift: 6, eyeScale: 0.76, eyeY: 85 }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export default function Avatar({ state, auraColor, stress, speechText, speechNonce }) {
  const expression = expressionMap[state] || expressionMap.calm
  const [mouthOpen, setMouthOpen] = useState(0.16)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [blink, setBlink] = useState(false)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const pulse = 1 + stress * 0.1
  const blinkTimeoutRef = useRef()

  useEffect(() => {
    const blinkLoop = () => {
      setBlink(true)
      blinkTimeoutRef.current = window.setTimeout(() => setBlink(false), 120)
    }

    const intervalId = window.setInterval(blinkLoop, 2800 + Math.random() * 2000)
    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(blinkTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const handlePointer = (event) => {
      const x = clamp((event.clientX / window.innerWidth - 0.5) * 10, -6, 6)
      const y = clamp((event.clientY / window.innerHeight - 0.5) * 8, -4, 4)
      setLook({ x, y })
    }

    window.addEventListener('pointermove', handlePointer)
    return () => window.removeEventListener('pointermove', handlePointer)
  }, [])

  useEffect(() => {
    if (!speechText || !speechNonce) return
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return

    const utterance = new window.SpeechSynthesisUtterance(speechText)
    utterance.rate = 1.02
    utterance.pitch = 1.08

    utterance.onstart = () => {
      setIsSpeaking(true)
      setMouthOpen(0.38)
    }

    utterance.onboundary = (event) => {
      if (event.name !== 'word') return
      const syllablePulse = 0.28 + ((event.charIndex % 6) / 8)
      setMouthOpen(clamp(syllablePulse, 0.2, 0.95))
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setMouthOpen(0.16)
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      setMouthOpen(0.16)
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)

    return () => {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setMouthOpen(0.16)
    }
  }, [speechText, speechNonce])

  const mouthPath = useMemo(() => {
    const upper = 123 - mouthOpen * 10
    const lower = 128 + mouthOpen * 14
    return `M56 126Q84 ${upper} 112 126Q84 ${lower} 56 126Z`
  }, [mouthOpen])

  const eyeHeight = blink ? 1.5 : 11 * expression.eyeScale

  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#060b1a] p-5">
      <motion.div
        animate={{
          boxShadow: [`0 0 0 10px ${auraColor}22`, `0 0 0 19px ${auraColor}66`, `0 0 0 10px ${auraColor}22`],
          scale: [1, pulse, 1]
        }}
        transition={{ duration: 1.7, repeat: Infinity }}
        className="absolute inset-8 rounded-full"
      />

      <motion.svg
        viewBox="0 0 170 190"
        className="relative z-10 h-52 w-52"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.6, repeat: Infinity }}
      >
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

        <path d={`M58 ${56 + expression.browShift}C66 ${48 + expression.browShift} 72 ${48 + expression.browShift} 80 ${56 + expression.browShift}`} stroke={auraColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d={`M90 ${56 + expression.browShift}C98 ${48 + expression.browShift} 104 ${48 + expression.browShift} 112 ${56 + expression.browShift}`} stroke={auraColor} strokeWidth="3.5" strokeLinecap="round" fill="none" />

        <motion.ellipse cx={69 + look.x} cy={expression.eyeY + look.y} rx="8" ry={eyeHeight} fill="#67e8f9" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity }} />
        <motion.ellipse cx={101 + look.x} cy={expression.eyeY + look.y} rx="8" ry={eyeHeight} fill="#67e8f9" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.14 }} />

        <path d={mouthPath} fill={isSpeaking ? '#22d3ee' : '#0891b2'} stroke="#7dd3fc" strokeWidth="2.5" />
        <path d="M84 126L84 152" stroke={auraColor} strokeWidth="3" strokeLinecap="round" />
      </motion.svg>

      <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-100/80">Emotional Sync: {state}</p>
    </div>
  )
}
