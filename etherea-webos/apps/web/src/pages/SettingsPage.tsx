import { useState } from 'react';
import { Card } from '../components/shell/Card';
import { Modal } from '../components/shell/Modal';
import { useWebosStore } from '../state/webosStore';

export function SettingsPage() {
  const { state, dispatch } = useWebosStore();
  const [open, setOpen] = useState(false);

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
      <button type="button" onClick={() => setOpen(true)}>Privacy details</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Privacy policy">
        <p>Data stays in localStorage by default. No telemetry is sent unless analytics is explicitly enabled.</p>
      </Modal>
    </Card>
  );
}
