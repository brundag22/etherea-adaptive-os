import { useEffect, useMemo, useState } from 'react';
import { create_file, edit_file, get_file, list_files, type OfflineFile } from '../lib/fileSystem';
import { deserializeEthereaMarkdown, serializeEthereaMarkdown, type EthereaState } from '../lib/ethereaMarkdown';
import { renderMarkdownToHtml } from '../lib/markdownRenderer';

const STARTER_MARKDOWN = `# Etherea Notes

> [!note] Welcome to your offline workspace.

> [!tip] Use callouts to highlight critical context.

> [!warning] Etherea state is stored in this same file for portability.
`;

type NotesPanelProps = {
  activeWorkspace: string;
  approvedWorkspaces: string[];
};

export function NotesPanel({ activeWorkspace, approvedWorkspaces }: NotesPanelProps) {
  const [files, setFiles] = useState<OfflineFile[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [state, setState] = useState<EthereaState>({ highlights: [], theme: 'dark' });
  const [status, setStatus] = useState('Ready');

  const workspaceFiles = useMemo(
    () => files.filter((file) => file.filename.toLowerCase().startsWith(`${activeWorkspace.toLowerCase()}/`)),
    [activeWorkspace, files],
  );

  async function refreshFiles() {
    setFiles(await list_files(approvedWorkspaces));
  }

  async function openFile(filename: string) {
    const file = await get_file(filename, approvedWorkspaces);
    if (!file) {
      setStatus(`Could not open ${filename}`);
      return;
    }

    const parsed = deserializeEthereaMarkdown(file.content);
    setSelectedFile(file.filename);
    setMarkdown(parsed.markdown);
    setState(parsed.state);
    setStatus(`Opened ${file.filename}`);
  }

  useEffect(() => {
    refreshFiles();
  }, []);

  useEffect(() => {
    const latest = workspaceFiles[0];
    if (!selectedFile && latest) {
      void openFile(latest.filename);
    }
  }, [workspaceFiles, selectedFile]);

  return (
    <section className="panel-content notes-panel">
      <div className="notes-sidebar">
        <div className="notes-toolbar">
          <button
            className="item"
            type="button"
            onClick={async () => {
              const base = `${activeWorkspace}/note-${Date.now()}.md`;
              const payload = serializeEthereaMarkdown(STARTER_MARKDOWN, { highlights: [], theme: 'dark' });
              await create_file(base, payload, approvedWorkspaces);
              await refreshFiles();
              await openFile(base);
            }}
          >
            New Note
          </button>
        </div>
        <ul className="notes-list">
          {workspaceFiles.map((file) => (
            <li key={file.filename}>
              <button
                type="button"
                className={selectedFile === file.filename ? 'item active' : 'item'}
                onClick={() => {
                  void openFile(file.filename);
                }}
              >
                {file.filename.split('/').slice(1).join('/')}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="notes-editor">
        <div className="notes-meta">{selectedFile || `${activeWorkspace}/(none selected)`}</div>
        <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} placeholder="Write markdown notes here..." />
        <div className="notes-actions">
          <button
            className="item"
            type="button"
            disabled={!selectedFile}
            onClick={async () => {
              if (!selectedFile) return;
              const payload = serializeEthereaMarkdown(markdown, state);
              await edit_file(selectedFile, payload, approvedWorkspaces);
              await refreshFiles();
              setStatus(`Saved ${selectedFile}`);
            }}
          >
            Save
          </button>
          <button
            className="item"
            type="button"
            disabled={!selectedFile}
            onClick={async () => {
              if (!selectedFile) return;
              await openFile(selectedFile);
            }}
          >
            Reload
          </button>
          <span className="status-pill">{status}</span>
        </div>
      </div>

      <div className="notes-preview markdown-preview" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(markdown) }} />
    </section>
  );
}
