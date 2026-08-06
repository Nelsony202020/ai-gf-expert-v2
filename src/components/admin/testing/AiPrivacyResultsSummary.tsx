import { Button, Icon } from '../ui';
import {
  buildAnswerBreakdown,
  groupBreakdownByStatus,
  statusLabel,
  type AiPrivacyAnswerBreakdown,
} from '../../../lib/ai-privacy/slugMeta';
import type { PrivacyStructuredOutput } from '../../../lib/ai-privacy/types';

function AnswerRow({
  row,
  onNavigate,
}: {
  row: AiPrivacyAnswerBreakdown;
  onNavigate?: (slug: string) => void;
}) {
  const tone =
    row.status === 'filled'
      ? 'text-emerald-700 dark:text-emerald-300'
      : row.status === 'not_found' || row.status === 'not_applicable'
        ? 'text-slate-500 dark:text-slate-400'
        : 'text-amber-700 dark:text-amber-300';

  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      <Icon name="auto_awesome" className={`!text-[13px] shrink-0 ${tone}`} />
      {onNavigate ? (
        <button
          type="button"
          onClick={() => onNavigate(row.slug)}
          className="font-medium text-pink-600 underline decoration-pink-300/60 underline-offset-2 hover:text-pink-700 dark:text-pink-400"
        >
          {row.label}
        </button>
      ) : (
        <span className="font-medium text-slate-700 dark:text-slate-200">{row.label}</span>
      )}
      <span className={tone}>
        · {statusLabel(row.status)}
        {row.answerPreview ? ` · ${row.answerPreview}` : ''}
      </span>
    </li>
  );
}

function AnswerGroup({
  title,
  rows,
  onNavigate,
}: {
  title: string;
  rows: AiPrivacyAnswerBreakdown[];
  onNavigate?: (slug: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <AnswerRow key={row.slug} row={row} onNavigate={onNavigate} />
        ))}
      </ul>
    </div>
  );
}

export function AiPrivacyResultsSummary({
  output,
  onNavigateToSlug,
  showManualReminder = true,
}: {
  output: PrivacyStructuredOutput;
  onNavigateToSlug?: (slug: string) => void;
  showManualReminder?: boolean;
}) {
  const breakdown = buildAnswerBreakdown(output);
  const groups = groupBreakdownByStatus(breakdown);

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        Scraping only fetches policy text. The AI then proposes answers for specific questions below —
        empty rows mean the policy did not clearly cover that topic.
      </p>

      <AnswerGroup title="Answers proposed" rows={groups.filled} onNavigate={onNavigateToSlug} />
      <AnswerGroup title="Needs your review" rows={groups.needsReview} onNavigate={onNavigateToSlug} />
      <AnswerGroup title="Not found in policy" rows={groups.notFound} onNavigate={onNavigateToSlug} />

      {onNavigateToSlug && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="!py-1 text-xs"
            onClick={() => onNavigateToSlug('human-review')}
          >
            Open policy review →
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="!py-1 text-xs"
            onClick={() => onNavigateToSlug('training')}
          >
            Open data controls →
          </Button>
        </div>
      )}

      {showManualReminder && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Delete chats and export data are still manual test-account checks. Delete account / delete
          personal data AI answers are from policy text only — verify in the app before accepting.
        </p>
      )}
    </div>
  );
}
