import bankData from '../brain.json';
import type { BrainCommand } from './commands';

type Emotion = { mood: 'calm' | 'focused' | 'curious' | 'hype' | 'care' | 'stressed'; intensity: number };

type BrainResult = {
  response: string;
  command: BrainCommand | null;
  save_memory: Record<string, unknown>;
  emotion_update: Emotion;
};

type IntentBank = {
  intents: Record<string, { patterns: string[]; responses: string[]; emotion: Emotion }>;
  microLines?: Record<string, string[]>;
};

const EI_PREFIX = [
  'Future of intelligence begins with emotional intelligence.',
  'Etherea EI loop active: sense, name, choose, act.',
  'Premium offline cognition online: your EI-first assistant is present.',
];

function hash(text: string) {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) value = (value * 31 + text.charCodeAt(index)) >>> 0;
  return value;
}

function pick(text: string, rows: string[]) {
  return rows[hash(text) % rows.length];
}

function clampIntensity(value: number) {
  return Math.max(0.2, Math.min(0.95, value));
}

async function loadBank(): Promise<IntentBank> {
  return bankData as IntentBank;
}

function sanitize(text: string) {
  return text
    .replace(/as an ai[^.]*\.?/gi, '')
    .replace(/language model[^.]*\.?/gi, '')
    .replace(/openai[^.]*\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function teach(topic: string): string {
  return [
    `${pick(topic, EI_PREFIX)} Definition: ${topic} estimates how one variable changes with another so we can predict outcomes.`,
    'Example: If study hours increase, test scores often rise. Regression helps estimate the slope of that relationship.',
    'Steps: (1) define target + features, (2) inspect data quality and outliers, (3) split train/test, (4) fit baseline model, (5) evaluate and iterate.',
    'Check questions: What does the coefficient sign tell you? How do you know if overfitting happened?',
    'Exercise: Build a tiny dataset with 8 rows, run linear regression, and explain one prediction in plain language.',
  ].join(' ');
}

function parseSettingCommand(text: string): BrainCommand | null {
  if (/toggle reduced motion/i.test(text)) return { name: 'set_theme', args: { reducedMotion: true } };
  if (/disable reduced motion/i.test(text)) return { name: 'set_theme', args: { reducedMotion: false } };
  const preset = text.match(/set theme preset\s+([\w-]+)/i);
  if (preset) return { name: 'set_theme', args: { preset: preset[1] } };
  const accent = text.match(/set accent\s+(#[0-9a-f]{6})/i);
  if (accent) return { name: 'set_theme', args: { accent: accent[1] } };
  if (/voice output on/i.test(text)) return { name: 'set_voice_output', args: { enabled: true } };
  if (/voice output off/i.test(text)) return { name: 'set_voice_output', args: { enabled: false } };
  if (/mic opt-in on|enable mic/i.test(text)) return { name: 'set_mic_opt_in', args: { enabled: true } };
  if (/mic opt-in off|disable mic/i.test(text)) return { name: 'set_mic_opt_in', args: { enabled: false } };
  return null;
}

function parseWorkspaceCommand(text: string): BrainCommand | null {
  const create = text.match(/create file\s+([^\s]+)(?:\s+with\s+([\s\S]+))?/i);
  if (create) return { name: 'create_file', args: { path: create[1], content: create[2] ?? '' } };
  const edit = text.match(/edit file\s+([^\s]+)\s+with\s+([\s\S]+)/i);
  if (edit) return { name: 'edit_file', args: { path: edit[1], content: edit[2] } };
  const summarize = text.match(/summarize file\s+([^\s]+)/i);
  if (summarize) return { name: 'summarize_file', args: { path: summarize[1] } };
  if (/^list files/i.test(text)) return { name: 'list_files', args: { depth: 4 } };
  if (/allow workspace root/i.test(text)) return { name: 'allow_workspace_root', args: {} };
  return null;
}

function parseSlash(text: string): BrainCommand | null {
  const [head, ...rest] = text.trim().slice(1).split(' ');
  const arg = rest.join(' ').trim();
  if (head === 'create') return { name: 'create_file', args: { path: arg, content: '' } };
  if (head === 'edit') return { name: 'edit_file', args: { path: arg, content: '' } };
  if (head === 'summarize') return { name: 'summarize_file', args: { path: arg } };
  if (head === 'list') return { name: 'list_files', args: { depth: 4 } };
  if (head === 'help') return { name: 'help', args: {} };
  return null;
}

export async function speak(input: string): Promise<BrainResult> {
  const text = input.trim();
  const bank = await loadBank();

  const command = text.startsWith('/') ? parseSlash(text) : parseWorkspaceCommand(text) ?? parseSettingCommand(text);

  if (/teach\s+/i.test(text)) {
    const topic = text.replace(/teach/i, '').trim() || 'this topic';
    return {
      response: sanitize(teach(topic)),
      command,
      save_memory: { topic, used: true },
      emotion_update: { mood: 'focused', intensity: 0.72 },
    };
  }

  if (/what is emotional intelligence|ei intro|explain ei/i.test(text)) {
    return {
      response: sanitize(
        `${pick(text, EI_PREFIX)} Emotional intelligence means noticing state, naming it, and choosing a useful next move. I map your cues to mood, adjust behavior, and keep the full loop local-first.`,
      ),
      command,
      save_memory: { topic: 'ei_intro', used: true },
      emotion_update: { mood: 'care', intensity: 0.64 },
    };
  }

  const selected =
    Object.values(bank.intents).find((intent) => intent.patterns.some((pattern) => new RegExp(pattern, 'i').test(text))) ?? bank.intents.default;
  const line = bank.microLines?.[selected.emotion.mood]?.[hash(text) % (bank.microLines[selected.emotion.mood]?.length ?? 1)] ?? '';

  return {
    response: sanitize(`${pick(text, EI_PREFIX)} ${pick(text, selected.responses)} ${line}`.trim()),
    command,
    save_memory: { last_intent_mood: selected.emotion.mood, ts: Date.now() },
    emotion_update: { mood: selected.emotion.mood, intensity: clampIntensity(selected.emotion.intensity) },
  };
}
