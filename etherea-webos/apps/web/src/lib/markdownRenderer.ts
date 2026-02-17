const ETHEREA_STATE_BLOCK = /```etherea_state[\s\S]*?```/g;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMarkdown(input: string): string {
  return escapeHtml(input)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function renderCallout(content: string): string | null {
  const matched = content.match(/^\[!(note|tip|warning)\]\s*([\s\S]*)$/i);
  if (!matched) return null;
  const kind = matched[1].toLowerCase();
  const text = inlineMarkdown(matched[2].trim());
  return `<aside class="etherea-callout ${kind}"><strong>${kind.toUpperCase()}</strong><p>${text}</p></aside>`;
}

export function renderMarkdownToHtml(markdown: string): string {
  const sanitized = markdown.replace(ETHEREA_STATE_BLOCK, '').trimEnd();
  const lines = sanitized.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      output.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushList();
      continue;
    }

    const calloutLine = line.match(/^>\s?(.*)$/)?.[1] ?? '';
    const callout = renderCallout(calloutLine);
    if (callout) {
      flushList();
      output.push(callout);
      continue;
    }

    if (line.startsWith('# ')) {
      flushList();
      output.push(`<h1>${inlineMarkdown(line.slice(2).trim())}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      output.push(`<h2>${inlineMarkdown(line.slice(3).trim())}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      output.push(`<h3>${inlineMarkdown(line.slice(4).trim())}</h3>`);
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        output.push('<ul>');
        inList = true;
      }
      output.push(`<li>${inlineMarkdown(line.slice(2).trim())}</li>`);
      continue;
    }

    flushList();
    output.push(`<p>${inlineMarkdown(line.trim())}</p>`);
  }

  flushList();
  return output.join('\n');
}
