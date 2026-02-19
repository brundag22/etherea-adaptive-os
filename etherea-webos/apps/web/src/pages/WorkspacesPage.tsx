import { Card } from '../components/shell/Card';
import { EmptyState } from '../components/shell/EmptyState';
import { useWebosStore } from '../state/webosStore';

export function WorkspacesPage({ navigate }: { navigate: (path: string) => void }) {
  const { state } = useWebosStore();

  return (
    <Card title="Workspaces">
      {state.workspaces.length === 0 ? (
        <EmptyState message="No workspaces available." />
      ) : (
        <ul className="workspace-list">
          {state.workspaces.map((workspace) => (
            <li key={workspace.id}>
              <button type="button" onClick={() => navigate(`/workspaces/${workspace.id}`)}>{workspace.name}</button>
              <span>{workspace.status}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
