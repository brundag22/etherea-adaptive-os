import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { EthereaEmotion } from '../lib/useEthereaBrain';

type AvatarProps = {
  emotion: EthereaEmotion;
  mood: 'frustrated' | 'happy' | 'question' | 'neutral';
  impulse?: 'blink' | 'tilt' | 'nod' | null;
  speaking: boolean;
  mouthLevel: number;
};

export const AVATAR_GFX = '';

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

export function Avatar({ emotion, mood, impulse, speaking, mouthLevel }: AvatarProps) {
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const [blinkClosed, setBlinkClosed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const frame = useRef<number>(0);
  const [tick, setTick] = useState(0);
  const [microTilt, setMicroTilt] = useState(0);
  const [impulseScaleY, setImpulseScaleY] = useState(1);
  const [impulseRotate, setImpulseRotate] = useState(0);
  const [auraBoost, setAuraBoost] = useState(false);

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

  useEffect(() => {
    if (!impulse) return;

    if (impulse === 'blink') {
      setImpulseScaleY(0.1);
      const timer = window.setTimeout(() => setImpulseScaleY(1), 140);
      return () => window.clearTimeout(timer);
    }

    if (impulse === 'tilt') {
      setImpulseRotate(5);
      const timer = window.setTimeout(() => setImpulseRotate(0), 240);
      return () => window.clearTimeout(timer);
    }

    if (impulse === 'nod') {
      setImpulseRotate(2.5);
      const timer = window.setTimeout(() => setImpulseRotate(0), 180);
      return () => window.clearTimeout(timer);
    }
  }, [impulse]);

  useEffect(() => {
    if (speaking && impulse === 'blink') setImpulseScaleY(0.1);
    if (speaking && impulse === 'tilt') setImpulseRotate(5);

    setAuraBoost(true);
    setBlinkClosed(true);

    const openTimer = window.setTimeout(() => setBlinkClosed(false), 140);
    const settleTimer = window.setTimeout(() => {
      setAuraBoost(false);
      setMicroTilt(0);
    }, 520);

    if (mood === 'frustrated') {
      setMicroTilt(-5);
    } else if (mood === 'happy') {
      setMicroTilt(-2.5);
    } else if (mood === 'question') {
      setMicroTilt(4.5);
    }

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(settleTimer);
    };
  }, [mood, speaking, impulse]);

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
  const speakingOpen = Math.round(Math.min(34, mouthLevel * 34));
  const activeMouthCurve = speaking ? Math.max(4, speakingOpen) : expression.mouthCurve;
  const mouthPath = `M66 130 Q95 ${130 + activeMouthCurve} 124 130`;

  if (!position) return null;

  return (
    <div
      ref={containerRef}
      className={`etherea-avatar ${dragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        transform: `translateY(${floatY + speakingBob}px) scale(${breathe}) scaleY(${impulseScaleY}) rotate(${expression.tilt + microTilt + impulseRotate}deg)`,
        transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      <div className={`avatar-aura ${auraBoost ? 'boost' : ''}`} style={{ '--aura-color': EMOTION_AURA[emotion] } as CSSProperties} />
      <button
        type="button"
        className="avatar-shell"
        aria-label="Etherea Avatar"
        onPointerDown={(event) => {
          setDragging(true);
          dragStart.current = { x: event.clientX, y: event.clientY };
        }}
      >
        <svg viewBox="0 0 400 400" width="100%" height="100%" role="img" aria-label={`Etherea emotion ${emotion}`}>
          <g transform="translate(0 0) scale(2.105)">
          <defs>
            <radialGradient id="faceGradient" cx="45%" cy="32%" r="74%">
              <stop offset="0%" stopColor="#ffe8d1" />
              <stop offset="52%" stopColor="#f5c8aa" />
              <stop offset="100%" stopColor="#d39a80" />
            </radialGradient>
            <radialGradient id="skinShine" cx="35%" cy="18%" r="45%">
              <stop offset="0%" stopColor="rgba(255, 252, 245, 0.95)" />
              <stop offset="100%" stopColor="rgba(255, 252, 245, 0)" />
            </radialGradient>
            <radialGradient id="faceShadow" cx="60%" cy="70%" r="58%">
              <stop offset="0%" stopColor="rgba(113, 52, 52, 0)" />
              <stop offset="100%" stopColor="rgba(113, 52, 52, 0.3)" />
            </radialGradient>
            <radialGradient id="irisGradient" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#ffd27a" />
              <stop offset="45%" stopColor="#ff9b4a" />
              <stop offset="80%" stopColor="#8a3b24" />
              <stop offset="100%" stopColor="#3c1412" />
            </radialGradient>
            <radialGradient id="lipGradient" cx="50%" cy="28%" r="75%">
              <stop offset="0%" stopColor="#d97d87" />
              <stop offset="100%" stopColor="#9d4a61" />
            </radialGradient>
            <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id="featureShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="1.8" stdDeviation="1.8" floodColor="rgba(83, 44, 47, 0.4)" />
            </filter>
            <filter id="eyeDepth" x="-30%" y="-30%" width="160%" height="170%">
              <feDropShadow dx="0" dy="1.3" stdDeviation="1.1" floodColor="rgba(21, 30, 64, 0.55)" />
            </filter>
          </defs>
          <path d="M95 28 C126 28 151 50 154 84 C156 111 146 142 124 160 C113 169 106 171 95 172 C84 171 77 169 66 160 C44 142 34 111 36 84 C39 50 64 28 95 28 Z" fill="url(#faceGradient)" />
          <path d="M95 28 C126 28 151 50 154 84 C156 111 146 142 124 160 C113 169 106 171 95 172 C84 171 77 169 66 160 C44 142 34 111 36 84 C39 50 64 28 95 28 Z" fill="url(#faceShadow)" />
          <ellipse cx="84" cy="66" rx="48" ry="34" fill="url(#skinShine)" />

          <circle cx="70" cy="112" r="12" fill="rgba(237, 126, 137, 0.42)" filter="url(#blur)" />
          <circle cx="120" cy="112" r="12" fill="rgba(237, 126, 137, 0.42)" filter="url(#blur)" />

          <path d={expression.browL} stroke="#7a4c43" strokeWidth="4.4" strokeLinecap="round" fill="none" filter="url(#featureShadow)" />
          <path d={expression.browR} stroke="#7a4c43" strokeWidth="4.4" strokeLinecap="round" fill="none" filter="url(#featureShadow)" />

          <path d="M95 89 Q90 102 95 112" stroke="rgba(123, 77, 77, 0.45)" strokeWidth="2.2" strokeLinecap="round" fill="none" filter="url(#featureShadow)" />

          <ellipse cx={68 + expression.eyeShiftX} cy="92" rx="30" ry={Math.max(2, blinkClosed ? 2 : 40)} fill="#FFF" filter="url(#eyeDepth)" />
          <ellipse cx={122 + expression.eyeShiftX} cy="92" rx="30" ry={Math.max(2, blinkClosed ? 2 : 40)} fill="#FFF" filter="url(#eyeDepth)" />

          <circle cx={68 + expression.eyeShiftX} cy="96" r={blinkClosed ? 6 : 18} fill="url(#irisGradient)" />
          <circle cx={122 + expression.eyeShiftX} cy="96" r={blinkClosed ? 6 : 18} fill="url(#irisGradient)" />

          <circle cx={68 + expression.eyeShiftX} cy="97" r={blinkClosed ? 3 : 9} fill="#10121f" />
          <circle cx={122 + expression.eyeShiftX} cy="97" r={blinkClosed ? 3 : 9} fill="#10121f" />

          {!blinkClosed && (
            <>
              <circle cx={73 + expression.eyeShiftX} cy="90" r="6" fill="#FFF" />
              <circle cx={126 + expression.eyeShiftX} cy="90" r="6" fill="#FFF" />
              <circle cx={77 + expression.eyeShiftX} cy="95" r="3" fill="#FFF" />
              <circle cx={130 + expression.eyeShiftX} cy="95" r="3" fill="#FFF" />
            </>
          )}

          <path d="M42 68 Q67 47 92 71" stroke="#5a3028" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M96 71 Q121 47 146 68" stroke="#5a3028" strokeWidth="6" strokeLinecap="round" fill="none" />

          <path d={mouthPath} stroke="url(#lipGradient)" strokeWidth="5.4" strokeLinecap="round" fill="none" filter="url(#featureShadow)" />
          <path d="M78 124 Q95 136 112 124" stroke="rgba(124, 61, 75, 0.24)" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </button>
    </div>
  );
}
