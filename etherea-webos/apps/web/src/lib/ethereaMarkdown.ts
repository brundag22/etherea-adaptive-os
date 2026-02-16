export type EthereaState = {
  highlights: string[];
  theme: 'dark' | 'light';
  annotations?: string[];
  metadata?: Record<string, string>;
};

const DEFAULT_STATE: EthereaState = {
  highlights: [],
  theme: 'dark',
};

const STATE_BLOCK_REGEX = /\n```etherea_state\n([\s\S]*?)\n```\s*$/m;

export function deserializeEthereaMarkdown(fileContent: string): { markdown: string; state: EthereaState } {
  const matched = fileContent.match(STATE_BLOCK_REGEX);

  if (!matched) {
    return { markdown: fileContent.trimEnd(), state: DEFAULT_STATE };
  }

  const stateText = matched[1];
  const markdown = fileContent.replace(STATE_BLOCK_REGEX, '').trimEnd();

  try {
    const parsed = JSON.parse(stateText) as Partial<EthereaState>;
    return {
      markdown,
      state: {
        ...DEFAULT_STATE,
        ...parsed,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String) : [],
        theme: parsed.theme === 'light' ? 'light' : 'dark',
      },
    };
  } catch {
    return { markdown, state: DEFAULT_STATE };
  }
}

export function serializeEthereaMarkdown(markdown: string, state: EthereaState): string {
  const cleanMarkdown = markdown.trimEnd();
  const normalizedState: EthereaState = {
    ...DEFAULT_STATE,
    ...state,
    highlights: Array.isArray(state.highlights) ? state.highlights : [],
    theme: state.theme === 'light' ? 'light' : 'dark',
  };

  return `${cleanMarkdown}\n\n\`\`\`etherea_state\n${JSON.stringify(normalizedState, null, 2)}\n\`\`\`\n`;
}

export function stripEthereaStateBlock(markdownWithState: string): string {
  return deserializeEthereaMarkdown(markdownWithState).markdown;
}
