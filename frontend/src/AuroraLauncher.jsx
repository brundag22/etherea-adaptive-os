import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function AuroraLauncher({ onComplete }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete?.()
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [onComplete])

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-[#02030a]">
      <motion.div
        className="absolute h-[52vh] w-[52vh] rounded-full bg-cyan-400/20 blur-3xl"
        animate={{ scale: [0.6, 1.15, 0.9], opacity: [0.2, 0.7, 0.15] }}
        transition={{ duration: 2.4, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute h-[40vh] w-[40vh] rounded-full border border-cyan-200/35"
        animate={{ scale: [0.75, 1.2], rotate: [0, 40], opacity: [0.15, 0.9, 0.2] }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      />
      <motion.svg
        viewBox="0 0 220 220"
        className="relative z-10 h-56 w-56"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: [0.92, 1.03, 1] }}
        transition={{ duration: 1.4 }}
      >
        <defs>
          <linearGradient id="aurora-core" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <motion.path
          d="M32 110C32 63 67 28 110 28C152 28 188 63 188 110C188 154 152 191 110 191C66 191 32 154 32 110Z"
          fill="none"
          stroke="url(#aurora-core)"
          strokeWidth="4"
          animate={{ pathLength: [0.1, 1], opacity: [0.4, 1] }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
        />
        <motion.path
          d="M57 109C57 82 79 60 109 60C138 60 162 82 162 109C162 136 138 160 109 160C79 160 57 136 57 109Z"
          fill="none"
          stroke="#93c5fd"
          strokeOpacity="0.7"
          strokeWidth="2"
          animate={{ rotate: [0, 15, -10, 0] }}
          transition={{ duration: 2.3, ease: 'easeInOut' }}
        />
      </motion.svg>
      <p className="absolute bottom-14 text-xs uppercase tracking-[0.32em] text-cyan-100/70">Aurora Launcher</p>
    </section>
  )
}
