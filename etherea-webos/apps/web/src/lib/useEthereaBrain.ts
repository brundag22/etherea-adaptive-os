import { useCallback, useMemo, useState } from 'react';

export type EthereaEmotion = 'happy' | 'thinking' | 'listening' | 'neutral' | 'concern';

export type EthereaBrainOutput = {
  response: string;
  command: string | null;
  save_memory: string | null;
  emotion_update: EthereaEmotion;
  mood: 'frustrated' | 'happy' | 'question' | 'neutral';
  avatarImpulse: number;
};

const INTRO_RESPONSE =
  'Welcome to Etherea, the Living Adaptive Operating System. Emotional intelligence (EI) involves recognizing, understanding, and managing our own emotions as well as the emotions of others. It helps reduce digital fatigue and frustration from unresponsive interfaces.';

function buildContract(
  response: string,
  emotion_update: EthereaEmotion,
  command: string | null = null,
  save_memory: string | null = null,
  mood: EthereaBrainOutput['mood'] = 'neutral',
  avatarImpulse = Date.now()
): EthereaBrainOutput {
  return { response, command, save_memory, emotion_update, mood, avatarImpulse };
}

function detectMood(input: string): EthereaBrainOutput['mood'] {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return 'neutral';

  if (
    /\?|\b(why|how|what|can you|could you|help|explain|where|when)\b/i.test(normalized)
  ) {
    return 'question';
  }

  if (/\b(frustrated|angry|tired|stress|stressed|annoyed|upset|broken|crash|not working|error)\b/i.test(normalized)) {
    return 'frustrated';
  }

  if (/\b(thanks|great|awesome|love|nice|happy|good|perfect|cool)\b/i.test(normalized)) {
    return 'happy';
  }

  return 'neutral';
}

export function useEthereaBrain() {
  const [hasIntroduced, setHasIntroduced] = useState(false);
  const [lastOutput, setLastOutput] = useState<EthereaBrainOutput>(
    buildContract('Etherea is standing by in fully offline mode.', 'neutral')
  );

  const processInput = useCallback(
    (input: string): EthereaBrainOutput => {
      const normalized = input.trim().toLowerCase();
      const mood = detectMood(input);

      if (!hasIntroduced) {
        const intro = buildContract(INTRO_RESPONSE, 'happy', null, null, 'happy');
        setHasIntroduced(true);
        setLastOutput(intro);
        return intro;
      }

      if (!normalized) {
        const output = buildContract('I am listening. Share what you want to explore next.', 'listening', null, null, mood);
        setLastOutput(output);
        return output;
      }

      if (normalized.includes('remember')) {
        const memoryPayload = input.replace(/.*remember\s*/i, '').trim() || input.trim();
        const output = buildContract('Noted. I will retain that in local memory context.', 'listening', null, memoryPayload, mood);
        setLastOutput(output);
        return output;
      }

      if (normalized.includes('help') || normalized.includes('how')) {
        const output = buildContract(
          'I can help you organize notes, surface command actions, and adapt your workspace while staying fully offline.',
          'thinking',
          null,
          null,
          mood
        );
        setLastOutput(output);
        return output;
      }

      if (normalized.includes('open') && normalized.includes('settings')) {
        const output = buildContract('Opening Settings panel suggestion prepared.', 'thinking', 'open_settings', null, mood);
        setLastOutput(output);
        return output;
      }

      if (normalized.includes('stress') || normalized.includes('frustrated') || normalized.includes('tired')) {
        const output = buildContract(
          'I hear the strain. We can simplify the interface and reduce digital fatigue one step at a time.',
          'concern',
          null,
          null,
          'frustrated'
        );
        setLastOutput(output);
        return output;
      }

      const mappedEmotion: EthereaEmotion = mood === 'frustrated' ? 'concern' : mood === 'question' ? 'thinking' : 'happy';
      const output = buildContract(`Offline reflection received: "${input.trim()}". I am adapting with you.`, mappedEmotion, null, null, mood);
      setLastOutput(output);
      return output;
    },
    [hasIntroduced]
  );

  const contractPreview = useMemo(() => JSON.stringify(lastOutput, null, 2), [lastOutput]);

  return {
    lastOutput,
    contractPreview,
    processInput,
  };
}
