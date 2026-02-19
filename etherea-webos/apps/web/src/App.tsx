import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/shell/AppShell';
import { Toast } from './components/shell/Toast';
import { usePath } from './lib/router';
import { DashboardPage } from './pages/DashboardPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { WorkspaceDetailPage } from './pages/WorkspaceDetailPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WebosProvider, useWebosStore } from './state/webosStore';

function RoutedApp() {
  const { state } = useWebosStore();
  const { path, navigate } = usePath();

  let page = <DashboardPage />;
  if (path === '/workspaces') page = <WorkspacesPage navigate={navigate} />;
  else if (path.startsWith('/workspaces/')) page = <WorkspaceDetailPage workspaceId={path.split('/')[2] ?? ''} />;
  else if (path === '/diagnostics') page = <DiagnosticsPage />;
  else if (path === '/settings') page = <SettingsPage />;

  return (
    <AppShell path={path} navigate={navigate}>
      {page}
      <Toast message={state.logs[0]?.message ?? null} />
    </AppShell>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <WebosProvider>
        <RoutedApp />
      </WebosProvider>
    </ErrorBoundary>
  );
}
