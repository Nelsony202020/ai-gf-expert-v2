import { Button, Icon } from '../ui';
import {
  aiPrivacySummaryFromResults,
  BILLING_AI_SLUGS,
  DATA_CONTROLS_AI_SLUGS,
  isAiPrivacyFlaggedForReview,
  POLICY_REVIEW_AI_SLUGS,
  readAiPrivacyDetails,
} from '../../../lib/ai-privacy/clientHelpers';
import type { SessionItem } from './sessionUi';
import type { EntityRow } from '../api';

function countLine(count: number, singular: string, plural: string): string | null {
  if (count <= 0) return null;
  return `${count} ${count === 1 ? singular : plural}`;
}

export function AiPrivacyBanner({
  resultByDef,
  items,
  sessionId,
  onReviewFlagged,
}: {
  resultByDef: Map<string, EntityRow>;
  items: SessionItem[];
  sessionId: string;
  onReviewFlagged?: () => void;
}) {
  const slugs =
    sessionId === 'data-controls'
      ? DATA_CONTROLS_AI_SLUGS
      : sessionId === 'pricing-billing'
        ? BILLING_AI_SLUGS
        : POLICY_REVIEW_AI_SLUGS;

  const rows = items
    .filter(({ def }) => slugs.includes(String(def.slug) as (typeof slugs)[number]))
    .map(({ def }) => {
      const r = resultByDef.get(def.id);
      return r ? { ...r, evidenceDefinition: { slug: String(def.slug) } } : null;
    });

  const summary = aiPrivacySummaryFromResults(rows, slugs);
  if (summary.withAi === 0) return null;

  const countLines = [
    countLine(summary.filledAutomatically, 'answer was filled automatically', 'answers were filled automatically'),
    countLine(summary.needsReview, 'answer needs your review', 'answers need your review'),
    countLine(summary.notFound, 'answer was not found', 'answers were not found'),
    countLine(summary.conflicting, 'answer has conflicting policies', 'answers have conflicting policies'),
    countLine(summary.manuallyCompleted, 'answer was completed manually', 'answers were completed manually'),
    countLine(summary.reviewed, 'answer was reviewed', 'answers were reviewed'),
  ].filter(Boolean);

  const showReviewButton = summary.flaggedCount > 0 && Boolean(onReviewFlagged);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <Icon name="auto_awesome" className="!text-[15px] shrink-0 text-pink-500" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">AI policy scan complete</p>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            The uploaded policies were checked against the privacy questions below.
          </p>
          {countLines.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
              {countLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {summary.filledAutomatically > 0 && summary.reviewed < summary.withAi && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Review every AI-filled answer before continuing.
            </p>
          )}
        </div>
        {showReviewButton && (
          <Button type="button" variant="secondary" className="!py-1 text-xs shrink-0" onClick={onReviewFlagged}>
            Review flagged answers
          </Button>
        )}
      </div>
    </div>
  );
}

export function findFirstFlaggedDefId(items: SessionItem[], resultByDef: Map<string, EntityRow>): string | null {
  for (const { def } of items) {
    const ai = readAiPrivacyDetails(resultByDef.get(def.id));
    if (ai && isAiPrivacyFlaggedForReview(ai)) return def.id;
  }
  return null;
}
