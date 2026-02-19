import { useWebosStore } from '../../state/webosStore';

export function TopBar({ navigate, micStatusLabel }: { navigate: (path: string) => void; micStatusLabel: string }) {
  const { state } = useWebosStore();

  return (
    <header className="topbar card">
      <div>
        <strong>AuroraSearch</strong>
        <p>{state.settings.privacyMode ? 'Privacy Mode ON' : 'Privacy Mode OFF'}</p>
      </div>
      <div className="topbar-actions">
        <span className="status-pill">Theme: {state.settings.theme}</span>
        <span className="status-pill">Analytics: {state.settings.analyticsOptIn ? 'Opt-in' : 'Off'}</span>
        <span className="status-pill">{micStatusLabel}</span>
        <button className="status-pill" onClick={() => navigate('/workspaces')} type="button">Open Workspaces</button>
      </div>
    </header>
  );
}
