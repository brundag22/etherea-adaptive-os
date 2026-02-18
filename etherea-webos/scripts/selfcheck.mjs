import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

const appText = read('apps/web/src/App.tsx');
const avatarText = read('apps/web/src/components/AvatarStage.tsx');
const voiceText = read('apps/web/src/lib/voice.ts');
const workspaceText = read('apps/web/src/components/WorkspacePanel.tsx');
const storeText = read('apps/web/src/lib/workspaceStore.ts');
const brainText = read('apps/web/src/lib/brain.ts');
const commandsText = read('apps/web/src/lib/commands.ts');
const brainHookText = read('apps/web/src/lib/useEthereaBrain.ts');
const themeText = read('apps/web/src/lib/theme.ts');

const checks = [
  ['indexeddb workspace persistence exists', storeText.includes('indexedDB.open') && storeText.includes('listWorkspace') && storeText.includes('upsertNode')],
  ['workspace markdown embeds etherea_state block', workspaceText.includes('```etherea_state') && workspaceText.includes('ensureStateBlock')],
  ['agent command execution is wired', brainHookText.includes('result.command') && brainHookText.includes("command.name === 'create_file'") && commandsText.includes('create_file')],
  ['offline brain command parsing is present', brainText.includes('parseWorkspaceCommand') && brainText.includes('emotion_update')],
  ['tts uses speechSynthesis with Indian language preference', voiceText.includes('speechSynthesis') && voiceText.includes("'hi-IN'") && voiceText.includes("'en-IN'")],
  ['mic remains opt-in with kill switch control', commandsText.includes("command.name === 'set_mic_opt_in'") && themeText.includes('privacyKillSwitch') && appText.includes('Mic OFF')],
  ['avatar idle animation + emotion + speaking mouth movement exist', avatarText.includes('avatar-float') && avatarText.includes('avatar-breathe') && avatarText.includes('emotion.mood') && avatarText.includes('mouthLevel') && avatarText.includes("speaking ? 'speaking' : ''")],
];

let pass = true;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) pass = false;
}
process.exit(pass ? 0 : 1);
