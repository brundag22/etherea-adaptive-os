import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { EthereaEmotion } from '../lib/useEthereaBrain';

type AvatarProps = {
  emotion: EthereaEmotion;
  mood: 'frustrated' | 'happy' | 'question' | 'neutral';
  avatarImpulse: number;
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

export function Avatar({ emotion, mood, avatarImpulse, speaking, mouthLevel }: AvatarProps) {
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const [blinkClosed, setBlinkClosed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const frame = useRef<number>(0);
  const [tick, setTick] = useState(0);
  const [microTilt, setMicroTilt] = useState(0);
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
  }, [avatarImpulse, mood]);

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
      style={{
        left: position.x,
        top: position.y,
        transform: `translateY(${floatY + speakingBob}px) scale(${breathe}) rotate(${expression.tilt + microTilt}deg)`,
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
        <svg viewBox="0 0 400 400" role="img" aria-label={`Etherea emotion ${emotion}`}>
          <g transform="translate(0 0) scale(2.105)">
          <defs>
            <radialGradient id="faceGradient" cx="46%" cy="34%" r="72%">
              <stop offset="0%" stopColor="#ffe5cf" />
              <stop offset="45%" stopColor="#f5c6aa" />
              <stop offset="72%" stopColor="#dc9e88" />
              <stop offset="100%" stopColor="#b9736d" />
            </radialGradient>
            <radialGradient id="skinShine" cx="38%" cy="22%" r="45%">
              <stop offset="0%" stopColor="rgba(255, 252, 245, 0.95)" />
              <stop offset="100%" stopColor="rgba(255, 252, 245, 0)" />
            </radialGradient>
            <radialGradient id="faceShadow" cx="60%" cy="70%" r="55%">
              <stop offset="0%" stopColor="rgba(113, 52, 52, 0)" />
              <stop offset="100%" stopColor="rgba(113, 52, 52, 0.32)" />
            </radialGradient>
            <radialGradient id="irisGradient" cx="38%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#6ce6ff" />
              <stop offset="42%" stopColor="#1ea3dc" />
              <stop offset="78%" stopColor="#1b366d" />
              <stop offset="100%" stopColor="#0f1638" />
            </radialGradient>
            <radialGradient id="lipGradient" cx="50%" cy="28%" r="75%">
              <stop offset="0%" stopColor="#d97d87" />
              <stop offset="100%" stopColor="#9d4a61" />
            </radialGradient>
            <filter id="cheekBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4.8" />
            </filter>
            <filter id="featureShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="1.8" stdDeviation="1.8" floodColor="rgba(83, 44, 47, 0.4)" />
            </filter>
            <filter id="eyeDepth" x="-30%" y="-30%" width="160%" height="170%">
              <feDropShadow dx="0" dy="1.3" stdDeviation="1.1" floodColor="rgba(21, 30, 64, 0.55)" />
            </filter>
          </defs>
          <ellipse cx="95" cy="98" rx="63" ry="70" fill="url(#faceGradient)" />
          <ellipse cx="95" cy="98" rx="63" ry="70" fill="url(#faceShadow)" />
          <ellipse cx="85" cy="68" rx="46" ry="36" fill="url(#skinShine)" />

          <ellipse cx="73" cy="106" rx="15" ry="10" fill="rgba(234, 120, 126, 0.48)" filter="url(#cheekBlur)" />
          <ellipse cx="117" cy="106" rx="15" ry="10" fill="rgba(234, 120, 126, 0.48)" filter="url(#cheekBlur)" />

          <path d={expression.browL} stroke="#7a4c43" strokeWidth="4.4" strokeLinecap="round" fill="none" filter="url(#featureShadow)" />
          <path d={expression.browR} stroke="#7a4c43" strokeWidth="4.4" strokeLinecap="round" fill="none" filter="url(#featureShadow)" />

          <path d="M95 89 Q90 102 95 112" stroke="rgba(123, 77, 77, 0.45)" strokeWidth="2.2" strokeLinecap="round" fill="none" filter="url(#featureShadow)" />

          <ellipse cx={73 + expression.eyeShiftX} cy="91" rx="18" ry={Math.max(2, eyeHeight + 4)} fill="#fff7f5" filter="url(#eyeDepth)" />
          <ellipse cx={117 + expression.eyeShiftX} cy="91" rx="18" ry={Math.max(2, eyeHeight + 4)} fill="#fff7f5" filter="url(#eyeDepth)" />

          <ellipse cx={73 + expression.eyeShiftX} cy="92" rx="10.4" ry={Math.max(1.8, eyeHeight)} fill="#101635" />
          <ellipse cx={117 + expression.eyeShiftX} cy="92" rx="10.4" ry={Math.max(1.8, eyeHeight)} fill="#101635" />

          <ellipse cx={73 + expression.eyeShiftX} cy="92" rx="8.2" ry={Math.max(1.6, eyeHeight * 0.9)} fill="url(#irisGradient)" />
          <ellipse cx={117 + expression.eyeShiftX} cy="92" rx="8.2" ry={Math.max(1.6, eyeHeight * 0.9)} fill="url(#irisGradient)" />

          {!blinkClosed && (
            <>
              <ellipse cx={73 + expression.eyeShiftX + 1.6} cy="90" rx="3.2" ry="2.7" fill="#ffffff" />
              <ellipse cx={117 + expression.eyeShiftX + 1.6} cy="90" rx="3.2" ry="2.7" fill="#ffffff" />
              <circle cx={73 + expression.eyeShiftX - 2.8} cy="95" r="1.35" fill="rgba(255, 255, 255, 0.84)" />
              <circle cx={117 + expression.eyeShiftX - 2.8} cy="95" r="1.35" fill="rgba(255, 255, 255, 0.84)" />
            </>
          )}

          <path d={`M57 ${95 - eyeHeight} Q73 ${86 - eyeHeight * 0.22} 89 ${95 - eyeHeight}`} stroke="rgba(126, 66, 63, 0.7)" strokeWidth="2.2" fill="none" />
          <path d={`M101 ${95 - eyeHeight} Q117 ${86 - eyeHeight * 0.22} 133 ${95 - eyeHeight}`} stroke="rgba(126, 66, 63, 0.7)" strokeWidth="2.2" fill="none" />

          <path d={mouthPath} stroke="url(#lipGradient)" strokeWidth="5.4" strokeLinecap="round" fill="none" filter="url(#featureShadow)" />
          <path d="M78 124 Q95 136 112 124" stroke="rgba(124, 61, 75, 0.24)" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </button>
    </div>
  );
}
