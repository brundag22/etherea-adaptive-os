import { useEffect, useMemo, useState } from 'react';
import { Avatar } from './components/Avatar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotesPanel } from './components/NotesPanel';
import { ParticleCanvas } from './components/ParticleCanvas';
import { Toast } from './components/Toast';
import { STORAGE_ERROR_EVENT } from './lib/fileSystem';
import { useEthereaBrain } from './lib/useEthereaBrain';
import { useSpeechEngine } from './lib/useSpeechEngine';
import { useToast } from './lib/toast';

type ShellPanel = 'notes' | 'agent' | 'settings';

const IconMenu = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconWorkspace = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z" stroke="currentColor" fill="none"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IconSettings = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" fill="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const IconAgent = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 4v10l-7 4-7-4V7z" stroke="currentColor" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;

export function App() {
  const [activePanel, setActivePanel] = useState<ShellPanel>('notes');
  const [clock, setClock] = useState(new Date());
  const [input, setInput] = useState('');
  const { lastOutput, contractPreview, processInput } = useEthereaBrain();
  const { speechSupported, voiceOutputEnabled, setVoiceOutputEnabled, speak, speaking, mouthLevel } = useSpeechEngine();
  const { toast, showError } = useToast();

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lastOutput.response) return;
    void speak(lastOutput.response);
  }, [lastOutput.response, speak]);

  useEffect(() => {
    const onStorageError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      showError(customEvent.detail?.message ?? 'Notes storage unavailable.');
    };
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError as EventListener);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError as EventListener);
  }, [showError]);

  const nav = useMemo(
    () => [
      { id: 'notes' as const, label: 'Workspace', icon: <IconWorkspace /> },
      { id: 'agent' as const, label: 'Agent', icon: <IconAgent /> },
      { id: 'settings' as const, label: 'Settings', icon: <IconSettings /> },
    ],
    [],
  );

  return (
    <div className="webos-root">
      <ParticleCanvas />
      <div className="aurora-bg" aria-hidden="true" />

      <header className="top-menu glass-card">
        <div className="brand-wrap"><IconMenu /><strong>Etherea Adaptive OS</strong></div>
        <div className="status-tray">
          <span className="status-pill">{clock.toLocaleTimeString()}</span>
          <span className="status-pill">Emotion: {lastOutput.emotion_update}</span>
          <button className="status-pill" onClick={() => setVoiceOutputEnabled((prev) => !prev)} type="button">Voice: {voiceOutputEnabled ? 'ON' : 'OFF'}</button>
          <span className="status-pill">{speechSupported ? 'Hybrid TTS Ready' : 'Speech Disabled'}</span>
        </div>
      </header>

      <ErrorBoundary fallback={<section className="glass-card panel-content error-fallback" role="alert"><p>Module Offline</p></section>}>
        <div className="webos-layout">
          <aside className="sidebar glass-card">
            {nav.map((item) => (
              <button key={item.id} className={activePanel === item.id ? 'item active icon-item' : 'item icon-item'} onClick={() => setActivePanel(item.id)} type="button">
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </aside>

          <main className="main-area glass-card">
            {activePanel === 'notes' && <NotesPanel activeWorkspace="Primary" approvedWorkspaces={['Primary', 'Research', 'Personal', 'Archive']} />}
            {activePanel === 'agent' && (
              <section className="panel-content">
                <h3>EI Brain Output JSON</h3>
                <pre className="brain-contract">{contractPreview}</pre>
              </section>
            )}
            {activePanel === 'settings' && <section className="panel-content"><h3>Settings</h3><p>Neon Aurora Glass enabled.</p></section>}

            <form className="brain-input-row" onSubmit={(event) => { event.preventDefault(); processInput(input); setInput(''); setActivePanel('agent'); }}>
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Etherea..." />
              <button className="item" type="submit">Send</button>
            </form>
          </main>
        </div>
      </ErrorBoundary>

      <Avatar emotion={lastOutput.emotion_update} mood={lastOutput.mood} impulse={lastOutput.impulse} speaking={speaking} mouthLevel={mouthLevel} />
      <Toast message={toast?.message ?? null} type={toast?.type} />
    </div>
  );
}
