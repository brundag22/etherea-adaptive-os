import { useEffect, useMemo, useState } from 'react';
import { Avatar } from './components/Avatar';
import { NotesPanel } from './components/NotesPanel';
import { useEthereaBrain } from './lib/useEthereaBrain';
import { useSpeechEngine } from './lib/useSpeechEngine';

type ShellPanel = 'notes' | 'agent' | 'settings';

const workspaces = ['Primary', 'Research', 'Personal', 'Archive'];
const tools = ['Composer', 'Memory', 'Timeline', 'Diagnostics'];

export function App() {
  const [activePanel, setActivePanel] = useState<ShellPanel>('notes');
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
  const [clock, setClock] = useState(new Date());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [brainInput, setBrainInput] = useState('');
  const { lastOutput, contractPreview, processInput } = useEthereaBrain();
  const { speechSupported, voiceOutputEnabled, setVoiceOutputEnabled, speak, speaking, mouthLevel } = useSpeechEngine();

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (event.key === 'Escape') setPaletteOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    speak(lastOutput.response);
  }, [lastOutput.response, speak]);

  const menuCommands = useMemo(
    () =>
      [
        'Open Notes',
        'Switch to Agent',
        'Open Settings',
        'New Markdown Note',
        'Toggle Focus Mode',
        'Run Offline Self-check',
      ].filter((item) => item.toLowerCase().includes(paletteQuery.toLowerCase())),
    [paletteQuery]
  );

  const submitBrainInput = () => {
    processInput(brainInput);
    setBrainInput('');
    setActivePanel('agent');
  };

  return (
    <div className="webos-root">
      <div className="aurora-bg" aria-hidden="true" />

      <header className="top-menu glass-card">
        <div className="brand-wrap">
          <div className="brand-orb" aria-hidden="true" />
          <div>
            <h1>Etherea</h1>
            <p>Adaptive Living OS</p>
          </div>
        </div>

        <div className="status-tray">
          <span className="status-pill">Offline-ready</span>
          <span className="status-pill">Clock {clock.toLocaleTimeString()}</span>
          <span className="status-pill">Emotion {lastOutput.emotion_update}</span>
          <button className="status-pill" onClick={() => setVoiceOutputEnabled((prev) => !prev)} type="button">
            Voice Output: {voiceOutputEnabled ? 'ON' : 'OFF'}
          </button>
          <button className="status-pill mic-kill" type="button" aria-pressed="false" title="Microphone capture is hard-disabled in this build.">
            Microphone: OFF
          </button>
        </div>
      </header>

      <div className="webos-layout">
        <aside className="sidebar glass-card">
          <section>
            <h2>Workspaces</h2>
            <ul>
              {workspaces.map((name) => (
                <li key={name}>
                  <button
                    className={name === activeWorkspace ? 'item active' : 'item'}
                    onClick={() => setActiveWorkspace(name)}
                    type="button"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Tools</h2>
            <ul>
              {tools.map((name) => (
                <li key={name}>
                  <button className="item" type="button">
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <main className="main-area glass-card">
          <nav className="panel-tabs" aria-label="Main panels">
            <button className={activePanel === 'notes' ? 'tab active' : 'tab'} onClick={() => setActivePanel('notes')} type="button">
              Notes
            </button>
            <button className={activePanel === 'agent' ? 'tab active' : 'tab'} onClick={() => setActivePanel('agent')} type="button">
              Agent
            </button>
            <button className={activePanel === 'settings' ? 'tab active' : 'tab'} onClick={() => setActivePanel('settings')} type="button">
              Settings
            </button>
          </nav>

          {activePanel === 'notes' && <NotesPanel activeWorkspace={activeWorkspace} approvedWorkspaces={workspaces} />}
          {activePanel === 'agent' && (
            <section className="panel-content">
              <h3>Offline Brain Console</h3>
              <p>{lastOutput.response}</p>
              <pre className="brain-contract">{contractPreview}</pre>
            </section>
          )}
          {activePanel === 'settings' && (
            <section className="panel-content">
              <h3>System Settings</h3>
              <p>Privacy defaults, voice controls, and workspace tuning can be configured here.</p>
              <div className="settings-row">
                <span>Voice Output</span>
                <button className="item" type="button" onClick={() => setVoiceOutputEnabled((prev) => !prev)}>
                  {voiceOutputEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="settings-row">
                <span>Speech Engine</span>
                <span className="status-pill">{speechSupported ? 'Browser SpeechSynthesis' : 'Unsupported browser'}</span>
              </div>
              <div className="settings-row">
                <span>Microphone Privacy Kill Switch</span>
                <span className="status-pill mic-kill">OFF (Unwired)</span>
              </div>
            </section>
          )}

          <form
            className="brain-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              submitBrainInput();
            }}
          >
            <input
              value={brainInput}
              onChange={(event) => setBrainInput(event.target.value)}
              placeholder="Talk to Etherea offline..."
              aria-label="Offline brain input"
            />
            <button className="item" type="submit">
              Send
            </button>
          </form>
        </main>
      </div>

      <Avatar emotion={lastOutput.emotion_update} speaking={speaking} mouthLevel={mouthLevel} />

      <button className="palette-trigger" onClick={() => setPaletteOpen(true)} type="button">
        ⌘K Command Palette
      </button>

      {paletteOpen && (
        <div className="palette-backdrop" role="presentation" onClick={() => setPaletteOpen(false)}>
          <section className="palette glass-card" role="dialog" aria-label="Command Palette" onClick={(event) => event.stopPropagation()}>
            <input
              autoFocus
              value={paletteQuery}
              onChange={(event) => setPaletteQuery(event.target.value)}
              placeholder="Jump to command..."
            />
            <ul>
              {menuCommands.map((command) => (
                <li key={command}>
                  <button className="item" type="button" onClick={() => setPaletteOpen(false)}>
                    {command}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
