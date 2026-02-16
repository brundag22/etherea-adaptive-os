import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TopToolbar from './components/layout/TopToolbar';
import LeftWorkspacePanel, { AppView } from './components/workspace/LeftWorkspacePanel';
import EthereaAgent from './components/agent/EthereaAgent';
import CommandBar from './components/command/CommandBar';

type AgentExpression = 'neutral' | 'happy' | 'thinking' | 'listening' | 'concern';

interface AgentState {
  expression: AgentExpression;
  response: string | null;
}

const DEFAULT_NOTE = `# Etherea Workspace Journal

> [!note]
> **Morning Intention**
> Keep attention gentle and steady. One clear task at a time.

> [!tip]
> Use \`Ctrl+K\` to ask Etherea for focus rituals and short planning prompts.

\`\`\`etherea_state
{"energy": "calm", "focus": 0.81, "session": "offline-first"}
\`\`\`

## Today
- Deep work block: 09:00 - 11:00
- Reflection: 16:30
`;

const LOCAL_RESPONSES: Array<{ match: RegExp; response: string; expression: AgentExpression; focusMode?: boolean }> = [
  { match: /(start|enter|enable).*(focus)|(help me focus)/i, response: 'Focus mode engaged. I will keep your workspace calm and distraction-light.', expression: 'happy', focusMode: true },
  { match: /(stop|exit|disable).*(focus)/i, response: 'Focus mode paused. Nice work staying present.', expression: 'happy', focusMode: false },
  { match: /(tired|burned out|overwhelmed)/i, response: 'I hear you. Let us do one gentle breath cycle and reduce the next step to something small.', expression: 'concern' },
  { match: /(hello|hi|hey|good morning)/i, response: 'Hello. I am here and listening. What feels most important right now?', expression: 'listening' },
  { match: /(note|journal|workspace)/i, response: 'Your workspace is ready. You can switch views from the sidebar at any time.', expression: 'listening' }
];

const renderNotes = (raw: string) => {
  const withoutHiddenState = raw.replace(/```etherea_state[\s\S]*?```/gi, '').trim();
  const lines = withoutHiddenState.split('\n');
  const blocks: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^> \[![^\]]+\]/.test(line)) {
      const calloutHeader = line.match(/^> \[!([^\]]+)\]/i);
      const calloutType = calloutHeader?.[1]?.toLowerCase() ?? 'note';
      const calloutLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].startsWith('>')) {
        calloutLines.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push(
        <div key={`callout-${i}`} className={`note-callout callout-${calloutType}`}>
          <div className="callout-title">{calloutType.toUpperCase()}</div>
          <p>{calloutLines.join(' ')}</p>
        </div>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push(<h1 key={`h1-${i}`}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={`h2-${i}`}>{line.slice(3)}</h2>);
    } else if (line.startsWith('- ')) {
      const listItems: string[] = [line.slice(2)];
      i += 1;
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(lines[i].slice(2));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`}>
          {listItems.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      );
      continue;
    } else if (line.trim().length > 0) {
      blocks.push(<p key={`p-${i}`}>{line}</p>);
    }

    i += 1;
  }

  return blocks;
};

const App: React.FC = () => {
  const [isFocusMode, setFocusMode] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>({ expression: 'neutral', response: null });
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [auraVisible, setAuraVisible] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('agent');
  const [notesValue, setNotesValue] = useState(DEFAULT_NOTE);
  const [mouthOpen, setMouthOpen] = useState(0.12);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speechInterval = useRef<number | null>(null);

  const stopSpeechEnvelope = useCallback(() => {
    if (speechInterval.current) {
      window.clearInterval(speechInterval.current);
      speechInterval.current = null;
    }
    setMouthOpen(0.12);
    setIsSpeaking(false);
  }, []);

  const speakResponse = useCallback((text: string, expressionDuringSpeech: AgentExpression) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 1.08;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAgentState(prev => ({ ...prev, expression: expressionDuringSpeech }));

      let frame = 0;
      speechInterval.current = window.setInterval(() => {
        frame += 1;
        const pulse = 0.16 + Math.abs(Math.sin(frame * 0.38)) * 0.58;
        setMouthOpen(pulse);
      }, 60);
    };

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word') {
        setMouthOpen(0.26 + Math.random() * 0.58);
      }
    };

    utterance.onend = stopSpeechEnvelope;
    utterance.onerror = stopSpeechEnvelope;

    window.speechSynthesis.speak(utterance);
  }, [stopSpeechEnvelope]);

  const handleCommand = useCallback(async (command: string) => {
    const cleanedCommand = command.toLowerCase().trim();
    setAgentState({ expression: 'thinking', response: null });

    const matchedRule = LOCAL_RESPONSES.find(rule => rule.match.test(cleanedCommand));

    const response = matchedRule?.response ?? 'I am processing that locally. Try asking for focus help, a quick plan, or a workspace note.';
    const expression = matchedRule?.expression ?? 'thinking';

    if (typeof matchedRule?.focusMode === 'boolean') {
      setFocusMode(matchedRule.focusMode);
    }

    setAgentState({ expression, response });
    speakResponse(response, expression);

    window.setTimeout(() => {
      setAgentState(prevState => ({ ...prevState, response: null, expression: isFocusMode ? 'happy' : 'neutral' }));
    }, 6000);
  }, [isFocusMode, speakResponse]);

  useEffect(() => {
    const timer = setTimeout(() => setAuraVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('focus-mode', isFocusMode);
  }, [isFocusMode]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isCommandBarOpen) {
      setAgentState(prevState => ({ ...prevState, expression: 'listening' }));
    } else {
      timeoutId = setTimeout(() => {
        setAgentState(prevState => ({ ...prevState, expression: isFocusMode ? 'happy' : 'neutral' }));
      }, 350);
    }
    return () => clearTimeout(timeoutId);
  }, [isCommandBarOpen, isFocusMode]);

  const notesPreview = useMemo(() => renderNotes(notesValue), [notesValue]);

  return (
    <div className="w-full h-screen overflow-hidden">
      <div className={`aura-container ${auraVisible ? 'visible' : ''}`}>
        <div className="aura" />
      </div>

      <TopToolbar />
      <LeftWorkspacePanel activeView={activeView} onViewChange={setActiveView} />

      <main className="main-canvas">
        {activeView === 'agent' ? (
          <div className="glass-panel w-full h-full rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {agentState.response && <div className="absolute top-8 text-lg text-blue-300 transition-opacity duration-500">{agentState.response}</div>}
            <h1 className="text-5xl font-bold mb-4 text-gray-100">{isFocusMode ? 'Focus Session Active' : 'Welcome to Etherea'}</h1>
            <p className="text-xl text-gray-300 max-w-2xl">
              {isFocusMode
                ? 'The world is quiet. Your mind is clear. Breathe and begin.'
                : 'Your offline-first adaptive workspace for deep focus and mindful productivity.'}
            </p>
            <p className="text-md text-gray-400 mt-6">
              Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded-lg">Ctrl+K</kbd> to begin.
            </p>
          </div>
        ) : (
          <div className="notes-layout glass-panel rounded-2xl p-6">
            <section className="notes-editor">
              <h2>Markdown Notes</h2>
              <textarea
                value={notesValue}
                onChange={(event) => setNotesValue(event.target.value)}
                spellCheck={false}
                aria-label="Etherea notes editor"
              />
            </section>
            <section className="notes-preview" aria-label="Rendered notes preview">
              {notesPreview}
            </section>
          </div>
        )}
      </main>

      <EthereaAgent expression={agentState.expression} mouthOpen={mouthOpen} isSpeaking={isSpeaking} />

      <CommandBar onCommandSubmit={handleCommand} onOpenChange={setIsCommandBarOpen} />
    </div>
  );
};

export default App;
