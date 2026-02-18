import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AuroraLauncher from './AuroraLauncher'
import Workspace from './Workspace'
import { OfflineMemoryProvider } from './context/OfflineMemoryContext'

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

export default function App() {
  const [phase, setPhase] = useState('launcher')
  const [permissions, setPermissions] = useState({ signalAccess: true, microphone: false, camera: false })
  const [starlightMode, setStarlightMode] = useState(false)

  const resolveGreetingByHour = (hour) => {
    if (hour >= 5 && hour < 12) return 'Good morning'
    if (hour >= 12 && hour < 17) return 'Good afternoon'
    if (hour >= 17 && hour < 23) return 'Good evening'
    return 'Late night coding?'
  }

  const greeting = useMemo(() => {
    const currentHour = new Date().getHours()
    return resolveGreetingByHour(currentHour)
  }, [])

  const finalizeOnboarding = () => {
    if (!permissions.signalAccess) return
    setPhase('workspace')
  }

  useEffect(() => {
    let keyBuffer = ''
    let resetTimer

    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      keyBuffer = `${keyBuffer}${event.key.toLowerCase()}`.slice(-7)
      if (keyBuffer.includes('etherea')) {
        setStarlightMode((prev) => !prev)
        keyBuffer = ''
      }

      window.clearTimeout(resetTimer)
      resetTimer = window.setTimeout(() => {
        keyBuffer = ''
      }, 1200)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(resetTimer)
    }
  }, [])

  return (
    <OfflineMemoryProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#02030a] text-slate-100">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.14),transparent_32%)]"
          animate={starlightMode ? { opacity: [0.24, 0.6, 0.28], scale: [1, 1.03, 1] } : { opacity: 0.16, scale: 1 }}
          transition={{ duration: 5.2, repeat: starlightMode ? Infinity : 0, ease: 'easeInOut' }}
        />

        <AnimatePresence mode="wait">
          {phase === 'launcher' && <AuroraLauncher key="launcher" greeting={greeting} onComplete={() => setPhase('onboarding')} />}

          {phase === 'onboarding' && (
            <motion.section
              key="onboarding"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Adaptive onboarding</p>
              <h1 className="mt-4 text-4xl font-semibold text-slate-100">Permission Matrix</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Etherea keeps intelligence local-first. Signal Access is required for emotional adaptation,
                while camera and microphone remain optional overlays.
              </p>
              <div className="mt-10 grid gap-4">
                {permissionCards.map((card, index) => (
                  <motion.article
                    key={card.key}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01, borderColor: 'rgba(103,232,249,0.32)' }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-2xl border border-white/10 bg-[#060d1f]/90 px-5 py-4 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium text-cyan-100">{card.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">{card.desc}</p>
                      </div>
                      <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                        <input
                          type="checkbox"
                          checked={permissions[card.key]}
                          disabled={card.mandatory}
                          onChange={(event) => setPermissions((prev) => ({ ...prev, [card.key]: event.target.checked }))}
                        />
                        {card.mandatory ? 'Required and locked' : 'Optional'}
                      </label>
                    </div>
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

          {phase === 'workspace' && <Workspace key="workspace" greeting={greeting} />}
        </AnimatePresence>
      </div>
    </OfflineMemoryProvider>
  )
}
