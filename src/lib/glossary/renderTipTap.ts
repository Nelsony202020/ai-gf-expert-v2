/** TipTap JSON → safe HTML for glossary full explanations. */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface TipTapNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  content?: TipTapNode[];
}

function renderInline(nodes: TipTapNode[] | undefined): string {
  if (!nodes) return '';
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      let html = escapeHtml(String(node.text ?? ''));
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') html = `<strong>${html}</strong>`;
        else if (mark.type === 'italic') html = `<em>${html}</em>`;
        else if (mark.type === 'link') {
          const href = escapeHtml(String(mark.attrs?.href ?? ''));
          if (href) html = `<a href="${href}" rel="noopener noreferrer">${html}</a>`;
        }
      }
      out += html;
    } else if (node.type === 'hardBreak') {
      out += '<br />';
    } else if (node.content) {
      out += renderInline(node.content);
    }
  }
  return out;
}

function renderBlock(node: TipTapNode): string {
  const type = String(node.type ?? '');
  const inner = renderInline(node.content);
  switch (type) {
    case 'paragraph':
      return inner.trim() ? `<p>${inner}</p>` : '';
    case 'heading': {
      const level = Math.min(4, Math.max(3, Number(node.attrs?.level ?? 3)));
      return `<h${level}>${inner}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${(node.content ?? []).map(renderBlock).join('')}</ul>`;
    case 'orderedList':
      return `<ol>${(node.content ?? []).map(renderBlock).join('')}</ol>`;
    case 'listItem':
      return `<li>${(node.content ?? []).map(renderBlock).join('')}</li>`;
    case 'blockquote':
      return `<blockquote>${(node.content ?? []).map(renderBlock).join('')}</blockquote>`;
    case 'horizontalRule':
      return '<hr />';
    default:
      if (node.content) return (node.content ?? []).map(renderBlock).join('');
      return '';
  }
}

export function renderGlossaryTipTapHtml(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return '';
  const content = (doc as TipTapNode).content;
  if (!Array.isArray(content)) return '';
  return content.map(renderBlock).filter(Boolean).join('\n');
}
