import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Avatar from './Avatar'
import FocusMode from './FocusMode'
import { useOfflineMemory } from './context/OfflineMemoryContext'

const assistantReplies = [
  'Signal profile updated. I will keep interventions minimal and privacy-bounded.',
  'Focus corridor stabilized. You are in a high-clarity execution window.',
  'Adaptive pacing engaged. I can reduce visual stimulus if needed.'
]

const offlineTeachingMemory = {
  default: {
    title: 'Adaptive Learning Sprint',
    markdown: '# Core Summary\n- Capture intent\n- Build concise pattern maps\n- Commit tiny wins\n## Recall Cue\nUse one sentence anchors after each task.',
    chart: [
      { label: 'Recall', value: 82 },
      { label: 'Clarity', value: 74 },
      { label: 'Momentum', value: 91 }
    ],
    surprise: 'A reset: drink water, then I auto-simplify your next task into 2 steps.'
  },
  architecture: {
    title: 'Offline Architecture Primer',
    markdown: '# Local-first Pipeline\n- Read from memory index\n- Render with no network hop\n- Sync async in background only when online',
    chart: [
      { label: 'Latency', value: 98 },
      { label: 'Resilience', value: 87 },
      { label: 'Trust', value: 93 }
    ],
    surprise: 'I staged a tiny architecture checklist tailored to your current topic.'
  }
}

const resolveTeachingAid = (text) => {
  const sample = text.toLowerCase()
  if (sample.includes('architecture') || sample.includes('offline')) return offlineTeachingMemory.architecture
  return offlineTeachingMemory.default
}

export default function Workspace() {
  const [avatarState, setAvatarState] = useState('calm')
  const [focusSignals, setFocusSignals] = useState({ wpm: 0, mouseErraticism: 0, stress: 0.2, auraColor: '#3B82F6' })
  const [escapeMode, setEscapeMode] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Etherea v3 initialized. Aura sync is active.' }])
  const [input, setInput] = useState('')
  const [speechText, setSpeechText] = useState('')
  const [speechNonce, setSpeechNonce] = useState(0)
  const [fullScreenAvatar, setFullScreenAvatar] = useState(false)
  const [comicMode, setComicMode] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isTeaching, setIsTeaching] = useState(false)
  const [isEmpathetic, setIsEmpathetic] = useState(false)
  const [teachingAidData, setTeachingAidData] = useState(offlineTeachingMemory.default)

  const { saveMessage, saveTeachingAid, getLatestMessages, getLatestTeachingAid } = useOfflineMemory()

  const summary = useMemo(() => assistantReplies[(messages.length - 1) % assistantReplies.length], [messages.length])

  useEffect(() => {
    getLatestMessages(10)
      .then((cached) => {
        if (cached.length) setMessages(cached.map(({ role, content }) => ({ role, content })))
      })
      .catch(() => null)

    getLatestTeachingAid()
      .then((cachedAid) => {
        if (cachedAid) setTeachingAidData(cachedAid)
      })
      .catch(() => null)
  }, [getLatestMessages, getLatestTeachingAid])

  const handleSignal = useCallback((signal) => {
    setFocusSignals(signal)
    const mood = signal.stress < 0.42 ? 'calm' : signal.stress < 0.7 ? 'focused' : 'strained'
    setAvatarState(mood)
    setIsEmpathetic(signal.stress > 0.74)
  }, [])

  const speakText = useCallback(
    (text) => {
      if (comicMode) return
      setSpeechText(text)
      setSpeechNonce((prev) => prev + 1)
    },
    [comicMode]
  )

  const submitMessage = (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text) return

    const assistantText = `Acknowledged. I correlated "${text}" with your present flow state and updated your support cadence.`
    const aid = resolveTeachingAid(text)

    setIsSearching(true)
    setIsTeaching(true)
    setTeachingAidData(aid)

    const stressWord = text.toLowerCase()
    const empatheticTrigger = stressWord.includes('sad') || stressWord.includes('stressed') || stressWord.includes('overwhelmed')
    setIsEmpathetic((prev) => prev || empatheticTrigger)

    const nextMessages = [...messages, { role: 'user', content: text }, { role: 'assistant', content: assistantText }]
    setMessages(nextMessages)
    setInput('')
    speakText(assistantText)

    saveMessage({ role: 'user', content: text }).catch(() => null)
    saveMessage({ role: 'assistant', content: assistantText }).catch(() => null)
    saveTeachingAid(aid).catch(() => null)

    window.setTimeout(() => setIsSearching(false), 900)
  }

  const onEscToggle = useCallback((event) => {
    if (event.key === 'Escape') {
      setEscapeMode((prev) => !prev)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', onEscToggle)
    return () => window.removeEventListener('keydown', onEscToggle)
  }, [onEscToggle])

  useEffect(() => {
    if (!comicMode || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
  }, [comicMode])

  return (
    <motion.section key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto grid min-h-screen w-full max-w-7xl gap-7 px-6 py-8 lg:grid-cols-[1.08fr_1fr]">
      <main className="rounded-3xl border border-white/10 bg-[#040712] p-6 shadow-[0_20px_90px_-45px_rgba(56,189,248,0.6)]">
        <header className="mb-6 border-b border-white/10 pb-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Etherea Version 3.0</p>
          <h2 className="mt-2 text-2xl font-semibold">Privacy-first living OS</h2>
        </header>

        <div className="mb-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => setFullScreenAvatar((prev) => !prev)} className="rounded-full border border-cyan-300/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-100">
            {fullScreenAvatar ? 'Exit Full Screen' : 'Full Screen Avatar'}
          </button>
          <button type="button" onClick={() => setComicMode((prev) => !prev)} className="rounded-full border border-cyan-300/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-100">
            {comicMode ? 'Text-Only Off' : 'Comic Bubble Text Mode'}
          </button>
          <button type="button" onClick={() => setIsTeaching((prev) => !prev)} className="rounded-full border border-cyan-300/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-100">
            Teaching Panel
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Avatar
            state={avatarState}
            auraColor={focusSignals.auraColor}
            stress={focusSignals.stress}
            wpm={focusSignals.wpm}
            mouseErraticism={focusSignals.mouseErraticism}
            speechText={speechText}
            speechNonce={speechNonce}
            isSearching={isSearching}
            isTeaching={isTeaching}
            isEmpathetic={isEmpathetic}
            fullScreen={fullScreenAvatar}
            comicMode={comicMode}
            bubbleText={messages[messages.length - 1]?.content}
            teachingAid={teachingAidData}
          />
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
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">{summary}</p>
              <button
                type="button"
                onClick={() => speakText(messages[messages.length - 1]?.content || 'Ready.')}
                className="rounded-full border border-cyan-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-100"
              >
                Replay Voice
              </button>
            </div>
          </div>
        </div>
      </main>
      <FocusMode emergency={escapeMode} onSignal={handleSignal} />
    </motion.section>
  )
}
