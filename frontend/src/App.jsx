import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Avatar from './Avatar'
import FocusMode from './FocusMode'

const onboardingTeam = [
  {
    name: 'Nova',
    role: 'Systems Architect',
    message: 'Welcome to Etherea. I orchestrate adaptive intelligence across your workspace.'
  },
  {
    name: 'Lyra',
    role: 'Privacy Guardian',
    message: 'Your boundaries are respected. You control every permission and every signal.'
  },
  {
    name: 'Kairo',
    role: 'Flow Mentor',
    message: 'I shape focus loops so your coding rhythm stays calm, sharp, and consistent.'
  }
]

const gradients = [
  'from-cyan-400/30 via-blue-400/20 to-indigo-400/25',
  'from-fuchsia-400/30 via-pink-400/20 to-orange-300/25',
  'from-emerald-400/30 via-lime-400/20 to-cyan-400/25'
]

const permissionCards = [
  {
    key: 'signalAccess',
    title: 'AI Signal Access',
    desc: 'Mandatory for adaptive cognition, sentiment balancing, and contextual assistance.',
    mandatory: true
  },
  {
    key: 'microphone',
    title: 'Microphone',
    desc: 'Optional voice interaction and low-latency conversational control.',
    mandatory: false
  },
  {
    key: 'camera',
    title: 'Camera',
    desc: 'Optional visual context for gesture-enhanced collaboration.',
    mandatory: false
  }
]

const professionalReplies = [
  'Summary: Refactor opportunity detected in auth utility and theme hooks.',
  'Summary: Proposed path reduces prop-drilling by centralizing workspace state.',
  'Summary: Performance uplift likely by memoizing canvas and ring recalculations.',
  'Summary: Next milestone is tightening permission UX copy and onboarding progression.'
]

export default function App() {
  const [phase, setPhase] = useState('boot')
  const [permissions, setPermissions] = useState({ signalAccess: true, microphone: false, camera: false })
  const [avatarState, setAvatarState] = useState('booting')
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Etherea online. Professional Chat Mode is active.' }])
  const [input, setInput] = useState('')
  const [focusMetrics, setFocusMetrics] = useState({ wpm: 0, mouseRate: 0, stress: 0.22, auraColor: '#3B82F6' })
  const [escapeMode, setEscapeMode] = useState(false)

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setPhase('onboarding')
      setAvatarState('welcoming')
    }, 2800)
    return () => clearTimeout(bootTimer)
  }, [])

  useEffect(() => {
    const esc = (event) => {
      if (event.key === 'Escape') {
        setEscapeMode((prev) => !prev)
      }
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  useEffect(() => {
    const keyTimes = []
    const moveTimes = []
    let stress = 0.2

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

    const tick = () => {
      const now = Date.now()
      while (keyTimes.length && now - keyTimes[0] > 60000) keyTimes.shift()
      while (moveTimes.length && now - moveTimes[0] > 10000) moveTimes.shift()
      const wpm = keyTimes.length / 5
      const mouseRate = moveTimes.length / 10
      const normalizedWpm = clamp((wpm - 36) / 44, 0, 1)
      const normalizedMouse = clamp((mouseRate - 6) / 24, 0, 1)
      const volatility = Math.abs(normalizedWpm - normalizedMouse)
      const rawStress = clamp(normalizedWpm * 0.55 + normalizedMouse * 0.35 + volatility * 0.2, 0, 1)
      stress += (rawStress - stress) * 0.18
      const auraColor = stress < 0.34 ? '#3B82F6' : stress < 0.67 ? '#F97316' : '#EF4444'
      setFocusMetrics({ wpm: Number(wpm.toFixed(1)), mouseRate: Number(mouseRate.toFixed(1)), stress: Number(stress.toFixed(2)), auraColor })
      setAvatarState(stress < 0.34 ? 'calm' : stress < 0.67 ? 'focused' : 'strained')
    }

    const onKeyDown = (event) => {
      if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Enter') {
        keyTimes.push(Date.now())
      }
    }

    const onMove = () => {
      moveTimes.push(Date.now())
    }

    const interval = window.setInterval(tick, 240)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousemove', onMove)

    return () => {
      clearInterval(interval)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  const summary = useMemo(() => {
    if (messages.length < 2) return 'Summary stream idle. Send a prompt to begin reflective analysis.'
    return professionalReplies[(messages.length - 2) % professionalReplies.length]
  }, [messages])

  const submitMessage = (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    const userMsg = { role: 'user', content: trimmed }
    const assistantMsg = {
      role: 'assistant',
      content: `Acknowledged. I analyzed "${trimmed}" and synchronized your workspace to minimize context switching.`
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
  }

  const finalizeOnboarding = () => {
    if (!permissions.signalAccess) return
    setPhase('workspace')
    setAvatarState('calm')
  }

  const updatePermission = (key, value) => {
    setPermissions((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#02030a] text-slate-100">
      <AnimatePresence mode="wait">
        {phase === 'boot' && (
          <motion.section
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex h-screen items-center justify-center overflow-hidden"
          >
            <motion.div animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.7, 0.4] }} transition={{ duration: 2.2, repeat: Infinity }} className="absolute h-[26rem] w-[26rem] rounded-full bg-cyan-500/20 blur-3xl" />
            <motion.svg viewBox="0 0 280 280" className="h-72 w-72" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 1.4 }}>
              <defs>
                <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.2" />
                </radialGradient>
              </defs>
              <circle cx="140" cy="140" r="132" fill="url(#brainGlow)" />
              <path d="M88 126C88 100 108 80 134 80C144 80 154 84 162 90C170 82 180 78 190 78C216 78 236 98 236 124C236 142 226 158 212 166C216 190 198 212 174 212C160 212 146 204 138 192C130 204 116 212 102 212C78 212 60 190 64 166C50 158 40 142 40 124C40 98 60 78 86 78C96 78 106 82 114 90C122 84 132 80 142 80" fill="none" stroke="#bae6fd" strokeWidth="6" strokeLinecap="round" />
              <path d="M106 112C118 118 126 128 128 142M174 108C164 116 156 126 154 140M138 90V188M98 154H178M116 178C126 170 150 170 162 178" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
            </motion.svg>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="absolute bottom-20 text-3xl font-semibold tracking-[0.36em] text-cyan-100">
              ETHEREA
            </motion.h1>
          </motion.section>
        )}

        {phase === 'onboarding' && (
          <motion.section key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
            <div className="grid gap-4 md:grid-cols-3">
              {onboardingTeam.map((member, idx) => (
                <motion.article key={member.name} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.15 }} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradients[idx]} p-5 backdrop-blur-xl`}>
                  <p className="text-sm text-cyan-100/90">{member.role}</p>
                  <h3 className="mt-1 text-xl font-semibold">{member.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200">{member.message}</p>
                </motion.article>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {permissionCards.map((card, idx) => (
                <motion.button key={card.key} whileTap={{ scale: 0.98 }} className={`relative overflow-hidden rounded-3xl border p-6 text-left ${permissions[card.key] ? 'border-cyan-400/70' : 'border-white/10'} bg-[#070b18]`} onClick={() => !card.mandatory && updatePermission(card.key, !permissions[card.key])}>
                  <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${gradients[idx]} blur-2xl`} />
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.mandatory ? 'Required' : 'Optional'}</p>
                  <h4 className="mt-2 text-lg font-medium text-white">{card.title}</h4>
                  <p className="mt-2 text-sm text-slate-300">{card.desc}</p>
                  <p className="mt-4 text-sm font-semibold text-cyan-200">{permissions[card.key] ? 'Enabled' : 'Disabled'}</p>
                </motion.button>
              ))}
            </div>
            <button onClick={finalizeOnboarding} className="ml-auto rounded-full bg-cyan-400 px-7 py-3 text-sm font-semibold text-[#02030a] disabled:opacity-50" disabled={!permissions.signalAccess}>
              Enter Adaptive Workspace
            </button>
          </motion.section>
        )}

        {phase === 'workspace' && (
          <motion.section key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative min-h-screen px-5 py-5 lg:px-8">
            <div className="grid min-h-[92vh] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              <FocusMode metrics={focusMetrics} emergency={escapeMode} />
              <div className="rounded-3xl border border-white/10 bg-[#040712] p-6 shadow-[0_22px_100px_-40px_rgba(56,189,248,0.5)]">
                <header className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Professional Chat Mode</p>
                    <h2 className="mt-1 text-2xl font-semibold">Adaptive Workspace</h2>
                  </div>
                  <p className="rounded-full border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs tracking-wide text-red-100">ESC Emergency Exit {escapeMode ? 'On' : 'Ready'}</p>
                </header>
                <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
                  <Avatar state={avatarState} auraColor={focusMetrics.auraColor} stress={focusMetrics.stress} />
                  <div className="rounded-2xl border border-white/10 bg-[#050a1b] p-4">
                    <div className="mb-3 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">{summary}</div>
                    <div className="mb-4 h-[360px] space-y-3 overflow-y-auto pr-2">
                      {messages.map((msg, idx) => (
                        <div key={`${msg.role}-${idx}`} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'assistant' ? 'bg-cyan-500/15 text-cyan-50' : 'ml-auto bg-indigo-500/25 text-indigo-50'}`}>
                          {msg.content}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={submitMessage} className="flex gap-3">
                      <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Describe what you need optimized..." className="flex-1 rounded-xl border border-white/15 bg-[#030614] px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/60" />
                      <button className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-[#03101c]">Sync</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {escapeMode && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/90">
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="rounded-2xl border border-red-300/30 bg-[#0a0c16] px-8 py-6 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-red-200">Emergency Exit</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Workspace Hidden</h3>
                    <p className="mt-2 text-sm text-slate-300">Press ESC to safely return.</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
