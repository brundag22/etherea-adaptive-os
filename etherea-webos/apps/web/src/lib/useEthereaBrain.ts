import { useCallback, useMemo, useState } from 'react';
import { speak as runBrain } from './brain';
import { create_file, edit_file, get_file, list_files } from './fileSystem';

export type EthereaEmotion = 'happy' | 'thinking' | 'listening' | 'neutral' | 'concern';

export type EthereaBrainOutput = {
  response: string;
  command: string | null;
  save_memory: string | null;
  emotion_update: EthereaEmotion;
  mood: 'frustrated' | 'happy' | 'question' | 'neutral';
  avatarImpulse: number;
};

function mapEmotion(mood: 'calm' | 'focused' | 'curious' | 'hype' | 'care' | 'stressed'): EthereaEmotion {
  if (mood === 'hype') return 'happy';
  if (mood === 'focused' || mood === 'curious') return 'thinking';
  if (mood === 'care') return 'listening';
  if (mood === 'stressed') return 'concern';
  return 'neutral';
}

function mapMood(mood: 'calm' | 'focused' | 'curious' | 'hype' | 'care' | 'stressed'): EthereaBrainOutput['mood'] {
  if (mood === 'hype') return 'happy';
  if (mood === 'focused' || mood === 'curious') return 'question';
  if (mood === 'stressed') return 'frustrated';
  return 'neutral';
}

export function useEthereaBrain(approvedWorkspaces: string[]) {
  const [lastOutput, setLastOutput] = useState<EthereaBrainOutput>({
    response: 'Etherea is standing by in fully offline mode.',
    command: null,
    save_memory: null,
    emotion_update: 'neutral',
    mood: 'neutral',
    avatarImpulse: Date.now(),
  });

  const processInput = useCallback(
    async (input: string): Promise<EthereaBrainOutput> => {
      const result = await runBrain(input);
      let commandNote: string | null = null;

      if (result.command) {
        const command = result.command;
        try {
          if (command.name === 'create_file') {
            const path = String(command.args.path ?? '');
            const content = String(command.args.content ?? '');
            await create_file(path, content, approvedWorkspaces);
            commandNote = `Created ${path}`;
          } else if (command.name === 'edit_file') {
            const path = String(command.args.path ?? '');
            const content = String(command.args.content ?? '');
            await edit_file(path, content, approvedWorkspaces);
            commandNote = `Updated ${path}`;
          } else if (command.name === 'summarize_file') {
            const path = String(command.args.path ?? '');
            const file = await get_file(path, approvedWorkspaces);
            commandNote = file ? `${path}: ${file.content.split('\n').length} lines` : `File not found: ${path}`;
          } else if (command.name === 'list_files') {
            const rows = await list_files(approvedWorkspaces);
            commandNote = rows.length ? rows.map((row) => row.filename).slice(0, 10).join(', ') : 'No files found in approved workspaces.';
          } else {
            commandNote = `Command prepared: ${command.name}`;
          }
        } catch (error) {
          commandNote = `Command failed (${command.name}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }

      const output: EthereaBrainOutput = {
        response: commandNote ? `${result.response} ${commandNote}` : result.response,
        command: result.command?.name ?? null,
        save_memory: JSON.stringify(result.save_memory),
        emotion_update: mapEmotion(result.emotion_update.mood),
        mood: mapMood(result.emotion_update.mood),
        avatarImpulse: Date.now(),
      };

      setLastOutput(output);
      return output;
    },
    [approvedWorkspaces],
  );

  const contractPreview = useMemo(() => JSON.stringify(lastOutput, null, 2), [lastOutput]);

  return {
    lastOutput,
    contractPreview,
    processInput,
  };
}
