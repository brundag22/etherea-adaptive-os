import { type Dispatch, createContext, useContext, useMemo, useReducer } from 'react';
import { STORAGE_KEYS, USE_API } from '../lib/config';

export type Workspace = { id: string; name: string; description: string; status: 'active' | 'idle' | 'archived'; notes: string };
type LogLevel = 'info' | 'warn' | 'error';
type LogEntry = { id: string; level: LogLevel; message: string; timestamp: string };
export type Settings = { theme: 'dark' | 'light'; analyticsOptIn: boolean; privacyMode: boolean; commandBarEnabled: boolean };

type WebosState = { workspaces: Workspace[]; logs: LogEntry[]; settings: Settings; commandOutput: string };

type WebosAction =
  | { type: 'selectTheme'; payload: Settings['theme'] }
  | { type: 'toggleAnalytics' }
  | { type: 'togglePrivacy' }
  | { type: 'toggleCommandBar' }
  | { type: 'appendLog'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
  | { type: 'runCommand'; payload: string };

const defaultState: WebosState = {
  workspaces: [
    { id: 'ops', name: 'Ops Command', description: 'Live operations dashboard and recovery runbooks.', status: 'active', notes: 'Incident response playbooks and command snippets.' },
    { id: 'research', name: 'Research Lab', description: 'Prototype ideas and exploration notes.', status: 'idle', notes: 'Track experiment outcomes and pending hypotheses.' },
    { id: 'personal', name: 'Personal Focus', description: 'Personal productivity and planning board.', status: 'active', notes: 'Weekly goals and task grooming queue.' },
  ],
  logs: [{ id: 'boot', level: 'info', message: 'WebOS started in local mock mode.', timestamp: new Date().toISOString() }],
  settings: { theme: 'dark', analyticsOptIn: false, privacyMode: true, commandBarEnabled: true },
  commandOutput: 'Awaiting command input.',
};

const WebosContext = createContext<{ state: WebosState; dispatch: Dispatch<WebosAction> } | null>(null);

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(state: WebosState) {
  localStorage.setItem(STORAGE_KEYS.workspaces, JSON.stringify(state.workspaces));
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(state.logs));
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

function reduce(state: WebosState, action: WebosAction): WebosState {
  const next = (() => {
    switch (action.type) {
      case 'selectTheme':
        return { ...state, settings: { ...state.settings, theme: action.payload } };
      case 'toggleAnalytics':
        return { ...state, settings: { ...state.settings, analyticsOptIn: !state.settings.analyticsOptIn } };
      case 'togglePrivacy':
        return { ...state, settings: { ...state.settings, privacyMode: !state.settings.privacyMode } };
      case 'toggleCommandBar':
        return { ...state, settings: { ...state.settings, commandBarEnabled: !state.settings.commandBarEnabled } };
      case 'appendLog':
        return {
          ...state,
          logs: [{ id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...action.payload }, ...state.logs].slice(0, 80),
        };
      case 'runCommand': {
        const output = USE_API ? `API mode enabled. Attempting command: ${action.payload}` : `Mock mode executed: ${action.payload}`;
        return {
          ...state,
          commandOutput: output,
          logs: [{ id: crypto.randomUUID(), timestamp: new Date().toISOString(), level: 'info', message: output }, ...state.logs].slice(0, 80),
        };
      }
      default:
        return state;
    }
  })();

  persist(next);
  return next;
}

function initState(): WebosState {
  if (typeof localStorage === 'undefined') return defaultState;
  return {
    ...defaultState,
    workspaces: safeLoad(STORAGE_KEYS.workspaces, defaultState.workspaces),
    logs: safeLoad(STORAGE_KEYS.logs, defaultState.logs),
    settings: safeLoad(STORAGE_KEYS.settings, defaultState.settings),
  };
}

export function WebosProvider({ children }: { children: import('react').ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, initState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <WebosContext.Provider value={value}>{children}</WebosContext.Provider>;
}

export function useWebosStore() {
  const context = useContext(WebosContext);
  if (!context) throw new Error('useWebosStore must be used inside WebosProvider');
  return context;
}
