import { FormEvent, useState } from 'react';
import { useWebosStore } from '../../state/webosStore';

export function CommandBar() {
  const [input, setInput] = useState('');
  const { state, dispatch } = useWebosStore();

  if (!state.settings.commandBarEnabled) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    dispatch({ type: 'runCommand', payload: input.trim() });
    setInput('');
  };

  return (
    <form className="command-bar card" onSubmit={submit} aria-label="Ethera command bar">
      <label htmlFor="etherea-command">Ethera</label>
      <input
        id="etherea-command"
        aria-label="Natural language command input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Ask Etherea to summarize diagnostics or open a workspace"
      />
      <button type="submit">Run</button>
      <output>{state.commandOutput}</output>
    </form>
  );
}
