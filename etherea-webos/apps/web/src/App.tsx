import { useEffect, useMemo, useState } from 'react';
import { Avatar } from './components/Avatar';
import { useEthereaBrain } from './lib/useEthereaBrain';

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

          {activePanel === 'notes' && (
            <section className="panel-content">
              <h3>{activeWorkspace} Notes</h3>
              <p>Markdown notes with embedded Etherea state blocks will appear here.</p>
            </section>
          )}
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

      <Avatar emotion={lastOutput.emotion_update} />

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
