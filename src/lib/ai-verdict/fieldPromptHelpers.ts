/** Max words per pros/cons list item in AI output. */
export const PRO_CON_MAX_WORDS = 5;

/** Max words for Important Findings (key_findings) in category analysis. */
export const FINDING_MAX_WORDS = 8;

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

/** Strip trailing sentence periods (keep decimals like $12.99). */
export function stripTrailingSentencePeriod(text: string): string {
  return text.replace(/\.+$/u, '').trim();
}

/** 10,000 / 100000 → 10K / 100K; 1,000,000 → 1M. */
export function shorthandLargeNumbers(text: string): string {
  return text.replace(/\b(\d{1,3}(?:,\d{3})+|\d{4,})\b/g, (match) => {
    const n = Number(match.replace(/,/g, ''));
    if (!Number.isFinite(n) || n < 1000) return match;
    if (n >= 1_000_000 && n % 1_000_000 === 0) return `${n / 1_000_000}M`;
    if (n >= 1000 && n % 1000 === 0) {
      const k = n / 1000;
      if (k >= 1000 && k % 1000 === 0) return `${k / 1000}M`;
      return `${k}K`;
    }
    return match;
  });
}

/** Skimmable Important Finding: shorthand numbers, no trailing period, max words. */
export function formatSkimmableFinding(text: string, maxWords = FINDING_MAX_WORDS): string {
  return enforceMaxWords(stripTrailingSentencePeriod(shorthandLargeNumbers(text.trim())), maxWords);
}

/** Skimmable pro/con: no trailing period, max words. */
export function formatSkimmableProCon(text: string, maxWords = PRO_CON_MAX_WORDS): string {
  return enforceMaxWords(stripTrailingSentencePeriod(text.trim()), maxWords);
}

export function enforceProsConsLines(text: string, maxWords = PRO_CON_MAX_WORDS): string {
  return text
    .split('\n')
    .map((line) => formatSkimmableProCon(line.replace(/^\s*[-*•]\s*/, ''), maxWords))
    .filter(Boolean)
    .join('\n');
}
