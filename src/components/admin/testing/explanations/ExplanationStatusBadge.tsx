import type { ExplanationStatus } from '../../../../lib/ai-explanations/types';
import { Badge, Icon } from '../../ui';

const LABELS: Record<ExplanationStatus, string> = {
  not_generated: 'Not generated',
  draft: 'Draft',
  needs_review: 'Needs review',
  approved: 'Approved',
  outdated: 'Outdated',
  error: 'Error',
};

const TONES: Record<ExplanationStatus, 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'pink'> = {
  not_generated: 'gray',
  draft: 'blue',
  needs_review: 'amber',
  approved: 'green',
  outdated: 'amber',
  error: 'red',
};

export function ExplanationStatusBadge({
  status,
  loading,
}: {
  status: ExplanationStatus;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon name="progress_activity" className="animate-spin !text-[12px]" />
        Generating…
      </span>
    );
  }
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}
