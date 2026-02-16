import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { EthereaEmotion } from '../lib/useEthereaBrain';

type AvatarProps = {
  emotion: EthereaEmotion;
  speaking: boolean;
  mouthLevel: number;
};

type Point = { x: number; y: number };

const EMOTION_AURA: Record<EthereaEmotion, string> = {
  happy: 'rgba(111, 250, 207, 0.9)',
  thinking: 'rgba(126, 186, 255, 0.9)',
  listening: 'rgba(143, 227, 255, 0.95)',
  neutral: 'rgba(140, 151, 255, 0.82)',
  concern: 'rgba(255, 165, 181, 0.92)',
};

const BASE_SIZE = 190;
const OFFSET = 20;

export function Avatar({ emotion, speaking, mouthLevel }: AvatarProps) {
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const [blinkClosed, setBlinkClosed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
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
    let cancelled = false;
    const scheduleBlink = () => {
      const next = 1700 + Math.random() * 2600;
      window.setTimeout(() => {
        if (cancelled) return;
        setBlinkClosed(true);
        window.setTimeout(() => !cancelled && setBlinkClosed(false), 120);
        scheduleBlink();
      }, next);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (position) return;
    setPosition({ x: window.innerWidth - BASE_SIZE - OFFSET, y: window.innerHeight - BASE_SIZE - OFFSET });
  }, [position]);

  useEffect(() => {
    if (!position) return;

    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      dragStart.current = { x: event.clientX, y: event.clientY };
      setPosition((prev) => {
        if (!prev) return prev;
        const nextX = Math.max(0, Math.min(window.innerWidth - BASE_SIZE, prev.x + dx));
        const nextY = Math.max(0, Math.min(window.innerHeight - BASE_SIZE, prev.y + dy));
        return { x: nextX, y: nextY };
      });
    };

    const onUp = () => {
      if (!dragging) return;
      setDragging(false);
      setPosition({ x: window.innerWidth - BASE_SIZE - OFFSET, y: window.innerHeight - BASE_SIZE - OFFSET });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, position]);

  const expression = useMemo(() => {
    switch (emotion) {
      case 'happy':
        return { mouthCurve: 30, browL: 'M58 64 Q74 54 88 62', browR: 'M102 62 Q116 54 132 64', eyeOpen: 1, eyeShiftX: 0, tilt: -2 };
      case 'thinking':
        return { mouthCurve: 10, browL: 'M56 62 Q75 73 90 62', browR: 'M100 62 Q115 73 134 62', eyeOpen: 0.82, eyeShiftX: 6, tilt: 1.5 };
      case 'listening':
        return { mouthCurve: 8, browL: 'M57 60 Q74 52 90 60', browR: 'M100 60 Q116 52 133 60', eyeOpen: 1.18, eyeShiftX: 0, tilt: -5 };
      case 'concern':
        return { mouthCurve: -2, browL: 'M56 66 Q74 52 90 64', browR: 'M100 64 Q116 52 134 66', eyeOpen: 0.92, eyeShiftX: 0, tilt: 0 };
      default:
        return { mouthCurve: 14, browL: 'M58 62 Q74 58 90 62', browR: 'M100 62 Q116 58 132 62', eyeOpen: 1, eyeShiftX: 0, tilt: 0 };
    }
  }, [emotion]);

  const breathe = 1 + Math.sin(tick / 680) * 0.018;
  const floatY = Math.sin(tick / 950) * 3;
  const speakingBob = speaking ? Math.sin(tick / 180) * 2.6 : 0;
  const eyeHeight = blinkClosed ? 2 : 15 * expression.eyeOpen;
  const speakingOpen = Math.round(Math.min(34, mouthLevel * 34));
  const activeMouthCurve = speaking ? Math.max(4, speakingOpen) : expression.mouthCurve;
  const mouthPath = `M66 130 Q95 ${130 + activeMouthCurve} 124 130`;

  if (!position) return null;

  return (
    <div
      ref={containerRef}
      className={`etherea-avatar ${dragging ? 'dragging' : ''}`}
      style={{ left: position.x, top: position.y, transform: `translateY(${floatY + speakingBob}px) scale(${breathe}) rotate(${expression.tilt}deg)` }}
    >
      <div className="avatar-aura" style={{ '--aura-color': EMOTION_AURA[emotion] } as CSSProperties} />
      <button
        type="button"
        className="avatar-shell"
        aria-label="Etherea Avatar"
        onPointerDown={(event) => {
          setDragging(true);
          dragStart.current = { x: event.clientX, y: event.clientY };
        }}
      >
        <svg viewBox="0 0 190 190" role="img" aria-label={`Etherea emotion ${emotion}`}>
          <defs>
            <radialGradient id="faceGradient" cx="30%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#f7f9ff" />
              <stop offset="62%" stopColor="#cad8ff" />
              <stop offset="100%" stopColor="#9caefc" />
            </radialGradient>
          </defs>
          <circle cx="95" cy="95" r="76" fill="url(#faceGradient)" />
          <ellipse cx="95" cy="104" rx="55" ry="44" fill="rgba(80, 96, 184, 0.14)" />
          <path d={expression.browL} stroke="#33437f" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d={expression.browR} stroke="#33437f" strokeWidth="5" strokeLinecap="round" fill="none" />

          <ellipse cx={73 + expression.eyeShiftX} cy="88" rx="13" ry={eyeHeight} fill="#232f59" />
          <ellipse cx={117 + expression.eyeShiftX} cy="88" rx="13" ry={eyeHeight} fill="#232f59" />

          {!blinkClosed && (
            <>
              <circle cx={73 + expression.eyeShiftX + 2} cy="88" r="5" fill="#9ceaff" />
              <circle cx={117 + expression.eyeShiftX + 2} cy="88" r="5" fill="#9ceaff" />
            </>
          )}

          <path d={mouthPath} stroke="#394886" strokeWidth="5" strokeLinecap="round" fill="none" />
        </svg>
      </button>
    </div>
  );
}
