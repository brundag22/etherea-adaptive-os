import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { useEtherea } from './context/EthereaContext'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const visemeForAmplitude = (amplitude) => {
  if (amplitude < 0.2) return { top: 152, low: 158, left: 108, right: 172 }
  if (amplitude < 0.4) return { top: 149, low: 161, left: 104, right: 176 }
  if (amplitude < 0.7) return { top: 146, low: 166, left: 98, right: 182 }
  return { top: 142, low: 172, left: 92, right: 188 }
}

export default function AvatarEngine() {
  const { avatarState, stressLevel, voiceVolume, interactionMode } = useEtherea()
  const [blink, setBlink] = useState(false)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })
  const [visemeAmp, setVisemeAmp] = useState(0.25)
  const intervalRef = useRef(null)

  const breathing = useSpring(1, { stiffness: 24, damping: 14, mass: 1.25 })
  const armRotateLeft = useSpring(0, { stiffness: 130, damping: 13, mass: 0.8 })
  const armRotateRight = useSpring(0, { stiffness: 130, damping: 13, mass: 0.8 })
  const auraSpin = useSpring(0, { stiffness: 20, damping: 12 })
  const auraExpand = useTransform(() => 12 + voiceVolume * 42)

  useEffect(() => {
    let up = true
    const pulse = window.setInterval(() => {
      breathing.set(up ? 1.02 : 1)
      up = !up
    }, 2000)
    return () => window.clearInterval(pulse)
  }, [breathing])

  useEffect(() => {
    if (avatarState === 'speaking') {
      armRotateLeft.set(-24)
      armRotateRight.set(26)
      const wave = window.setInterval(() => {
        armRotateLeft.set(-12 - Math.random() * 20)
        armRotateRight.set(10 + Math.random() * 24)
      }, 380)
      return () => window.clearInterval(wave)
    }

    if (avatarState === 'listening') {
      armRotateLeft.set(-6)
      armRotateRight.set(6)
      return
    }

    armRotateLeft.set(0)
    armRotateRight.set(0)
  }, [avatarState, armRotateLeft, armRotateRight])

  useEffect(() => {
    let blinkStop = false
    const schedule = () => {
      const ms = 1600 + Math.random() * 2800
      intervalRef.current = window.setTimeout(() => {
        if (blinkStop) return
        setBlink(true)
        window.setTimeout(() => setBlink(false), 120)
        schedule()
      }, ms)
    }
    schedule()
    return () => {
      blinkStop = true
      if (intervalRef.current) window.clearTimeout(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    const look = window.setInterval(() => {
      const jitter = 1 + stressLevel * 1.8
      setEyeOffset({ x: (Math.random() * 5 - 2.5) * jitter, y: (Math.random() * 2 - 1) * jitter })
    }, 700)
    return () => window.clearInterval(look)
  }, [stressLevel])

  useEffect(() => {
    if (interactionMode === 'text') {
      setVisemeAmp(0.16)
      return
    }

    const tick = window.setInterval(() => {
      const freqBin = Math.sin(Date.now() / 240) * 0.5 + 0.5
      const combined = clamp(freqBin * 0.7 + voiceVolume * 0.6, 0.1, 1)
      setVisemeAmp(combined)
    }, 90)
    return () => window.clearInterval(tick)
  }, [interactionMode, voiceVolume])

  useEffect(() => {
    const spin = window.setInterval(() => {
      auraSpin.set((auraSpin.get() + 8) % 360)
    }, 60)
    return () => window.clearInterval(spin)
  }, [auraSpin])

  const mouth = useMemo(() => {
    const shape = visemeForAmplitude(visemeAmp)
    return `M${shape.left} 156 Q140 ${shape.top} ${shape.right} 156 Q140 ${shape.low} ${shape.left} 156 Z`
  }, [visemeAmp])

  const eyeHeight = blink ? 2 : 12

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute h-[24rem] w-[24rem] rounded-full"
        style={{
          rotate: auraSpin,
          boxShadow: useTransform(auraExpand, (value) => `0 0 ${value}px ${value / 1.8}px rgba(34,211,238,0.55)`),
          background:
            'conic-gradient(from 140deg, rgba(20,184,166,0.1), rgba(59,130,246,0.72), rgba(129,140,248,0.6), rgba(20,184,166,0.1))'
        }}
      />

      <motion.svg viewBox="0 0 280 360" className="relative z-10 h-[28rem] w-[20rem]" style={{ scale: breathing }}>
        <defs>
          <linearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="42%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        <g id="torso" transform="translate(55 166)">
          <path d="M33 16C52 -4 108 -4 127 16L146 110C120 145 60 145 14 110Z" fill="url(#chrome)" opacity="0.8" />
          <path d="M35 36C56 20 104 20 125 36L133 94C110 118 68 118 27 94Z" fill="#0b1732" opacity="0.8" />
        </g>

        <g id="left-arm" transform="translate(66 193)">
          <motion.path
            d="M0 0C-28 20 -38 58 -22 95C-10 122 17 134 30 112C38 99 24 80 17 66C10 50 18 24 31 11"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="14"
            strokeLinecap="round"
            style={{ rotate: armRotateLeft, transformOrigin: '30px 20px' }}
          />
        </g>

        <g id="right-arm" transform="translate(214 193)">
          <motion.path
            d="M0 0C28 20 38 58 22 95C10 122 -17 134 -30 112C-38 99 -24 80 -17 66C-10 50 -18 24 -31 11"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="14"
            strokeLinecap="round"
            style={{ rotate: armRotateRight, transformOrigin: '-30px 20px' }}
          />
        </g>

        <g id="head" transform="translate(60 40)">
          <path d="M22 24C50 -4 138 -4 166 24C194 52 194 124 166 152C138 180 50 180 22 152C-6 124 -6 52 22 24Z" fill="#0b1226" />
          <path d="M38 34C60 14 128 14 150 34C172 54 172 122 150 142C128 162 60 162 38 142C16 122 16 54 38 34Z" fill="url(#chrome)" opacity="0.42" />
          <path d="M74 98C74 92 80 86 86 86C93 86 98 92 98 98V100C98 106 93 112 86 112C80 112 74 106 74 100Z" fill="#38bdf8" transform={`translate(${eyeOffset.x} ${eyeOffset.y}) scale(1 ${eyeHeight / 12})`} />
          <path d="M142 98C142 92 148 86 154 86C161 86 166 92 166 98V100C166 106 161 112 154 112C148 112 142 106 142 100Z" fill="#38bdf8" transform={`translate(${eyeOffset.x} ${eyeOffset.y}) scale(1 ${eyeHeight / 12})`} />
          <path d={mouth} fill="#67e8f9" opacity="0.9" />
        </g>
      </motion.svg>
    </div>
  )
}
