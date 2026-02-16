import { useEffect, useMemo, useState } from 'react';
import { runAgentAction, type AgentAction, type AgentResult } from '@etherea/core';
import { AvatarStage, type DockMode, type Emotion } from './components/AvatarStage';
import { Toast } from './components/Toast';
import { WorkspacePanel } from './components/WorkspacePanel';
import { executeCommand } from './lib/commands';
import { speak } from './lib/brain';
import { applyTheme, loadTheme, saveTheme, type ThemeSettings } from './lib/theme';
import { listWorkspace, type WorkspaceFile } from './lib/workspaceStore';
import { getVoiceState, speakReply, startListening, stopListening, stopSpeaking, subscribeVoiceAnimation } from './lib/voice';
import { useToast } from './lib/toast';

type Panel = 'notes' | 'agent' | 'settings';
type Message = { role: 'user' | 'etherea' | 'system'; text: string };
type SelfcheckItem = { key: string; pass: boolean; details: string };

const intro = 'Future of intelligence starts with emotional intelligence. I am Etherea, ready when you are.';
const workspaceNames = ['Primary', 'Research', 'Teaching'];
const agentActions: AgentAction[] = ['generate_notes', 'summarize_pdf', 'create_ppt'];

export function App() {
  const [panel, setPanel] = useState<Panel>('notes');
  const [workspace, setWorkspace] = useState(workspaceNames[0]);
  const [messages, setMessages] = useState<Message[]>([{ role: 'etherea', text: intro }]);
  const [theme, setTheme] = useState<ThemeSettings>(() => loadTheme());
  const [emotion, setEmotion] = useState<Emotion>({ mood: 'calm', intensity: 0.5 });
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [voiceStatus, setVoiceStatus] = useState('Voice OFF · Mic n/a');
  const [composer, setComposer] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [mouthLevel, setMouthLevel] = useState(0);
  const [avatarDock, setAvatarDock] = useState<DockMode>('corner');
  const [agentTask, setAgentTask] = useState<AgentAction>('generate_notes');
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [lastBrainContract, setLastBrainContract] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState('never');
  const { toast, showError, showInfo, showSuccess } = useToast();

  const refreshWorkspace = async () => setFiles(await listWorkspace());
  const activeTeachMode = useMemo(() => /\b(teach|explain)\b/i.test(composer), [composer]);

  useEffect(() => {
    refreshWorkspace();
  }, []);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const stop = subscribeVoiceAnimation((state) => {
      setSpeaking(state.speaking);
      setMouthLevel(state.mouthLevel);
    });
    return stop;
  }, []);

  useEffect(() => {
    const state = getVoiceState();
    const micState = theme.privacyKillSwitch ? 'Mic blocked' : theme.micOptIn ? 'Mic opt-in' : 'Mic OFF';
    setVoiceStatus(`${theme.voiceOutputEnabled ? 'Voice ON' : 'Voice OFF'} · ${state.recognitionSupported ? micState : 'Mic n/a'}`);
  }, [theme.micOptIn, theme.privacyKillSwitch, theme.voiceOutputEnabled]);

  useEffect(() => {
    if (theme.privacyKillSwitch) {
      stopListening();
      if (theme.micOptIn) setTheme((prev) => ({ ...prev, micOptIn: false }));
    }
  }, [theme.privacyKillSwitch, theme.micOptIn]);

  const runPrompt = async (input: string) => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setComposer('');

    const result = await speak(text);
    setEmotion(result.emotion_update);
    setLastBrainContract(JSON.stringify(result, null, 2));
    setMessages((prev) => [...prev, { role: 'etherea', text: result.response }]);

    if (theme.voiceOutputEnabled && !theme.privacyKillSwitch) {
      const tts = speakReply(result.response, result.command?.args?.lang as string | undefined);
      if (!tts.ok) showError(tts.reason ?? 'Voice output unavailable.');
    }

    if (!result.command) return;

    try {
      const note = await executeCommand(result.command, theme, setTheme);
      setMessages((prev) => [...prev, { role: 'system', text: `Action: ${note}` }]);
      showSuccess(note);
      await refreshWorkspace();
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Command failed';
      setMessages((prev) => [...prev, { role: 'system', text: `Action failed: ${reason}` }]);
      showError(reason);
    }
  };

  const runAgent = async () => {
    setAgentStatus('running');
    try {
      const result = runAgentAction(agentTask);
      setAgentResult(result);
      setAgentStatus('done');
      setMessages((prev) => [...prev, { role: 'system', text: `Agent action completed: ${agentTask}` }]);
      showSuccess(`Agent completed ${agentTask}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Agent action failed';
      setAgentStatus('idle');
      showError(reason);
    }
  };

  const selfchecks: SelfcheckItem[] = [
    { key: 'Avatar overlay draggable', pass: avatarDock !== 'hidden', details: `Dock state: ${avatarDock}` },
    {
      key: 'Offline brain contract',
      pass: /"response"|"command"|"save_memory"|"emotion_update"/.test(lastBrainContract),
      details: lastBrainContract ? 'Contract captured from latest prompt.' : 'Run a prompt to capture contract.',
    },
    { key: 'Emotion update visible', pass: emotion.intensity > 0, details: `Mood ${emotion.mood} at intensity ${emotion.intensity.toFixed(2)}.` },
    { key: 'Voice toggle available', pass: true, details: voiceStatus },
    { key: 'Notes save/load', pass: files.some((item) => item.path.endsWith('.md')), details: `${files.length} workspace items loaded.` },
    { key: 'Agent action wiring', pass: Boolean(agentResult), details: agentResult ? `Last task: ${agentResult.task}` : 'Run an agent action in Agent panel.' },
  ];

  return (
    <main className={`app-shell avatar-${avatarDock}`}>
      <header className="app-bar panel-pop">
        <div className="brand-block">
          <div className="brand-dot" aria-hidden="true" />
          <div>
            <p className="title">Etherea WebOS</p>
            <p className="subtitle">Offline-first adaptive shell</p>
          </div>
        </div>
        <div className="bar-chips">
          <span className="chip">Wi-Fi ∘</span>
          <span className="chip">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button className="chip icon-btn" onClick={() => setPanel('settings')}>
            ⚙ Settings
          </button>
        </div>
      </header>

      <div className="layout-grid">
        <aside className="nav-rail panel-pop">
          <h3 className="nav-title">Workspaces</h3>
          {workspaceNames.map((item) => (
            <button key={item} className={`nav-btn ${workspace === item ? 'active' : ''}`} onClick={() => setWorkspace(item)}>
              {item}
            </button>
          ))}
          <h3 className="nav-title">Quick actions</h3>
          <button className={`nav-btn ${panel === 'notes' ? 'active' : ''}`} onClick={() => setPanel('notes')}>
            Notes
          </button>
          <button className={`nav-btn ${panel === 'agent' ? 'active' : ''}`} onClick={() => setPanel('agent')}>
            Agent
          </button>
          <button className={`nav-btn ${panel === 'settings' ? 'active' : ''}`} onClick={() => setPanel('settings')}>
            Settings
          </button>
        </aside>

        <section className="main-content">
          {panel === 'notes' && (
            <section className="panel workspace-panel panel-pop focus-outline">
              <h2>{workspace} · Notes</h2>
              <WorkspacePanel files={files} onRefresh={refreshWorkspace} />
            </section>
          )}

          {panel === 'agent' && (
            <section className="panel agent-panel panel-pop focus-outline">
              <h2>Agent</h2>
              <div className="row">
                <select value={agentTask} onChange={(event) => setAgentTask(event.target.value as AgentAction)}>
                  {agentActions.map((task) => (
                    <option key={task} value={task}>
                      {task}
                    </option>
                  ))}
                </select>
                <button onClick={runAgent} disabled={agentStatus === 'running'}>
                  {agentStatus === 'running' ? 'Running...' : 'Run action'}
                </button>
              </div>
              <p className="small">Status: {agentStatus}</p>
              {agentResult && <pre className="agent-output">{JSON.stringify(agentResult, null, 2)}</pre>}
              <div className="chatlog">
                {messages.slice(-8).map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                    {message.text}
                  </div>
                ))}
              </div>
            </section>
          )}

          {panel === 'settings' && (
            <section className="panel settings-panel panel-pop">
              <h2>Settings</h2>
              <label>
                Voice output
                <input type="checkbox" checked={theme.voiceOutputEnabled} onChange={(event) => setTheme({ ...theme, voiceOutputEnabled: event.target.checked })} />
              </label>
              <label>
                Mic kill switch (ON keeps mic OFF)
                <input
                  type="checkbox"
                  checked={theme.privacyKillSwitch}
                  onChange={(event) => setTheme({ ...theme, privacyKillSwitch: event.target.checked, micOptIn: event.target.checked ? false : theme.micOptIn })}
                />
              </label>
              <label>
                Mic opt-in
                <input
                  type="checkbox"
                  checked={theme.micOptIn}
                  onChange={(event) => {
                    if (theme.privacyKillSwitch && event.target.checked) {
                      showInfo('Turn off the kill switch before enabling mic.');
                      return;
                    }
                    setTheme({ ...theme, micOptIn: event.target.checked });
                  }}
                />
              </label>
              <label>
                Reduced motion
                <input type="checkbox" checked={theme.reducedMotion} onChange={(event) => setTheme({ ...theme, reducedMotion: event.target.checked })} />
              </label>
              <div className="row">
                <button onClick={() => stopSpeaking()}>Stop voice</button>
                <button
                  onClick={() => {
                    if (!theme.micOptIn || theme.privacyKillSwitch) {
                      showInfo('Mic is OFF by default. Enable mic opt-in first.');
                      return;
                    }
                    const started = startListening(
                      (spoken) => runPrompt(spoken),
                      (message) => showError(message),
                    );
                    if (!started.ok) showError(started.reason ?? 'Mic unavailable.');
                    else showSuccess('Listening started.');
                  }}
                >
                  Start mic
                </button>
                <button onClick={() => stopListening()}>Stop mic</button>
              </div>
              <h3>Selfcheck</h3>
              <div className="selfcheck-list">
                {selfchecks.map((item) => (
                  <article key={item.key} className={`selfcheck-item ${item.pass ? 'pass' : 'warn'}`}>
                    <strong>{item.pass ? '✅' : '⚠️'} {item.key}</strong>
                    <p>{item.details}</p>
                  </article>
                ))}
              </div>
              <p className="small">Mic off by default. Enable mic opt-in explicitly when needed.</p>
              <p className="small">Last save event: {lastSavedAt}</p>
            </section>
          )}
        </section>
      </div>

      <form
        className="command-dock panel-pop"
        onSubmit={(event) => {
          event.preventDefault();
          runPrompt(composer);
        }}
      >
        <input value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="Type command or ask naturally" />
        <button type="submit">Send</button>
      </form>

      <AvatarStage emotion={emotion} reducedMotion={theme.reducedMotion} speaking={speaking} mouthLevel={mouthLevel} explaining={activeTeachMode} onDockChange={setAvatarDock} />
      <Toast message={toast?.message ?? null} type={toast?.type ?? 'info'} />
    </main>
  );
}
