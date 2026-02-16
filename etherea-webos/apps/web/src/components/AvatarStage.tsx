import { useEffect, useMemo, useRef, useState } from 'react';

export type Emotion = { mood: 'calm' | 'focused' | 'curious' | 'hype' | 'care' | 'stressed'; intensity: number };
export type DockMode = 'left' | 'right' | 'center' | 'corner' | 'hidden';

const PALETTES = [
  { skin: '#f6d7c6', outfitA: '#7c3aed', outfitB: '#312e81', aura: '#8b5cf6', hair: '#1f2937' },
  { skin: '#efc9b5', outfitA: '#06b6d4', outfitB: '#0e7490', aura: '#22d3ee', hair: '#111827' },
  { skin: '#e6b89f', outfitA: '#22c55e', outfitB: '#166534', aura: '#4ade80', hair: '#172554' },
] as const;

function resolveDock(x: number, y: number, viewportWidth: number, viewportHeight: number): DockMode {
  if (x < 88) return 'left';
  if (x > viewportWidth - 190) return 'right';
  if (x > viewportWidth - 220 && y > viewportHeight - 220) return 'corner';
  return 'center';
}

export function AvatarStage({
  emotion,
  reducedMotion,
  speaking,
  mouthLevel,
  explaining,
  onDockChange,
}: {
  emotion: Emotion;
  reducedMotion: boolean;
  speaking: boolean;
  mouthLevel: number;
  explaining: boolean;
  onDockChange?: (dock: DockMode) => void;
}) {
  const [blink, setBlink] = useState(false);
  const [glance, setGlance] = useState({ x: 0, y: 0 });
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [dock, setDock] = useState<DockMode>('corner');
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState(() => ({ x: window.innerWidth - 220, y: Math.max(90, window.innerHeight - 290) }));
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    onDockChange?.(dock);
  }, [dock, onDockChange]);

  useEffect(() => {
    if (explaining) {
      setDock('right');
      setPosition({ x: window.innerWidth - 210, y: 120 });
    }
  }, [explaining]);

  useEffect(() => {
    if (reducedMotion) return;
    let canceled = false;
    let timer = 0;
    const scheduleBlink = () => {
      timer = window.setTimeout(() => {
        if (canceled) return;
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
        setGlance({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 3 });
        scheduleBlink();
      }, 2400 + Math.random() * 4200);
    };
    scheduleBlink();
    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [reducedMotion]);

  const expression = useMemo(() => {
    if (emotion.mood === 'hype') return { brow: -4, mouth: 'M 84 156 Q 110 180 136 156' };
    if (emotion.mood === 'focused') return { brow: 3, mouth: 'M 84 156 Q 110 160 136 156' };
    if (emotion.mood === 'care') return { brow: -1, mouth: 'M 84 156 Q 110 170 136 156' };
    if (emotion.mood === 'stressed') return { brow: 6, mouth: 'M 84 164 Q 110 148 136 164' };
    if (emotion.mood === 'curious') return { brow: -2, mouth: 'M 84 156 Q 110 166 136 156' };
    return { brow: 0, mouth: 'M 84 156 Q 110 162 136 156' };
  }, [emotion.mood]);

  const palette = PALETTES[paletteIndex % PALETTES.length];

  const dockPosition = useMemo(() => {
    if (dock === 'hidden') return { x: window.innerWidth + 300, y: window.innerHeight + 300 };
    if (dock === 'left') return { x: 14, y: 130 };
    if (dock === 'right') return { x: window.innerWidth - 210, y: 130 };
    if (dock === 'corner') return { x: window.innerWidth - 220, y: Math.max(90, window.innerHeight - 290) };
    return position;
  }, [dock, position]);

  const mouthHeight = Math.max(5, 8 + mouthLevel * 18 + (speaking ? 6 : 0));

  return (
    <section
      className={`avatar-overlay dock-${dock} ${explaining ? 'explaining' : ''}`}
      style={{ left: dockPosition.x, top: dockPosition.y }}
      onPointerMove={(event) => {
        if (!dragRef.current) return;
        const nextX = Math.min(window.innerWidth - 160, Math.max(0, event.clientX - dragRef.current.x));
        const nextY = Math.min(window.innerHeight - 190, Math.max(0, event.clientY - dragRef.current.y));
        setPosition({ x: nextX, y: nextY });
        setDock('center');
      }}
      onPointerUp={() => {
        if (!dragRef.current) return;
        dragRef.current = null;
        setDock(resolveDock(position.x, position.y, window.innerWidth, window.innerHeight));
      }}
    >
      <div className="avatar-aura" style={{ opacity: 0.34 + emotion.intensity * 0.66, animationDuration: `${3.2 - emotion.intensity * 1.5}s`, background: `radial-gradient(circle, ${palette.aura}, transparent 68%)` }} />
      <button
        className="avatar-drag-handle"
        onPointerDown={(event) => {
          dragRef.current = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
          (event.target as HTMLElement).setPointerCapture(event.pointerId);
        }}
        onDoubleClick={() => setPaletteIndex((index) => (index + 1) % PALETTES.length)}
      >
        ⠿
      </button>
      <button className="avatar-menu-btn" onClick={() => setShowMenu((value) => !value)}>
        ☰
      </button>
      {showMenu && (
        <div className="avatar-menu">
          <button onClick={() => setDock('left')}>Dock Left</button>
          <button onClick={() => setDock('right')}>Dock Right</button>
          <button onClick={() => setDock('center')}>Center</button>
          <button onClick={() => setDock('hidden')}>Hide</button>
        </div>
      )}
      <svg className={`avatar ${speaking ? 'speaking' : ''}`} viewBox="0 0 240 300" role="img" aria-label="Etherea avatar">
        <defs>
          <radialGradient id="faceGrad" cx="50%" cy="34%" r="68%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="100%" stopColor={palette.skin} />
          </radialGradient>
          <linearGradient id="hoodGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.outfitA} />
            <stop offset="100%" stopColor={palette.outfitB} />
          </linearGradient>
        </defs>
        <ellipse className="stage-shadow" cx="120" cy="280" rx="62" ry="16" />
        <g className="avatar-float">
          <g className="avatar-breathe">
            <path d="M64 274 Q120 208 176 274 L176 292 L64 292 Z" fill="url(#hoodGrad)" />
            <ellipse cx="120" cy="138" rx="58" ry="72" fill="url(#faceGrad)" />
            <path d="M60 128 Q80 46 120 52 Q160 46 180 128 Q158 96 120 98 Q82 96 60 128 Z" fill={palette.hair} />
            <path d={`M84 112 Q98 ${102 + expression.brow} 110 110`} stroke="#111827" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M130 110 Q142 ${102 + expression.brow} 156 112`} stroke="#111827" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="95" cy="136" rx="14" ry={blink ? 2 : 10} fill="#fff" />
            <ellipse cx="145" cy="136" rx="14" ry={blink ? 2 : 10} fill="#fff" />
            <circle cx={95 + glance.x} cy={136 + glance.y} r="4.5" fill="#111827" />
            <circle cx={145 + glance.x} cy={136 + glance.y} r="4.5" fill="#111827" />
            <path d={expression.mouth} stroke="#7f1d1d" strokeWidth="3" fill="none" strokeLinecap="round" opacity={0.7} />
            <ellipse cx="120" cy="166" rx="24" ry={mouthHeight / 2} fill="#8f1f31" opacity={0.86} />
          </g>
        </g>
      </svg>
    </section>
  );
}
