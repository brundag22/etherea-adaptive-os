import { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandBar } from './CommandBar';

export function AppShell({ children, path, navigate }: PropsWithChildren<{ path: string; navigate: (path: string) => void }>) {
  return (
    <div className="webos-shell">
      <Sidebar path={path} navigate={navigate} />
      <div>
        <TopBar navigate={navigate} />
        <main className="main-content" tabIndex={-1}>{children}</main>
        <CommandBar />
      </div>
    </div>
  );
}
