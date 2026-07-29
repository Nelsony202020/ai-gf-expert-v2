import type { DraftEvidenceCategory } from '../draft-ratings/types';
import { fmtScore } from '../scores';

export interface EvidenceTooltipItem {
  label: string;
  score: number | null;
  summary?: string;
  drawerId?: string;
}

/** Map draft evidence categories to tooltip rows — same order/labels as EvidenceCategoryTable. */
export function evidenceCategoriesToTooltipItems(
  items: DraftEvidenceCategory[],
  hideScores = false,
): EvidenceTooltipItem[] {
  return items.map((item) => ({
    label: item.name,
    score: hideScores ? null : item.score,
    summary: item.cardTeaser || item.summary,
    drawerId: item.drawerId,
  }));
}

/** Display string for tooltip summary line — mirrors table "Summary" column semantics. */
export function evidenceTooltipSummaryLine(item: EvidenceTooltipItem): string {
  const summary = item.summary?.trim();
  if (summary && summary !== '—') return summary;
  if (item.score != null) return fmtScore(item.score);
  return 'N/A';
}
