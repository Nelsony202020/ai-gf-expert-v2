import { useEffect, useState } from 'react';
import { Icon } from '../ui';
import { ResultExplanationsPanel } from './explanations/ResultExplanationsPanel';
import { setExplanationLeaveGuard } from './explanations/explanationLeaveGuard';
import { SubscoreTakeawaysPanel } from './takeaways/SubscoreTakeawaysPanel';

type CopyTab = 'explanations' | 'takeaways';

interface Props {
  productId: string;
  testingComplete: boolean;
  initialTab?: CopyTab;
  onBack: () => void;
}

export function ReviewCopyPanel({
  productId,
  testingComplete,
  initialTab = 'explanations',
  onBack,
}: Props) {
  const [tab, setTab] = useState<CopyTab>(initialTab);
  const [explanationsDirty, setExplanationsDirty] = useState(false);
  const [takeawaysDirty, setTakeawaysDirty] = useState(false);
  const [explanationsNeedsReview, setExplanationsNeedsReview] = useState(0);
  const [takeawaysNeedsReview, setTakeawaysNeedsReview] = useState(0);

  const editorDirty = tab === 'explanations' ? explanationsDirty : takeawaysDirty;
  const needsReviewCount = explanationsNeedsReview + takeawaysNeedsReview;

  useEffect(() => {
    setExplanationLeaveGuard({ needsReviewCount, editorDirty });
    return () => setExplanationLeaveGuard(null);
  }, [needsReviewCount, editorDirty]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mb-0.5 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-pink-600"
          >
            ← Back to testing
          </button>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Review copy</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            AI-generated drawer text for evidence groups and subscore calculations.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Review copy sections"
          className="inline-flex rounded-xl border border-slate-200/90 bg-slate-100/80 p-1 shadow-inner dark:border-slate-700 dark:bg-slate-900/80"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'explanations'}
            onClick={() => setTab('explanations')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === 'explanations'
                ? 'bg-white text-pink-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-pink-300 dark:ring-slate-600'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
            }`}
          >
            <Icon name="description" className="!text-[15px]" />
            Evidence
            {explanationsNeedsReview > 0 && (
              <span className="ml-0.5 font-medium text-amber-600">({explanationsNeedsReview})</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'takeaways'}
            onClick={() => setTab('takeaways')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === 'takeaways'
                ? 'bg-white text-pink-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-pink-300 dark:ring-slate-600'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
            }`}
          >
            <Icon name="analytics" className="!text-[15px]" />
            Subscore
            {takeawaysNeedsReview > 0 && (
              <span className="ml-0.5 font-medium text-amber-600">({takeawaysNeedsReview})</span>
            )}
          </button>
        </div>
      </div>

      {tab === 'explanations' ? (
        <ResultExplanationsPanel
          productId={productId}
          testingComplete={testingComplete}
          onBack={onBack}
          embedded
          onDirtyChange={setExplanationsDirty}
          onNeedsReviewChange={setExplanationsNeedsReview}
        />
      ) : (
        <SubscoreTakeawaysPanel
          productId={productId}
          testingComplete={testingComplete}
          onDirtyChange={setTakeawaysDirty}
          onNeedsReviewChange={setTakeawaysNeedsReview}
        />
      )}
    </div>
  );
}
