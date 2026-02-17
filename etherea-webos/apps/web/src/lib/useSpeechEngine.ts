import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechFrame = {
  speaking: boolean;
  mouthLevel: number;
};

const VOICE_PRIORITY = ['en-IN', 'hi-IN', 'kn-IN', 'ta-IN', 'te-IN'] as const;

const EDGE_VOICE_MAP: Record<string, string> = {
  'en-IN': 'en-IN-NeerjaNeural',
  'hi-IN': 'hi-IN-SwaraNeural',
  'kn-IN': 'kn-IN-SapnaNeural',
  'ta-IN': 'ta-IN-PallaviNeural',
  'te-IN': 'te-IN-ShrutiNeural',
};

function inferLanguage(text: string): keyof typeof EDGE_VOICE_MAP {
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  return 'en-IN';
}

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
    }, 900);
  });
}

export function useSpeechEngine() {
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [frame, setFrame] = useState<SpeechFrame>({ speaking: false, mouthLevel: 0 });

  const envelopeTimer = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const cadenceFrameRef = useRef<number | null>(null);
  const edgeAudioRef = useRef<HTMLAudioElement | null>(null);

  const cleanupCadence = useCallback(() => {
    if (envelopeTimer.current) {
      window.clearInterval(envelopeTimer.current);
      envelopeTimer.current = null;
    }
    if (cadenceFrameRef.current) {
      window.cancelAnimationFrame(cadenceFrameRef.current);
      cadenceFrameRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (edgeAudioRef.current) {
      edgeAudioRef.current.pause();
      URL.revokeObjectURL(edgeAudioRef.current.src);
      edgeAudioRef.current = null;
    }
    cleanupCadence();
    setFrame({ speaking: false, mouthLevel: 0 });
  }, [cleanupCadence]);

  const runFallbackSynth = useCallback(
    async (text: string) => {
      if (!('speechSynthesis' in window)) return;

      const utterance = new SpeechSynthesisUtterance(text.trim());
      const voices = await loadVoices();
      const selectedVoice = choosePreferredVoice(voices);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }

      utterance.rate = 0.97;
      utterance.pitch = 1.03;

      utterance.onstart = () => {
        setFrame({ speaking: true, mouthLevel: 0.35 });
      };
      utterance.onboundary = () => {
        setFrame({ speaking: true, mouthLevel: 0.3 + Math.random() * 0.65 });
      };
      utterance.onend = () => {
        cleanupCadence();
        setFrame({ speaking: false, mouthLevel: 0 });
      };
      utterance.onerror = () => {
        cleanupCadence();
        setFrame({ speaking: false, mouthLevel: 0 });
      };

      const approxDurationMs = Math.max(1200, text.length * 46);
      const startedAt = performance.now();
      envelopeTimer.current = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        if (elapsed >= approxDurationMs) {
          cleanupCadence();
          return;
        }
        setFrame({ speaking: true, mouthLevel: Math.max(0.2, Math.abs(Math.sin(elapsed / 120))) });
      }, 110);

      window.speechSynthesis.speak(utterance);
    },
    [cleanupCadence]
  );

  const playEdgeAudio = useCallback(
    async (audioBlob: Blob) => {
      const objectUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(objectUrl);
      edgeAudioRef.current = audio;

      const audioContext = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = audioContext;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaElementSource(audio);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const syncCadence = () => {
        analyser.getByteFrequencyData(dataArray);
        const energy = dataArray.reduce((acc, value) => acc + value, 0) / (dataArray.length * 255);
        setFrame({ speaking: true, mouthLevel: Math.max(0.16, Math.min(1, energy * 1.9)) });
        cadenceFrameRef.current = window.requestAnimationFrame(syncCadence);
      };

      audio.onplay = () => {
        setFrame({ speaking: true, mouthLevel: 0.2 });
        cadenceFrameRef.current = window.requestAnimationFrame(syncCadence);
      };

      audio.onended = () => {
        cleanupCadence();
        source.disconnect();
        analyser.disconnect();
        URL.revokeObjectURL(objectUrl);
        edgeAudioRef.current = null;
        setFrame({ speaking: false, mouthLevel: 0 });
      };

      audio.onerror = () => {
        cleanupCadence();
        source.disconnect();
        analyser.disconnect();
        URL.revokeObjectURL(objectUrl);
        edgeAudioRef.current = null;
        setFrame({ speaking: false, mouthLevel: 0 });
      };

      await audio.play();
    },
    [cleanupCadence]
  );

  const speak = useCallback(
    async (text: string) => {
      if (!voiceOutputEnabled || !text.trim()) return;
      stop();

      const language = inferLanguage(text);
      const endpoint = (import.meta.env.VITE_EDGE_TTS_ENDPOINT as string | undefined) ?? '';
      const canUseHybrid = typeof navigator !== 'undefined' && navigator.onLine && endpoint;

      if (canUseHybrid) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, lang: language, voice: EDGE_VOICE_MAP[language] }),
          });

          if (!response.ok) {
            throw new Error(`Edge TTS failed with status ${response.status}`);
          }

          const audioBlob = await response.blob();
          if (!audioBlob.size) {
            throw new Error('Empty Edge TTS audio payload');
          }

          await playEdgeAudio(audioBlob);
          return;
        } catch (error) {
          console.warn('[HybridSpeechEngine] Falling back to browser speech synthesis', error);
        }
      }

      await runFallbackSynth(text);
    },
    [playEdgeAudio, runFallbackSynth, stop, voiceOutputEnabled]
  );

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, [stop]);

  return {
    speechSupported: typeof window !== 'undefined' && ('speechSynthesis' in window || 'AudioContext' in window),
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    speak,
    stop,
    speaking: frame.speaking,
    mouthLevel: frame.mouthLevel,
  };
}
