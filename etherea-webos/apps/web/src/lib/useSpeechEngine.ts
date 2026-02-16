import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechFrame = {
  speaking: boolean;
  mouthLevel: number;
};

const VOICE_PRIORITY = ['en-IN', 'hi-IN', 'kn-IN', 'ta-IN', 'te-IN'] as const;

function choosePreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const lang of VOICE_PRIORITY) {
    const exact = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
    if (exact) return exact;
  }

  const enUs = voices.find((voice) => voice.lang.toLowerCase().startsWith('en-us'));
  if (enUs) return enUs;

  const femaleHint = voices.find((voice) => /female|woman|samantha|zira|susan|karen|aria/i.test(voice.name));
  if (femaleHint) return femaleHint;

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
    }, 800);
  });
}

export function useSpeechEngine() {
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [frame, setFrame] = useState<SpeechFrame>({ speaking: false, mouthLevel: 0 });
  const envelopeTimer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (envelopeTimer.current) {
      window.clearInterval(envelopeTimer.current);
      envelopeTimer.current = null;
    }
    setFrame({ speaking: false, mouthLevel: 0 });
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!voiceOutputEnabled || !text.trim() || !('speechSynthesis' in window)) return;

      stop();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      const voices = await loadVoices();
      const selectedVoice = choosePreferredVoice(voices);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }

      utterance.rate = 0.97;
      utterance.pitch = 1.04;

      utterance.onstart = () => {
        setFrame({ speaking: true, mouthLevel: 0.35 });
      };

      utterance.onboundary = () => {
        setFrame({ speaking: true, mouthLevel: 0.3 + Math.random() * 0.7 });
      };

      utterance.onend = () => {
        if (envelopeTimer.current) {
          window.clearInterval(envelopeTimer.current);
          envelopeTimer.current = null;
        }
        setFrame({ speaking: false, mouthLevel: 0 });
      };

      utterance.onerror = () => {
        if (envelopeTimer.current) {
          window.clearInterval(envelopeTimer.current);
          envelopeTimer.current = null;
        }
        setFrame({ speaking: false, mouthLevel: 0 });
      };

      const approxDurationMs = Math.max(1200, text.length * 48);
      const startedAt = performance.now();
      envelopeTimer.current = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        if (elapsed >= approxDurationMs) {
          if (envelopeTimer.current) {
            window.clearInterval(envelopeTimer.current);
            envelopeTimer.current = null;
          }
          return;
        }
        const oscillation = Math.abs(Math.sin(elapsed / 120));
        setFrame({ speaking: true, mouthLevel: Math.max(0.2, oscillation) });
      }, 110);

      window.speechSynthesis.speak(utterance);
    },
    [stop, voiceOutputEnabled]
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
