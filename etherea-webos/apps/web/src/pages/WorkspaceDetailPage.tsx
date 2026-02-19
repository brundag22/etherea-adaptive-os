import { Card } from '../components/shell/Card';
import { EmptyState } from '../components/shell/EmptyState';
import { useWebosStore } from '../state/webosStore';

export function WorkspaceDetailPage({ workspaceId }: { workspaceId: string }) {
  const { state } = useWebosStore();
  const workspace = state.workspaces.find((item) => item.id === workspaceId);

  if (!workspace) return <EmptyState message="Workspace not found." />;

  return (
    <Card title={workspace.name}>
      <p>{workspace.description}</p>
      <p>{workspace.notes}</p>
      <p>Status: {workspace.status}</p>
    </Card>
  );
}
