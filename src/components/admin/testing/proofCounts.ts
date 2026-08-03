import type { EntityRow } from '../api';
import { parseProofLinks } from './proofLinks';

/** Attachment counts keyed by evidenceResult id. */
export function buildProofCountMap(
  media: EntityRow[],
  results: Iterable<EntityRow>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const m of media) {
    if (m.deletedAt) continue;
    const rid = m.evidenceResult?.id;
    if (!rid) continue;
    counts.set(rid, (counts.get(rid) ?? 0) + 1);
  }
  for (const result of results) {
    if (!result?.id) continue;
    const linkCount = parseProofLinks(result.proofLinks).length;
    if (linkCount > 0) {
      counts.set(result.id, (counts.get(result.id) ?? 0) + linkCount);
    }
  }
  return counts;
}
