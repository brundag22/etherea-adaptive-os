import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useEtherea } from './context/EthereaContext'

export default function ControlDock({ onHoldToSpeak }) {
  const { interactionMode, setInteractionMode, setAvatarState, summonTextInput } = useEtherea()
  const [holding, setHolding] = useState(false)

  useEffect(() => {
    const onKeys = (event) => {
      const hotkey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (hotkey) {
        event.preventDefault()
        summonTextInput()
      }
    }

    window.addEventListener('keydown', onKeys)
    return () => window.removeEventListener('keydown', onKeys)
  }, [summonTextInput])

  return (
    <motion.div
      initial={{ y: 36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-10 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-3xl border border-white/20 bg-black/40 px-4 py-3 backdrop-blur-md"
    >
      <button
        type="button"
        onPointerDown={() => {
          setHolding(true)
          setAvatarState('listening')
          onHoldToSpeak(true)
        }}
        onPointerUp={() => {
          setHolding(false)
          setAvatarState('speaking')
          onHoldToSpeak(false)
        }}
        className={`rounded-2xl px-4 py-2 text-sm font-semibold text-cyan-100 transition ${holding ? 'animate-pulse bg-cyan-500/50' : 'bg-cyan-500/30'}`}
      >
        🎤 Hold to Speak
      </button>

      <button
        type="button"
        onClick={() => setInteractionMode(interactionMode === 'voice' ? 'text' : 'voice')}
        className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm text-slate-100"
      >
        💬
        <span>{interactionMode === 'text' ? 'Comic Mode On' : 'Comic Mode Off'}</span>
      </button>

      <button
        type="button"
        onClick={() => setAvatarState('teaching')}
        className="rounded-2xl bg-indigo-500/40 px-3 py-2 text-sm font-semibold text-indigo-100"
      >
        ↗️ Teach Me
      </button>

      <button type="button" onClick={summonTextInput} className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-slate-100">
        ⌨️ Command Bar
      </button>
    </motion.div>
  )
}
