/** Max words per pros/cons list item in AI output. */
export const PRO_CON_MAX_WORDS = 5;

export function isMetaDescriptionField(targetField?: string): boolean {
  return (targetField ?? '').toLowerCase().includes('meta description');
}

export function isProsConsListField(targetField?: string): boolean {
  const tf = (targetField ?? '').toLowerCase();
  return (
    (tf.includes('pros') || tf.includes(' cons') || tf.startsWith('cons') || tf.includes('category pro')) &&
    !tf.includes('pros-cons') &&
    !tf.includes('pros & cons')
  );
}

export function listFieldExtraRules(targetField?: string): string {
  if (isProsConsListField(targetField)) {
    return ` Return one item per line, no bullets. Each line MUST be at most ${PRO_CON_MAX_WORDS} words — a short punchy phrase, never a full sentence.`;
  }
  return '';
}

export function categoryFocusRule(categorySlug?: string): string {
  if (!categorySlug) return '';
  return ` Focus ONLY on the "${categorySlug}" category. Do not mention other categories (chat, characters, customization, images, video, pricing, etc.). Use only evidence and scores from this category.`;
}

export function enforceMaxWords(line: string, maxWords: number): string {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return line.trim();
  return words.slice(0, maxWords).join(' ');
}

export function enforceProsConsLines(text: string, maxWords = PRO_CON_MAX_WORDS): string {
  return text
    .split('\n')
    .map((line) => enforceMaxWords(line.replace(/^\s*[-*•]\s*/, ''), maxWords))
    .filter(Boolean)
    .join('\n');
}
