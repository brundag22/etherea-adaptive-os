import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { EthereaEmotion } from '../lib/useEthereaBrain';

type AvatarProps = {
  emotion: EthereaEmotion;
  mood: 'frustrated' | 'happy' | 'question' | 'neutral';
  avatarImpulse: number;
  speaking: boolean;
  mouthLevel: number;
  explainingMode: boolean;
  onToggleExplainingMode: () => void;
};

type Point = { x: number; y: number };
type DockMode = 'left' | 'right' | 'bottom-right';

const BASE_SIZE = 200;
const OFFSET = 20;

const EMOTION_AURA: Record<EthereaEmotion, string> = {
  happy: 'rgba(111, 250, 207, 0.9)',
  thinking: 'rgba(126, 186, 255, 0.9)',
  listening: 'rgba(143, 227, 255, 0.95)',
  neutral: 'rgba(140, 151, 255, 0.82)',
  concern: 'rgba(255, 165, 181, 0.92)',
};

function dockPoint(mode: DockMode, size: number): Point {
  if (mode === 'left') return { x: OFFSET, y: window.innerHeight - size - OFFSET * 2 };
  if (mode === 'right') return { x: window.innerWidth - size - OFFSET, y: window.innerHeight - size - OFFSET * 2 };
  return { x: window.innerWidth - size - OFFSET, y: window.innerHeight - size - OFFSET };
}

export function Avatar({ emotion, mood, avatarImpulse, speaking, mouthLevel, explainingMode, onToggleExplainingMode }: AvatarProps) {
  const size = explainingMode ? 150 : BASE_SIZE;
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const [blinkClosed, setBlinkClosed] = useState(false);
  const [dock, setDock] = useState<DockMode>('bottom-right');
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const frame = useRef<number>(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const animate = () => {
      setTick(performance.now());
      frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, []);

  useEffect(() => {
    const mode: DockMode = explainingMode ? 'right' : dock;
    setPosition(dockPoint(mode, size));
  }, [dock, explainingMode, size]);

  useEffect(() => {
    let cancelled = false;
    const scheduleBlink = () => {
      const next = 1700 + Math.random() * 2600;
      window.setTimeout(() => {
        if (cancelled) return;
        setBlinkClosed(true);
        window.setTimeout(() => !cancelled && setBlinkClosed(false), 110);
        scheduleBlink();
      }, next);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragging || !position) return;
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      dragStart.current = { x: event.clientX, y: event.clientY };
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - size, position.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - size, position.y + dy)),
      });
    };

    const onUp = () => {
      if (!dragging || !position) return;
      setDragging(false);
      const centerX = position.x + size / 2;
      const centerY = position.y + size / 2;
      const distLeft = centerX;
      const distRight = window.innerWidth - centerX;
      const distBottom = window.innerHeight - centerY;
      let nextDock: DockMode = 'bottom-right';
      if (distLeft < distRight && distLeft < distBottom) nextDock = 'left';
      else if (distRight <= distLeft && distRight < distBottom) nextDock = 'right';
      setDock(nextDock);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, position, size]);

  useEffect(() => {
    if (mood === 'frustrated' || avatarImpulse) {
      setBlinkClosed(true);
      const timer = window.setTimeout(() => setBlinkClosed(false), 140);
      return () => window.clearTimeout(timer);
    }
  }, [avatarImpulse, mood]);

  const expression = useMemo(() => {
    switch (emotion) {
      case 'happy':
        return { mouthCurve: 34, browL: 'M58 64 Q74 54 88 62', browR: 'M102 62 Q116 54 132 64', eyeShiftX: 0, tilt: -2 };
      case 'thinking':
        return { mouthCurve: 12, browL: 'M56 62 Q75 73 90 62', browR: 'M100 62 Q115 73 134 62', eyeShiftX: 6, tilt: 1.5 };
      case 'listening':
        return { mouthCurve: 10, browL: 'M57 60 Q74 52 90 60', browR: 'M100 60 Q116 52 133 60', eyeShiftX: 0, tilt: -4 };
      case 'concern':
        return { mouthCurve: -3, browL: 'M56 66 Q74 52 90 64', browR: 'M100 64 Q116 52 134 66', eyeShiftX: 0, tilt: 0 };
      default:
        return { mouthCurve: 16, browL: 'M58 62 Q74 58 90 62', browR: 'M100 62 Q116 58 132 62', eyeShiftX: 0, tilt: 0 };
    }
  }, [emotion]);

  const breathe = 1 + Math.sin(tick / 680) * 0.018;
  const floatY = Math.sin(tick / 920) * 3;
  const speakingBob = speaking ? Math.sin(tick / 180) * 2.6 : 0;
  const speakingOpen = Math.round(Math.min(34, mouthLevel * 34));
  const mouthPath = `M66 130 Q95 ${130 + (speaking ? Math.max(4, speakingOpen) : expression.mouthCurve)} 124 130`;

  if (!position) return null;

  return (
    <div
      className={`etherea-avatar ${dragging ? 'dragging' : ''} ${explainingMode ? 'explaining' : ''}`}
      style={{
        width: size,
        height: size,
        left: position.x,
        top: position.y,
        transform: `translateY(${floatY + speakingBob}px) scale(${breathe}) rotate(${expression.tilt}deg)`,
      }}
    >
      <div className="avatar-aura" style={{ '--aura-color': EMOTION_AURA[emotion] } as CSSProperties} />
      <button type="button" className="avatar-shell" aria-label="Etherea Avatar" onPointerDown={(event) => { setDragging(true); dragStart.current = { x: event.clientX, y: event.clientY }; }}>
        <svg viewBox="0 0 400 400" width="100%" height="100%" role="img" aria-label={`Etherea emotion ${emotion}`}>
          <g transform="translate(0 0) scale(2.105)">
            <defs>
              <radialGradient id="faceGradient" cx="45%" cy="32%" r="74%"><stop offset="0%" stopColor="#ffe8d1" /><stop offset="52%" stopColor="#f5c8aa" /><stop offset="100%" stopColor="#d39a80" /></radialGradient>
              <radialGradient id="irisGradient" cx="32%" cy="28%" r="72%"><stop offset="0%" stopColor="#ffd27a" /><stop offset="45%" stopColor="#ff9b4a" /><stop offset="80%" stopColor="#8a3b24" /><stop offset="100%" stopColor="#3c1412" /></radialGradient>
              <radialGradient id="lipGradient" cx="50%" cy="28%" r="75%"><stop offset="0%" stopColor="#d97d87" /><stop offset="100%" stopColor="#9d4a61" /></radialGradient>
            </defs>
            <path d="M95 28 C126 28 151 50 154 84 C156 111 146 142 124 160 C113 169 106 171 95 172 C84 171 77 169 66 160 C44 142 34 111 36 84 C39 50 64 28 95 28 Z" fill="url(#faceGradient)" />
            <path d={expression.browL} stroke="#7a4c43" strokeWidth="4.4" strokeLinecap="round" fill="none" />
            <path d={expression.browR} stroke="#7a4c43" strokeWidth="4.4" strokeLinecap="round" fill="none" />
            <ellipse cx={68 + expression.eyeShiftX} cy="92" rx="30" ry={blinkClosed ? 2 : 38} fill="#FFF" />
            <ellipse cx={122 + expression.eyeShiftX} cy="92" rx="30" ry={blinkClosed ? 2 : 38} fill="#FFF" />
            <circle cx={68 + expression.eyeShiftX} cy="96" r={blinkClosed ? 5 : 17} fill="url(#irisGradient)" />
            <circle cx={122 + expression.eyeShiftX} cy="96" r={blinkClosed ? 5 : 17} fill="url(#irisGradient)" />
            <circle cx={68 + expression.eyeShiftX} cy="97" r={blinkClosed ? 3 : 9} fill="#10121f" />
            <circle cx={122 + expression.eyeShiftX} cy="97" r={blinkClosed ? 3 : 9} fill="#10121f" />
            <path d={mouthPath} stroke="url(#lipGradient)" strokeWidth="5.4" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </button>
      <button type="button" className="avatar-mode-toggle" onClick={onToggleExplainingMode}>{explainingMode ? 'Expand' : 'Explain'}</button>
    </div>
  );
}
