import { useCallback, useMemo, useState } from 'react';

export type EthereaEmotion = 'happy' | 'thinking' | 'listening' | 'neutral' | 'concern';
export type EthereaImpulse = 'blink' | 'tilt' | 'nod' | null;

export type EthereaBrainOutput = {
  response: string;
  emotion_update: EthereaEmotion;
  impulse: EthereaImpulse;
  mood: 'frustrated' | 'happy' | 'question' | 'neutral';
};

function detectMood(input: string): EthereaBrainOutput['mood'] {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return 'neutral';
  if (/\?|\b(why|how|what|help|explain|where|when)\b/i.test(normalized)) return 'question';
  if (/\b(frustrated|angry|stress|tired|upset|error|broken|not working)\b/i.test(normalized)) return 'frustrated';
  if (/\b(thanks|great|awesome|love|happy|good|perfect|cool)\b/i.test(normalized)) return 'happy';
  return 'neutral';
}

function impulseForMood(mood: EthereaBrainOutput['mood']): EthereaImpulse {
  if (mood === 'question') return 'tilt';
  if (mood === 'frustrated') return 'blink';
  if (mood === 'happy') return 'nod';
  return 'blink';
}

function contract(response: string, emotion_update: EthereaEmotion, mood: EthereaBrainOutput['mood'], impulse: EthereaImpulse): EthereaBrainOutput {
  return { response, emotion_update, mood, impulse };
}

export function useEthereaBrain() {
  const [lastOutput, setLastOutput] = useState<EthereaBrainOutput>(contract('Etherea is standing by in fully offline mode.', 'neutral', 'neutral', null));

  const processInput = useCallback((input: string): EthereaBrainOutput => {
    const mood = detectMood(input);
    const normalized = input.trim();

    if (!normalized) {
      const out = contract('I am listening. Share what you want to explore next.', 'listening', mood, 'blink');
      setLastOutput(out);
      return out;
    }

    if (mood === 'frustrated') {
      const out = contract('I hear the strain. I can simplify your workspace and help you recover focus.', 'concern', mood, 'blink');
      setLastOutput(out);
      return out;
    }

    if (mood === 'question') {
      const out = contract('Good question. I will reason through this clearly and keep it practical.', 'thinking', mood, 'tilt');
      setLastOutput(out);
      return out;
    }

    const emotion: EthereaEmotion = mood === 'happy' ? 'happy' : 'neutral';
    const out = contract(`Offline reflection received: "${normalized}". I am adapting with you.`, emotion, mood, impulseForMood(mood));
    setLastOutput(out);
    return out;
  }, []);

  const contractPreview = useMemo(() => JSON.stringify(lastOutput, null, 2), [lastOutput]);

  return { lastOutput, contractPreview, processInput };
}
