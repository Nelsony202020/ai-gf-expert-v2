import { getDb, isDbConfigured } from '../db/server';
import {
  parseAliases,
  resolveGlossaryCtaLabel,
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
    scope: row.scope ? String(row.scope) : 'reviews',
    publishedAt: row.publishedAt != null ? Number(row.publishedAt) : null,
    createdAt: row.createdAt != null ? Number(row.createdAt) : null,
    updatedAt: row.updatedAt != null ? Number(row.updatedAt) : null,
  };
}

export async function loadAllGlossaryEntries(): Promise<GlossaryEntryRecord[]> {
  if (!isDbConfigured()) return [];
  try {
    const db = getDb();
    const { glossaryEntries } = await (db.query as any)({ glossaryEntries: {} });
    return ((glossaryEntries as any[]) ?? []).map(mapRow).sort((a, b) => {
      const ta = a.term.localeCompare(b.term);
      if (ta !== 0) return ta;
      return a.anchor.localeCompare(b.anchor);
    });
  } catch (error) {
    console.error('[glossary] loadAllGlossaryEntries failed', error);
    return [];
  }
}

export async function loadPublishedGlossaryEntries(): Promise<GlossaryEntryRecord[]> {
  const all = await loadAllGlossaryEntries();
  return all.filter((e) => e.status === 'published' && e.term && e.anchor && e.tooltipDefinition.trim());
}

/** Terms eligible for automatic review tooltips. */
export async function getPublishedGlossaryTermsForTooltips(): Promise<PublishedGlossaryTerm[]> {
  const published = await loadPublishedGlossaryEntries();
  return published
    .filter((e) => e.autoTooltip !== false && (e.scope ?? 'reviews') === 'reviews')
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
