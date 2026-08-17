/** Shared glossary types and helpers (admin + public). */

export const GLOSSARY_CATEGORY_OPTIONS = [
  'General',
  'Characters',
  'Customization',
  'Chat',
  'Chat Features',
  'Images',
  'Video',
  'Privacy',
  'Pricing',
] as const;

export type GlossaryCategory = (typeof GLOSSARY_CATEGORY_OPTIONS)[number];
export type GlossaryStatus = 'draft' | 'published';

export interface GlossaryTipTapDoc {
  type: 'doc';
  content?: unknown[];
}

export interface GlossaryEntryRecord {
  id: string;
  term: string;
  anchor: string;
  tooltipDefinition: string;
  /** Optional tooltip CTA text. Empty → "Read full definition →". */
  ctaLabel: string;
  fullDefinition: GlossaryTipTapDoc | null;
  /** Matching aliases for auto-tooltip detection (singular/plural variants, etc.). */
  aliases: string[];
  /** Public “Also called” labels only — never used for matching. */
  displayAliases: string[];
  category: GlossaryCategory | string;
  status: GlossaryStatus | string;
  autoTooltip: boolean;
  scope?: string;
  publishedAt?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

/** Public tooltip payload (no full rich definition). */
export interface PublishedGlossaryTerm {
  id: string;
  term: string;
  anchor: string;
  tooltipDefinition: string;
  ctaLabel: string;
  aliases: string[];
  displayAliases: string[];
  category: string;
}

export const GLOSSARY_CTA_FALLBACK = 'Read full definition →';

/** Ensure CTA ends with a trailing arrow for tooltip links. */
export function withGlossaryCtaArrow(label: string): string {
  const text = String(label ?? '').trim();
  if (!text) return GLOSSARY_CTA_FALLBACK;
  if (/→\s*$/.test(text)) return text;
  if (/->\s*$/.test(text)) return text.replace(/->\s*$/, '→');
  return `${text} →`;
}

/** Resolve tooltip CTA label; empty values use the safe fallback. */
export function resolveGlossaryCtaLabel(raw?: string | null): string {
  const label = String(raw ?? '').trim();
  return withGlossaryCtaArrow(label || GLOSSARY_CTA_FALLBACK);
}

export function slugifyGlossaryAnchor(term: string): string {
  return String(term ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function normalizeAlias(value: string): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function aliasKey(value: string): string {
  return normalizeAlias(value).toLowerCase();
}

export function parseAliases(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const alias = normalizeAlias(String(item ?? ''));
    if (!alias) continue;
    const key = aliasKey(alias);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(alias);
  }
  return out;
}

/**
 * Format display aliases for tooltip / glossary prose:
 * "credits", "credits or gems", "credits, gems, or points".
 */
export function formatAlsoCalledList(items: string[] | undefined | null): string {
  const list = parseAliases(items ?? []);
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} or ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, or ${list[list.length - 1]}`;
}

/** Title-case each word for readable alias chips in tooltips. */
function titleCaseAlias(value: string): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

/**
 * Compact tooltip metadata line: "Coins · Gems · Credits"
 * Prefers displayAliases; falls back to matching aliases (excluding the primary term).
 */
export function glossaryOtherNamesText(
  term: string,
  aliases?: string[] | null,
  displayAliases?: string[] | null,
): string {
  const display = parseAliases(displayAliases ?? []);
  const source =
    display.length > 0
      ? display
      : (aliases ?? []).filter((a) => aliasKey(a) !== aliasKey(term));
  const list = parseAliases(source).map(titleCaseAlias);
  if (list.length === 0) return '';
  return list.join(' · ');
}

/** @deprecated Prefer glossaryOtherNamesText for tooltips. */
export function glossaryAlsoCalledText(term: string, aliases?: string[] | null): string {
  const termKey = aliasKey(term);
  return formatAlsoCalledList((aliases ?? []).filter((a) => aliasKey(a) !== termKey));
}

export function isTipTapDocNonEmpty(doc: unknown): boolean {
  if (!doc || typeof doc !== 'object') return false;
  const content = (doc as { content?: unknown[] }).content;
  if (!Array.isArray(content) || content.length === 0) return false;
  const text = extractPlainTextFromTipTap(doc).trim();
  return text.length > 0;
}

export function extractPlainTextFromTipTap(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return '';
  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (typeof n.text === 'string') parts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(doc);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Match phrases for a glossary entry (term + aliases), longest-first ready. */
export function glossaryMatchPhrases(entry: {
  term: string;
  aliases?: string[];
}): string[] {
  const phrases = [entry.term, ...(entry.aliases ?? [])]
    .map(normalizeAlias)
    .filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of phrases) {
    const key = aliasKey(p);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  return unique.sort((a, b) => b.length - a.length || a.localeCompare(b));
}
