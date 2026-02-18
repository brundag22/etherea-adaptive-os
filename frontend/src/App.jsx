import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AuroraLauncher from './AuroraLauncher'
import Avatar from './Avatar'
import FocusMode from './FocusMode'

const permissionCards = [
  {
    key: 'signalAccess',
    title: 'AI Signal Access',
    desc: 'Mandatory signal bridge for EI adaptation and context-aware intelligence.',
    mandatory: true
  },
  {
    key: 'microphone',
    title: 'Microphone',
    desc: 'Optional for voice prompts and low-latency conversational workflows.',
    mandatory: false
  },
  {
    key: 'camera',
    title: 'Camera',
    desc: 'Optional visual sensing for richer collaboration and gesture intent.',
    mandatory: false
  }
]

const assistantReplies = [
  'Signal profile updated. I will keep interventions minimal and privacy-bounded.',
  'Focus corridor stabilized. You are in a high-clarity execution window.',
  'Adaptive pacing engaged. I can reduce visual stimulus if needed.'
]

export default function App() {
  const [phase, setPhase] = useState('launcher')
  const [permissions, setPermissions] = useState({ signalAccess: true, microphone: false, camera: false })
  const [avatarState, setAvatarState] = useState('welcoming')
  const [focusSignals, setFocusSignals] = useState({ wpm: 0, mouseErraticism: 0, stress: 0.2, auraColor: '#3B82F6' })
  const [escapeMode, setEscapeMode] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Etherea v3 initialized. Aura sync is active.' }])
  const [input, setInput] = useState('')

  const summary = useMemo(() => assistantReplies[(messages.length - 1) % assistantReplies.length], [messages.length])

  const handleSignal = (signal) => {
    setFocusSignals(signal)
    const mood = signal.stress < 0.42 ? 'calm' : signal.stress < 0.7 ? 'focused' : 'strained'
    setAvatarState(mood)

    fetch('/api/ei-signals/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wpm: signal.wpm, mouse_erraticism: signal.mouseErraticism, stress: signal.stress })
    }).catch(() => null)
  }

  const submitMessage = (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: `Acknowledged. I correlated "${text}" with your present flow state and updated your support cadence.` }
    ])
    setInput('')
  }

  const onEscToggle = (event) => {
    if (event.key === 'Escape') {
      setEscapeMode((prev) => !prev)
    }
  }

  useEffect(() => {
    if (phase !== 'workspace') return undefined
    window.addEventListener('keydown', onEscToggle)
    return () => window.removeEventListener('keydown', onEscToggle)
  }, [phase])

  const finalizeOnboarding = () => {
    if (!permissions.signalAccess) return
    setPhase('workspace')
    setAvatarState('calm')
  }

  return (
    <div className="min-h-screen bg-[#02030a] text-slate-100">
      <AnimatePresence mode="wait">
        {phase === 'launcher' && <AuroraLauncher key="launcher" onComplete={() => setPhase('onboarding')} />}

        {phase === 'onboarding' && (
          <motion.section
            key="onboarding"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-14"
          >
            <h1 className="mb-4 text-3xl font-semibold text-slate-100">Etherea Onboarding</h1>
            <p className="mb-8 max-w-2xl text-sm text-slate-300">Grant the required AI signal access to enter your adaptive workspace. Optional permissions remain user-controlled.</p>
            <div className="grid gap-5 md:grid-cols-3">
              {permissionCards.map((card, index) => (
                <motion.article
                  key={card.key}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.12 }}
                  className="rounded-full border border-white/10 bg-[#060d1f] px-6 py-8 shadow-[0_16px_70px_-45px_rgba(59,130,246,0.8)]"
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/80">Permission Bubble</p>
                  <h2 className="mt-2 text-lg font-medium">{card.title}</h2>
                  <p className="mt-2 text-sm text-slate-300">{card.desc}</p>
                  <label className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                    <input
                      type="checkbox"
                      checked={permissions[card.key]}
                      disabled={card.mandatory}
                      onChange={(event) => setPermissions((prev) => ({ ...prev, [card.key]: event.target.checked }))}
                    />
                    {card.mandatory ? 'Required and locked' : 'Optional'}
                  </label>
                </motion.article>
              ))}
            </div>
            <button
              type="button"
              onClick={finalizeOnboarding}
              className="mt-9 w-fit rounded-full border border-cyan-200/40 bg-cyan-300/10 px-7 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100"
            >
              Enter Etherea Workspace
            </button>
          </motion.section>
        )}

        {phase === 'workspace' && (
          <motion.section key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto grid min-h-screen w-full max-w-7xl gap-7 px-6 py-8 lg:grid-cols-[1.08fr_1fr]">
            <main className="rounded-3xl border border-white/10 bg-[#040712] p-6 shadow-[0_20px_90px_-45px_rgba(56,189,248,0.6)]">
              <header className="mb-6 border-b border-white/10 pb-5">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Etherea Version 3.0</p>
                <h2 className="mt-2 text-2xl font-semibold">Privacy-first living OS</h2>
              </header>

              <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <Avatar state={avatarState} auraColor={focusSignals.auraColor} stress={focusSignals.stress} />
                <div className="rounded-2xl border border-white/10 bg-[#060d1f] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Professional Chat</p>
                  <div className="mt-4 h-72 space-y-3 overflow-auto pr-1">
                    {messages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`rounded-xl px-3 py-2 text-sm ${message.role === 'assistant' ? 'bg-cyan-400/10 text-cyan-50' : 'bg-slate-800/80 text-slate-100'}`}>
                        {message.content}
                      </div>
                    ))}
                  </div>
                  <form className="mt-4 flex gap-2" onSubmit={submitMessage}>
                    <input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-[#040712] px-4 py-3 text-sm text-slate-100 outline-none"
                      placeholder="Ask Etherea for a concise systems insight..."
                    />
                    <button type="submit" className="rounded-xl bg-cyan-300/20 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                      Send
                    </button>
                  </form>
                  <p className="mt-4 text-xs text-slate-400">{summary}</p>
                </div>
              </div>
            </main>
            <FocusMode emergency={escapeMode} onSignal={handleSignal} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
