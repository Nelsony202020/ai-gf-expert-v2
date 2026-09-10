import { getDb, isDbConfigured } from '../db/server';
import { PROMPTING_GLOSSARY_TERMS } from '../../data/glossary-prompting-terms';
import { explanationToDoc } from './markdownDoc';
import {
  parseAliases,
  resolveGlossaryCtaLabel,
  slugifyGlossaryAnchor,
  type GlossaryEntryRecord,
  type PublishedGlossaryTerm,
} from './types';

function mapRow(row: Record<string, unknown>): GlossaryEntryRecord {
  return {
    id: String(row.id),
    term: String(row.term ?? ''),
    anchor: String(row.anchor ?? ''),
    tooltipDefinition: String(row.tooltipDefinition ?? ''),
    ctaLabel: String(row.ctaLabel ?? '').trim(),
    fullDefinition: (row.fullDefinition as GlossaryEntryRecord['fullDefinition']) ?? null,
    aliases: parseAliases(row.aliases),
    displayAliases: parseAliases(row.displayAliases),
    category: String(row.category ?? 'General'),
    status: String(row.status ?? 'draft'),
    autoTooltip: row.autoTooltip !== false,
    scope: row.scope ? String(row.scope) : 'site',
    publishedAt: row.publishedAt != null ? Number(row.publishedAt) : null,
    createdAt: row.createdAt != null ? Number(row.createdAt) : null,
    updatedAt: row.updatedAt != null ? Number(row.updatedAt) : null,
  };
}

function promptingTermRecords(): GlossaryEntryRecord[] {
  const now = Date.now();
  return PROMPTING_GLOSSARY_TERMS.map((term) => {
    const anchor = slugifyGlossaryAnchor(term.term);
    return {
      id: `file:${anchor}`,
      term: term.term,
      anchor,
      tooltipDefinition: term.tooltipDefinition.trim(),
      ctaLabel: term.ctaLabel.trim(),
      fullDefinition: explanationToDoc(term.fullExplanation),
      aliases: parseAliases(term.aliases ?? []),
      displayAliases: parseAliases(term.displayAliases ?? []),
      category: term.category,
      status: 'published',
      autoTooltip: true,
      scope: 'site',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  });
}

function mergePromptingTerms(rows: GlossaryEntryRecord[]): GlossaryEntryRecord[] {
  const byAnchor = new Map(rows.map((row) => [row.anchor, row]));
  for (const extra of promptingTermRecords()) {
    const prev = byAnchor.get(extra.anchor);
    byAnchor.set(extra.anchor, prev ? { ...extra, id: prev.id, createdAt: prev.createdAt } : extra);
  }
  return [...byAnchor.values()].sort((a, b) => {
    const ta = a.term.localeCompare(b.term);
    if (ta !== 0) return ta;
    return a.anchor.localeCompare(b.anchor);
  });
}

export async function loadAllGlossaryEntries(): Promise<GlossaryEntryRecord[]> {
  if (!isDbConfigured()) return mergePromptingTerms([]);
  try {
    const db = getDb();
    const { glossaryEntries } = await (db.query as any)({ glossaryEntries: {} });
    return mergePromptingTerms(((glossaryEntries as any[]) ?? []).map(mapRow));
  } catch (error) {
    console.error('[glossary] loadAllGlossaryEntries failed', error);
    return mergePromptingTerms([]);
  }
}

export async function loadPublishedGlossaryEntries(): Promise<GlossaryEntryRecord[]> {
  const all = await loadAllGlossaryEntries();
  return all.filter((e) => e.status === 'published' && e.term && e.anchor && e.tooltipDefinition.trim());
}

/** Terms eligible for automatic glossary tooltips (all published entries). */
export async function getPublishedGlossaryTermsForTooltips(): Promise<PublishedGlossaryTerm[]> {
  const published = await loadPublishedGlossaryEntries();
  return published
    .map((e) => ({
      id: e.id,
      term: e.term,
      anchor: e.anchor,
      tooltipDefinition: e.tooltipDefinition.trim(),
      ctaLabel: resolveGlossaryCtaLabel(e.ctaLabel),
      aliases: e.aliases,
      displayAliases: e.displayAliases,
      category: e.category,
    }))
    .filter((e) => e.tooltipDefinition.length > 0);
}
