import { Card } from '../components/shell/Card';
import { useWebosStore } from '../state/webosStore';

export function DiagnosticsPage() {
  const { state } = useWebosStore();

  return (
    <Card title="Client Diagnostics Logs">
      <ul className="log-list" aria-label="Client log entries">
        {state.logs.map((log) => (
          <li key={log.id}>
            <strong>{log.level.toUpperCase()}</strong> {new Date(log.timestamp).toLocaleTimeString()} — {log.message}
          </li>
        ))}
      </ul>
    </Card>
  );
}
