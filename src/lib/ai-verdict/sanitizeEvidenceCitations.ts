import type { KeyFinding } from './suggestionSchema';
import { formatSkimmableFinding } from './fieldPromptHelpers';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** Single UUID in parentheses — "(eb4832e7-…)". */
const INLINE_UUID_PARENS = new RegExp(`\\s*\\((${UUID})\\)`, 'gi');

/** "(evidence_ids: uuid, uuid)" or "(evidence_id: uuid)". */
const INLINE_EVIDENCE_IDS_PARENS = new RegExp(
  `\\s*\\(\\s*evidence_ids?\\s*:\\s*(?:${UUID}\\s*,\\s*)*${UUID}\\s*\\)`,
  'gi',
);

/** Trailing / inline "evidence_ids: uuid, uuid" without required parens. */
const INLINE_EVIDENCE_IDS_BARE = new RegExp(
  `\\s*evidence_ids?\\s*:\\s*(?:${UUID}\\s*,\\s*)*${UUID}`,
  'gi',
);

const ANY_UUID = new RegExp(UUID, 'gi');

export function stripInlineEvidenceIds(text: string): {
  text: string;
  extractedIds: string[];
} {
  const extractedIds: string[] = [];

  const collectUuids = (chunk: string) => {
    for (const m of chunk.matchAll(ANY_UUID)) {
      extractedIds.push(String(m[0]).toLowerCase());
    }
  };

  let cleaned = text;

  cleaned = cleaned.replace(INLINE_EVIDENCE_IDS_PARENS, (full) => {
    collectUuids(full);
    return '';
  });
  cleaned = cleaned.replace(INLINE_EVIDENCE_IDS_BARE, (full) => {
    collectUuids(full);
    return '';
  });
  cleaned = cleaned.replace(INLINE_UUID_PARENS, (_, id: string) => {
    extractedIds.push(String(id).toLowerCase());
    return '';
  });

  cleaned = cleaned
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();

  return { text: cleaned, extractedIds: [...new Set(extractedIds)] };
}

export function sanitizeKeyFinding(finding: KeyFinding): KeyFinding {
  const { text, extractedIds } = stripInlineEvidenceIds(finding.text);
  const evidence_ids = [...new Set([...(finding.evidence_ids ?? []), ...extractedIds])];
  return { ...finding, text: formatSkimmableFinding(text), evidence_ids };
}

export function sanitizeKeyFindings(findings: KeyFinding[]): KeyFinding[] {
  return findings.map(sanitizeKeyFinding).filter((f) => f.text.trim());
}

/** Strip inline citation UUIDs / evidence_ids lists from any user-facing suggestion string. */
export function sanitizeSuggestionText(text: string): string {
  return stripInlineEvidenceIds(text).text;
}
