const items = [
  { to: '/', label: 'Dashboard' },
  { to: '/workspaces', label: 'Workspaces' },
  { to: '/diagnostics', label: 'Diagnostics' },
  { to: '/settings', label: 'Settings' },
];

export function Sidebar({ path, navigate }: { path: string; navigate: (path: string) => void }) {
  return (
    <aside className="sidebar card" aria-label="Primary navigation">
      <h2>Etherea WebOS</h2>
      <nav>
        {items.map((item) => (
          <button key={item.to} className={`nav-item ${path === item.to ? 'active' : ''}`} onClick={() => navigate(item.to)} type="button">
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
