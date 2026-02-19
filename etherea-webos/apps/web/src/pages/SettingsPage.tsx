import { useEffect, useState } from 'react';
import { Card } from '../components/shell/Card';
import { Modal } from '../components/shell/Modal';
import { fetchApiHealth, fetchWorkspaceSummaries, getApiBaseUrl } from '../lib/api';
import { useWebosStore } from '../state/webosStore';

export function SettingsPage() {
  const { state, dispatch } = useWebosStore();
  const [open, setOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('Checking API…');
  const [workspaceCount, setWorkspaceCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBackendStatus() {
      try {
        const [health, workspaces] = await Promise.all([fetchApiHealth(), fetchWorkspaceSummaries()]);
        if (cancelled) return;
        setApiStatus(`${health.service} online at ${new Date(health.now).toLocaleTimeString()}`);
        setWorkspaceCount(workspaces.length);
      } catch {
        if (cancelled) return;
        setApiStatus('API offline (run `npm run api:dev`)');
        setWorkspaceCount(null);
      }
    }

    loadBackendStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card title="Settings">
      <div className="settings-row">
        <span>Theme</span>
        <button type="button" onClick={() => dispatch({ type: 'selectTheme', payload: state.settings.theme === 'dark' ? 'light' : 'dark' })}>{state.settings.theme}</button>
      </div>
      <div className="settings-row">
        <span>Privacy mode</span>
        <button type="button" aria-pressed={state.settings.privacyMode} onClick={() => dispatch({ type: 'togglePrivacy' })}>{state.settings.privacyMode ? 'On' : 'Off'}</button>
      </div>
      <div className="settings-row">
        <span>Analytics (opt-in)</span>
        <button type="button" aria-pressed={state.settings.analyticsOptIn} onClick={() => dispatch({ type: 'toggleAnalytics' })}>{state.settings.analyticsOptIn ? 'On' : 'Off'}</button>
      </div>
      <div className="settings-row">
        <span>Command bar kill switch</span>
        <button type="button" aria-pressed={!state.settings.commandBarEnabled} onClick={() => dispatch({ type: 'toggleCommandBar' })}>{state.settings.commandBarEnabled ? 'Enabled' : 'Disabled'}</button>
      </div>
      <div className="settings-row">
        <span>API base URL</span>
        <code>{getApiBaseUrl()}</code>
      </div>
      <div className="settings-row">
        <span>Backend status</span>
        <strong>{apiStatus}</strong>
      </div>
      <div className="settings-row">
        <span>Backend workspaces</span>
        <strong>{workspaceCount ?? '—'}</strong>
      </div>
      <button type="button" onClick={() => setOpen(true)}>Privacy details</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Privacy policy">
        <p>Data stays in localStorage by default. No telemetry is sent unless analytics is explicitly enabled.</p>
      </Modal>
    </Card>
  );
}
