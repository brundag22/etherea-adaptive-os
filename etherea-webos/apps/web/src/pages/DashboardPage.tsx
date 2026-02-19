import { Card } from '../components/shell/Card';
import { useWebosStore } from '../state/webosStore';

export function DashboardPage() {
  const { state } = useWebosStore();

  return (
    <section className="grid-two">
      <Card title="System Overview">
        <p>Primary WebOS shell running in {import.meta.env.VITE_USE_API === 'true' ? 'API' : 'mock/local'} mode.</p>
        <ul>
          <li>Workspaces: {state.workspaces.length}</li>
          <li>Diagnostics entries: {state.logs.length}</li>
          <li>Telemetry: {state.settings.analyticsOptIn ? 'Enabled by user' : 'Disabled by default'}</li>
        </ul>
      </Card>
      <Card title="Recent Activity">
        <p>{state.logs[0]?.message ?? 'No activity yet.'}</p>
      </Card>
    </section>
  );
}
