import { Component, ReactNode, useEffect, useMemo, useRef } from 'react'


const IconBase = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const MenuIcon = () => <IconBase><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></IconBase>
const NotesIcon = () => <IconBase><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 9h6" /><path d="M9 13h6" /></IconBase>
const SettingsIcon = () => <IconBase><circle cx="12" cy="12" r="3" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M4.9 4.9l2.1 2.1" /><path d="M17 17l2.1 2.1" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="M4.9 19.1L7 17" /><path d="M17 7l2.1-2.1" /></IconBase>
const BrainIcon = () => <IconBase><path d="M9 6a3 3 0 1 1 6 0" /><path d="M8 9a3 3 0 1 0 0 6" /><path d="M16 9a3 3 0 1 1 0 6" /><path d="M9 12h6" /><path d="M10 15c0 2 1 3 2 3s2-1 2-3" /></IconBase>

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="aurora-panel error-state">
          <h2>Visual shell recovered</h2>
          <p>We hit a rendering issue, but the desktop remains online.</p>
        </div>
      )
    }

    return this.props.children
  }
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const makeParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 1,
    })

    const seedParticles = () => {
      particles.current = Array.from({ length: 100 }, makeParticle)
    }

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles.current) {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 8)
        glow.addColorStop(0, 'rgba(148, 248, 255, 0.95)')
        glow.addColorStop(1, 'rgba(148, 248, 255, 0)')

        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius * 8, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(194, 145, 255, 0.95)'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < particles.current.length; i += 1) {
        for (let j = i + 1; j < particles.current.length; j += 1) {
          const a = particles.current[i]
          const b = particles.current[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            ctx.strokeStyle = `rgba(120, 232, 255, ${0.16 - dist / 900})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      raf = window.requestAnimationFrame(draw)
    }

    resize()
    seedParticles()
    draw()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />
}

function Avatar() {
  return (
    <div className="avatar-shell" aria-label="Agent avatar">
      <svg viewBox="0 0 380 420" role="img">
        <defs>
          <radialGradient id="skinGradient" cx="40%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#ffd6c2" />
            <stop offset="55%" stopColor="#f6b89d" />
            <stop offset="100%" stopColor="#d88d78" />
          </radialGradient>
          <radialGradient id="irisL" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#8cf2ff" />
            <stop offset="100%" stopColor="#2e6cff" />
          </radialGradient>
          <radialGradient id="irisR" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#9af7ff" />
            <stop offset="100%" stopColor="#4f46e5" />
          </radialGradient>
          <filter id="blushBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <path
          d="M190 88 C128 88 86 132 82 194 C78 240 95 278 123 311 C148 340 170 351 190 352 C210 352 232 340 257 311 C285 278 302 240 298 194 C294 132 252 88 190 88 Z"
          fill="url(#skinGradient)"
        />
        <ellipse cx="134" cy="236" rx="28" ry="13" fill="#ff9ba1" opacity="0.4" filter="url(#blushBlur)" />
        <ellipse cx="247" cy="236" rx="28" ry="13" fill="#ff9ba1" opacity="0.38" filter="url(#blushBlur)" />

        <path d="M112 173 C132 146 170 146 188 174" stroke="#2f1b1f" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M192 174 C214 147 250 146 270 174" stroke="#2f1b1f" strokeWidth="9" fill="none" strokeLinecap="round" />

        <ellipse cx="152" cy="194" rx="34" ry="25" fill="#fdfefe" />
        <ellipse cx="230" cy="194" rx="34" ry="25" fill="#fdfefe" />

        <ellipse cx="152" cy="197" rx="16" ry="16" fill="url(#irisL)" />
        <ellipse cx="230" cy="197" rx="16" ry="16" fill="url(#irisR)" />

        <circle cx="152" cy="198" r="8" fill="#131722" />
        <circle cx="230" cy="198" r="8" fill="#131722" />

        <circle cx="157" cy="192" r="3.6" fill="#FFF" />
        <circle cx="161" cy="189" r="2.2" fill="#FFF" />
        <circle cx="235" cy="192" r="3.6" fill="#FFF" />
        <circle cx="239" cy="189" r="2.2" fill="#FFF" />

        <path d="M177 233 C184 240 196 240 203 233" stroke="#b76864" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M161 277 C177 290 204 290 221 277" stroke="#9f4f57" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function HeroDemo() {
  const panels = useMemo(
    () => [
      { title: 'Workspace', detail: 'Notes, canvases, and session memory synchronized.' },
      { title: 'Agent Core', detail: 'Reasoning graph online with adaptive Autonomy controls.' },
      { title: 'Control Deck', detail: 'Theme scenes, automations, and app connectors live.' },
    ],
    [],
  )

  return (
    <main className="desktop-root">
      <ParticleCanvas />
      <ErrorBoundary>
        <div className="desktop-shell">
          <header className="top-nav aurora-panel">
            <div className="top-left">
              <MenuIcon />
              <h1>Etherea Adaptive OS</h1>
            </div>
            <div className="top-actions">
              <button className="icon-btn"><NotesIcon /> Workspace</button>
              <button className="icon-btn"><BrainIcon /> Agent</button>
              <button className="icon-btn"><SettingsIcon /> Settings</button>
            </div>
          </header>

          <section className="desktop-grid">
            <aside className="left-sidebar aurora-panel">
              <h2>Navigation</h2>
              <nav>
                <a href="#"><NotesIcon /> Notes Nexus</a>
                <a href="#"><BrainIcon /> Cognition Loop</a>
                <a href="#"><SettingsIcon /> System Tuning</a>
              </nav>
            </aside>

            <section className="main-content aurora-panel">
              <h2>Premium Desktop Orchestrator</h2>
              <p>Neon Aurora Glass shell active. Neural ambience and adaptive avatar are running in real time.</p>
              <div className="cards">
                {panels.map((panel) => (
                  <article className="mini-card" key={panel.title}>
                    <h3>{panel.title}</h3>
                    <p>{panel.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </div>
      </ErrorBoundary>
      <Avatar />
    </main>
  )
}
