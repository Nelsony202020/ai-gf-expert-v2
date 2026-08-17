import {
  aliasKey,
  glossaryMatchPhrases,
  isTipTapDocNonEmpty,
  normalizeAlias,
  type GlossaryEntryRecord,
} from './types';

export interface GlossaryValidationIssue {
  field?: string;
  message: string;
}

/** Validate a glossary entry for save/publish. */
export function validateGlossaryEntry(
  entry: Partial<GlossaryEntryRecord> & { id?: string; term?: string; anchor?: string },
  opts?: { publishing?: boolean; otherEntries?: GlossaryEntryRecord[] },
): GlossaryValidationIssue[] {
  const issues: GlossaryValidationIssue[] = [];
  const term = String(entry.term ?? '').trim();
  const anchor = String(entry.anchor ?? '').trim();
  const tooltip = String(entry.tooltipDefinition ?? '').trim();
  const aliases = (entry.aliases ?? []).map(normalizeAlias).filter(Boolean);
  const others = opts?.otherEntries ?? [];

  if (!term) issues.push({ field: 'term', message: 'Term is required.' });
  if (!anchor) issues.push({ field: 'anchor', message: 'Anchor is required.' });
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(anchor)) {
    issues.push({
      field: 'anchor',
      message: 'Anchor must be lowercase letters, numbers, and hyphens only.',
    });
  }

  if (opts?.publishing) {
    if (!tooltip) {
      issues.push({
        field: 'tooltipDefinition',
        message: 'Tooltip definition is required to publish.',
      });
    }
    if (!isTipTapDocNonEmpty(entry.fullDefinition)) {
      issues.push({
        field: 'fullDefinition',
        message: 'Full explanation is required to publish.',
      });
    }
  }

  for (const other of others) {
    if (entry.id && other.id === entry.id) continue;
    if (String(other.anchor) === anchor) {
      issues.push({
        field: 'anchor',
        message: `Anchor "#${anchor}" is already used by "${other.term}".`,
      });
    }
  }

  const ownKeys = new Set([aliasKey(term), ...aliases.map(aliasKey)].filter(Boolean));
  const collisionTargets = others.filter((o) => {
    if (entry.id && o.id === entry.id) return false;
    return o.status === 'published' || opts?.publishing;
  });

  // Only collide with published peers (and when we are publishing).
  for (const other of collisionTargets) {
    if (other.status !== 'published') continue;
    for (const phrase of glossaryMatchPhrases(other)) {
      const key = aliasKey(phrase);
      if (!ownKeys.has(key)) continue;
      const msg = `"${phrase}" conflicts with published entry "${other.term}".`;
      if (!issues.some((i) => i.message === msg)) {
        issues.push({ field: 'aliases', message: msg });
      }
    }
  }

  return issues;
}
