import { useMemo, useState } from 'react';
import { allowedFile, asFolder } from '../lib/commands';
import { deleteNode, renameNode, upsertNode, type WorkspaceFile } from '../lib/workspaceStore';

const DEFAULT_STATE_BLOCK = {
  canvas: { strokes: [] as unknown[] },
  annotations: [] as unknown[],
  highlights: [] as unknown[],
};

function ensureStateBlock(text: string) {
  if (!/```etherea_state[\s\S]*?```/m.test(text)) {
    const trimmed = text.trimEnd();
    return `${trimmed}\n\n\
\`\`\`etherea_state\n${JSON.stringify(DEFAULT_STATE_BLOCK, null, 2)}\n\`\`\`\n`;
  }
  return text;
}

function renderMarkdown(md: string) {
  return md
    .replace(/```etherea_state[\s\S]*?```/gm, '')
    .replace(/^> \[!note\]\s*(.*)$/gim, '<aside class="callout note"><strong>Note</strong><p>$1</p></aside>')
    .replace(/^> \[!tip\]\s*(.*)$/gim, '<aside class="callout tip"><strong>Tip</strong><p>$1</p></aside>')
    .replace(/^> \[!warning\]\s*(.*)$/gim, '<aside class="callout warning"><strong>Warning</strong><p>$1</p></aside>')
    .replace(/^> \[!answer\]\s*(.*)$/gim, '<aside class="callout answer"><strong>Answer</strong><p>$1</p></aside>')
    .replace(/^### (.*)$/gim, '<h3>$1</h3>')
    .replace(/^## (.*)$/gim, '<h2>$1</h2>')
    .replace(/^# (.*)$/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br/><br/>');
}

export function WorkspacePanel({
  files,
  onRefresh,
  compact = false,
}: {
  files: WorkspaceFile[];
  onRefresh: () => Promise<void>;
  compact?: boolean;
}) {
  const [openPath, setOpenPath] = useState('');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [dirty, setDirty] = useState(false);

  const filtered = useMemo(() => files.filter((f) => f.path.toLowerCase().includes(query.toLowerCase())), [files, query]);
  const isMarkdown = openPath.endsWith('.md');

  async function open(path: string) {
    const node = files.find((f) => f.path === path);
    if (!node || node.type !== 'file') return;
    setOpenPath(path);
    setDraft(node.content);
    setDirty(false);
  }

  return (
    <section className={`card workspace ${compact ? 'compact' : ''}`}>
      <div className="workspace-left">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search filenames" />
        <button
          onClick={async () => {
            const path = prompt('New file path (.md .txt .py ...)', 'notes.md')?.trim() ?? '';
            if (!path || !allowedFile(path)) return;
            const content = path.endsWith('.md')
              ? `# ${path.replace(/\.md$/, '')}\n\n> [!note] Add your thought here.\n\n\
\`\`\`etherea_state\n${JSON.stringify(DEFAULT_STATE_BLOCK, null, 2)}\n\`\`\``
              : '';
            await upsertNode({ path, content, updatedAt: Date.now(), type: 'file' });
            await onRefresh();
          }}
        >
          New file
        </button>
        <button
          onClick={async () => {
            const path = prompt('New folder path', 'notes')?.trim() ?? '';
            if (!path) return;
            await upsertNode(asFolder(path));
            await onRefresh();
          }}
        >
          New folder
        </button>
        {filtered.map((f) => (
          <div key={f.path} className="tree-node" onClick={() => open(f.path)}>
            {f.type === 'folder' ? '📁' : '📄'} {f.path}
          </div>
        ))}
      </div>
      {!compact && (
        <div className="workspace-main">
          <div className="tabs">{openPath || 'No file open'}</div>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDirty(true);
            }}
            placeholder="Open a file to edit"
          />
          {isMarkdown && <div className="md-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(draft) }} />}
          <div className="row">
            <button
              onClick={async () => {
                if (!openPath) return;
                const payload = openPath.endsWith('.md') ? ensureStateBlock(draft) : draft;
                await upsertNode({ path: openPath, content: payload, updatedAt: Date.now(), type: 'file' });
                setDraft(payload);
                setDirty(false);
                await onRefresh();
              }}
            >
              Save
            </button>
            <button
              onClick={async () => {
                if (!openPath) return;
                const next = prompt('Rename path', openPath)?.trim() ?? '';
                if (!next) return;
                await renameNode(openPath, next);
                setOpenPath(next);
                await onRefresh();
              }}
            >
              Rename
            </button>
            <button
              onClick={async () => {
                if (!openPath || !confirm(`Delete ${openPath}?`)) return;
                await deleteNode(openPath);
                setOpenPath('');
                setDraft('');
                setDirty(false);
                await onRefresh();
              }}
            >
              Delete
            </button>
          </div>
          <div className="statusbar">
            {openPath || 'none'} · {dirty ? 'dirty' : 'saved'}
          </div>
        </div>
      )}
    </section>
  );
}
