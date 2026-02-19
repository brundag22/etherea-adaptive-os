import { useWebosStore } from '../../state/webosStore';

export function TopBar({ navigate }: { navigate: (path: string) => void }) {
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
        <button className="status-pill" onClick={() => navigate('/workspaces')} type="button">Open Workspaces</button>
      </div>
    </header>
  );
}
