import type { GlossaryTipTapDoc } from './types';

function textNode(text: string, marks?: Array<{ type: string }>) {
  return marks?.length ? { type: 'text' as const, text, marks } : { type: 'text' as const, text };
}

function parseInline(text: string) {
  const nodes: Array<Record<string, unknown>> = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(textNode(text.slice(last, match.index)));
    const token = match[1];
    if (token.startsWith('**')) {
      nodes.push(textNode(token.slice(2, -2), [{ type: 'bold' }]));
    } else {
      nodes.push(textNode(token.slice(1, -1)));
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(textNode(text.slice(last)));
  return nodes.length ? nodes : [textNode('')];
}

function paragraph(...lines: string[]) {
  const content: unknown[] = [];
  lines.forEach((line, i) => {
    if (i > 0) content.push({ type: 'hardBreak' });
    content.push(...parseInline(line));
  });
  return { type: 'paragraph' as const, content: content.length ? content : [textNode('')] };
}

function bulletList(items: string[]) {
  return {
    type: 'bulletList' as const,
    content: items.map((item) => ({
      type: 'listItem' as const,
      content: [paragraph(item)],
    })),
  };
}

function isBulletLine(line: string) {
  return /^[-*]\s+/.test(line);
}

function bulletText(line: string) {
  return line.replace(/^[-*]\s+/, '').trim();
}

function blocksFromMarkdown(raw: string): unknown[] {
  const blocks = raw
    .trim()
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const content: unknown[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const bulletLines = lines.filter(isBulletLine);
    if (bulletLines.length > 0 && bulletLines.length === lines.length) {
      content.push(bulletList(bulletLines.map(bulletText)));
      continue;
    }
    if (bulletLines.length > 0 && lines.length > bulletLines.length) {
      const intro = lines.filter((l) => !isBulletLine(l));
      if (intro.length) content.push(paragraph(...intro));
      content.push(bulletList(bulletLines.map(bulletText)));
      continue;
    }
    content.push(paragraph(...lines));
  }

  return content;
}

/** Convert markdown-ish explanation text into a TipTap doc. */
export function explanationToDoc(raw: string): GlossaryTipTapDoc {
  const content: unknown[] = [];
  const fence = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(raw))) {
    content.push(...blocksFromMarkdown(raw.slice(last, match.index)));
    const code = match[1].replace(/\n$/, '');
    content.push({
      type: 'codeBlock',
      attrs: { language: 'json' },
      content: code ? [textNode(code)] : [],
    });
    last = fence.lastIndex;
  }
  content.push(...blocksFromMarkdown(raw.slice(last)));

  return { type: 'doc', content: content as GlossaryTipTapDoc['content'] };
}
