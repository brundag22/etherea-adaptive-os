import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AvatarEngine from './AvatarEngine'
import ControlDock from './ControlDock'
import { useEtherea } from './context/EthereaContext'

export default function Workspace() {
  const {
    avatarState,
    interactionMode,
    teachingContent,
    comicResponses,
    textInputOpen,
    closeTextInput,
    rememberResponse,
    setAvatarState,
    setVoiceVolume,
    personaStatement
  } = useEtherea()

  const [textPrompt, setTextPrompt] = useState('')

  const latestBubble = useMemo(() => comicResponses[comicResponses.length - 1], [comicResponses])

  const onHoldToSpeak = (holding) => {
    if (holding) {
      setVoiceVolume(0.7)
      return
    }

    const statement =
      interactionMode === 'text'
        ? 'I can help you with clear steps, rich hints, and flashcards in comic mode.'
        : 'Voice capture complete. I am adapting pacing for a calm and focused flow.'

    setVoiceVolume(0.32)
    rememberResponse(statement)
  }

  const submitPrompt = (event) => {
    event.preventDefault()
    if (!textPrompt.trim()) return
    const normalized = textPrompt.toLowerCase()

    if (normalized.includes('are you ai') || normalized.includes('you ai')) {
      rememberResponse(personaStatement)
      setAvatarState('empathetic')
    } else if (normalized.includes('teach')) {
      rememberResponse('Teaching mode engaged. I am sliding the knowledge rail into view.')
      setAvatarState('teaching')
    } else {
      rememberResponse(`Received: ${textPrompt}. I will respond with emotionally aware pacing and direct guidance.`)
      setAvatarState('speaking')
    }

    setTextPrompt('')
    closeTextInput()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02030a] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.26),transparent_44%),radial-gradient(circle_at_75%_0%,rgba(129,140,248,0.25),transparent_40%),radial-gradient(circle_at_30%_85%,rgba(45,212,191,0.2),transparent_36%)]" />
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(120deg,rgba(17,24,39,0.92),rgba(2,6,23,0.84),rgba(15,23,42,0.9))]"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-8 py-10">
        <motion.div animate={{ x: avatarState === 'teaching' ? -180 : 0 }} transition={{ type: 'spring', stiffness: 90, damping: 16 }} className="relative w-full">
          <AvatarEngine />

          {interactionMode === 'text' && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: [1, 1.02, 1] }}
              className="absolute left-[58%] top-[20%] w-[min(32rem,70vw)] rounded-[2rem] border border-cyan-300/40 bg-cyan-200/15 px-5 py-4 backdrop-blur-xl"
            >
              <p className="text-cyan-50">{latestBubble}</p>
              <span className="absolute -left-4 top-8 h-0 w-0 border-y-[10px] border-r-[14px] border-y-transparent border-r-cyan-200/80" />
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {avatarState === 'teaching' && (
            <motion.aside
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              className="absolute right-8 top-12 h-[calc(100%-7rem)] w-[26rem] rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl"
            >
              <h2 className="text-2xl font-semibold text-cyan-100">{teachingContent.title}</h2>
              <h3 className="mt-6 text-xs uppercase tracking-[0.3em] text-cyan-200/90">Hints</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-100">
                {teachingContent.hints.map((hint) => (
                  <li key={hint} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    {hint}
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-xs uppercase tracking-[0.3em] text-cyan-200/90">Flashcards</h3>
              <div className="mt-3 space-y-3">
                {teachingContent.flashcards.map((card) => (
                  <article key={card.front} className="rounded-xl border border-indigo-200/30 bg-indigo-500/10 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">{card.front}</p>
                    <p className="mt-1 text-sm text-indigo-50">{card.back}</p>
                  </article>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {textInputOpen && (
          <motion.form
            onSubmit={submitPrompt}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 top-10 z-50 flex w-[min(42rem,92vw)] -translate-x-1/2 gap-2 rounded-2xl border border-white/20 bg-black/60 p-3 backdrop-blur-lg"
          >
            <input
              autoFocus
              value={textPrompt}
              onChange={(event) => setTextPrompt(event.target.value)}
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none"
            />
            <button type="submit" className="rounded-xl bg-cyan-500/50 px-4 py-2 text-sm font-semibold text-cyan-50">
              Send
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <ControlDock onHoldToSpeak={onHoldToSpeak} />
    </main>
  )
}
