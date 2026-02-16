export type VoiceState = {
  speechSupported: boolean;
  recognitionSupported: boolean;
  speaking: boolean;
  listening: boolean;
};

export type VoiceAnimationState = {
  speaking: boolean;
  mouthLevel: number;
};

type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => RecognitionLike;

const browser = window as Window & {
  webkitSpeechRecognition?: SpeechRecognitionCtor;
  SpeechRecognition?: SpeechRecognitionCtor;
};

const animationListeners = new Set<(state: VoiceAnimationState) => void>();
let recognition: RecognitionLike | null = null;
let envelopeTimer = 0;

function publishAnimation(state: VoiceAnimationState) {
  animationListeners.forEach((listener) => listener(state));
}

export function subscribeVoiceAnimation(listener: (state: VoiceAnimationState) => void) {
  animationListeners.add(listener);
  return () => {
    animationListeners.delete(listener);
  };
}

export function getVoiceState(): VoiceState {
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  return {
    speechSupported,
    recognitionSupported: Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition),
    speaking: speechSupported && window.speechSynthesis.speaking,
    listening: Boolean(recognition),
  };
}

function chooseVoice(langHint?: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const preferredLangs = [langHint, 'hi-IN', 'kn-IN', 'ta-IN', 'te-IN', 'en-IN', 'en-US'].filter(Boolean) as string[];
  for (const lang of preferredLangs) {
    const voice = voices.find((entry) => entry.lang.toLowerCase() === lang.toLowerCase() || entry.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0]));
    if (voice) return voice;
  }
  return voices[0] ?? null;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.clearInterval(envelopeTimer);
    publishAnimation({ speaking: false, mouthLevel: 0 });
  }
}

export function speakReply(text: string, langHint?: string): { ok: boolean; reason?: string } {
  if (!('speechSynthesis' in window)) {
    return { ok: false, reason: 'Speech synthesis is not supported here.' };
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = chooseVoice(langHint);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  utterance.rate = 0.98;
  utterance.pitch = 1.02;

  utterance.onstart = () => {
    publishAnimation({ speaking: true, mouthLevel: 0.5 });
  };

  utterance.onboundary = () => {
    publishAnimation({ speaking: true, mouthLevel: 0.35 + Math.random() * 0.65 });
  };

  utterance.onend = () => {
    window.clearInterval(envelopeTimer);
    publishAnimation({ speaking: false, mouthLevel: 0 });
  };

  utterance.onerror = () => {
    window.clearInterval(envelopeTimer);
    publishAnimation({ speaking: false, mouthLevel: 0 });
  };

  const duration = Math.max(1000, text.length * 42);
  const start = performance.now();
  envelopeTimer = window.setInterval(() => {
    const elapsed = performance.now() - start;
    if (elapsed >= duration) {
      window.clearInterval(envelopeTimer);
      return;
    }
    const phase = elapsed / 140;
    const pulse = Math.abs(Math.sin(phase)) * 0.9;
    publishAnimation({ speaking: true, mouthLevel: pulse });
  }, 120);

  window.speechSynthesis.speak(utterance);
  return { ok: true };
}

export function startListening(
  onFinalText: (text: string) => void,
  onError: (message: string) => void,
): { ok: boolean; reason?: string } {
  if (recognition) return { ok: true };
  const Ctor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  if (!Ctor) return { ok: false, reason: 'Speech recognition not supported here.' };

  const instance = new Ctor();
  instance.continuous = false;
  instance.interimResults = false;
  instance.lang = 'en-IN';
  instance.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (transcript) onFinalText(transcript);
  };
  instance.onerror = () => {
    onError('Mic input failed. You can continue typing.');
  };
  instance.onend = () => {
    recognition = null;
  };

  recognition = instance;
  instance.start();
  return { ok: true };
}

export function stopListening() {
  recognition?.stop();
  recognition = null;
}
