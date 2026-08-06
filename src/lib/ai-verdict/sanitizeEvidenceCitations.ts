import type { KeyFinding } from './suggestionSchema';

/** UUIDs the model sometimes pastes inline, e.g. "(eb4832e7-eae1-4ac5-995f-5ab71a24e6f1)". */
const INLINE_EVIDENCE_ID =
  /\s*\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/gi;

export function stripInlineEvidenceIds(text: string): {
  text: string;
  extractedIds: string[];
} {
  const extractedIds: string[] = [];
  const cleaned = text
    .replace(INLINE_EVIDENCE_ID, (_, id: string) => {
      extractedIds.push(String(id).toLowerCase());
      return '';
    })
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { text: cleaned, extractedIds };
}

export function sanitizeKeyFinding(finding: KeyFinding): KeyFinding {
  const { text, extractedIds } = stripInlineEvidenceIds(finding.text);
  const evidence_ids = [...new Set([...(finding.evidence_ids ?? []), ...extractedIds])];
  return { ...finding, text, evidence_ids };
}

export function sanitizeKeyFindings(findings: KeyFinding[]): KeyFinding[] {
  return findings.map(sanitizeKeyFinding).filter((f) => f.text.trim());
}

/** Strip inline citation UUIDs from any user-facing suggestion string. */
export function sanitizeSuggestionText(text: string): string {
  return stripInlineEvidenceIds(text).text;
}
