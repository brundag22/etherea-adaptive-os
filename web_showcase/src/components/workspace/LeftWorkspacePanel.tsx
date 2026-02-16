import React from 'react';

export type AppView = 'agent' | 'notes';

interface LeftWorkspacePanelProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const LeftWorkspacePanel: React.FC<LeftWorkspacePanelProps> = ({ activeView, onViewChange }) => {
  return (
    <aside className="left-workspace-panel glass-panel">
      <button
        className={`sidebar-button ${activeView === 'agent' ? 'is-active' : ''}`}
        onClick={() => onViewChange('agent')}
        aria-pressed={activeView === 'agent'}
      >
        Workspace
      </button>
      <button
        className={`sidebar-button ${activeView === 'notes' ? 'is-active' : ''}`}
        onClick={() => onViewChange('notes')}
        aria-pressed={activeView === 'notes'}
      >
        Notes
      </button>
    </aside>
  );
};

export default LeftWorkspacePanel;
