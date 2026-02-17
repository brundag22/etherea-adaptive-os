import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechFrame = {
  speaking: boolean;
  mouthLevel: number;
};

const VOICE_PRIORITY = ['hi-IN', 'kn-IN', 'ta-IN', 'te-IN', 'en-IN', 'en-US'] as const;

function choosePreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const lang of VOICE_PRIORITY) {
    const exact = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
    if (exact) return exact;
  }
  return voices[0] ?? null;
}

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const immediate = synth.getVoices();
  if (immediate.length > 0) return immediate;

  return await new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const onVoices = () => {
      const loaded = synth.getVoices();
      if (loaded.length > 0) {
        synth.removeEventListener('voiceschanged', onVoices);
        resolve(loaded);
      }
    };

    synth.addEventListener('voiceschanged', onVoices);
    window.setTimeout(() => {
      synth.removeEventListener('voiceschanged', onVoices);
      resolve(synth.getVoices());
    }, 1000);
  });
}

export function useSpeechEngine() {
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [frame, setFrame] = useState<SpeechFrame>({ speaking: false, mouthLevel: 0 });

  const envelopeTimer = useRef<number | null>(null);

  const cleanupCadence = useCallback(() => {
    if (envelopeTimer.current) {
      window.clearInterval(envelopeTimer.current);
      envelopeTimer.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    cleanupCadence();
    setFrame({ speaking: false, mouthLevel: 0 });
  }, [cleanupCadence]);

  const speak = useCallback(
    async (text: string): Promise<'spoken' | 'unavailable' | 'disabled'> => {
      if (!voiceOutputEnabled || !text.trim()) return 'disabled';
      if (!('speechSynthesis' in window)) return 'unavailable';

      stop();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      const voices = await loadVoices();
      const selectedVoice = choosePreferredVoice(voices);
      if (!selectedVoice) return 'unavailable';

      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      utterance.rate = 0.97;
      utterance.pitch = 1.03;

      utterance.onstart = () => {
        setFrame({ speaking: true, mouthLevel: 0.32 });
      };
      utterance.onboundary = () => {
        setFrame({ speaking: true, mouthLevel: 0.26 + Math.random() * 0.7 });
      };
      utterance.onend = () => {
        cleanupCadence();
        setFrame({ speaking: false, mouthLevel: 0 });
      };
      utterance.onerror = () => {
        cleanupCadence();
        setFrame({ speaking: false, mouthLevel: 0 });
      };

      const approxDurationMs = Math.max(1200, text.length * 44);
      const startedAt = performance.now();
      envelopeTimer.current = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        if (elapsed >= approxDurationMs) {
          cleanupCadence();
          return;
        }
        setFrame({ speaking: true, mouthLevel: Math.max(0.22, Math.abs(Math.sin(elapsed / 130))) });
      }, 110);

      window.speechSynthesis.speak(utterance);
      return 'spoken';
    },
    [cleanupCadence, stop, voiceOutputEnabled],
  );

  useEffect(() => () => stop(), [stop]);

  return {
    speechSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    speak,
    stop,
    speaking: frame.speaking,
    mouthLevel: frame.mouthLevel,
  };
}
