import { useEffect, useState } from 'react';
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
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setTab('explanations')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === 'explanations'
                ? 'bg-white text-pink-700 shadow-sm dark:bg-slate-800 dark:text-pink-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Evidence explanations
            {explanationsNeedsReview > 0 && (
              <span className="ml-1 text-amber-600">({explanationsNeedsReview})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('takeaways')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === 'takeaways'
                ? 'bg-white text-pink-700 shadow-sm dark:bg-slate-800 dark:text-pink-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Subscore takeaways
            {takeawaysNeedsReview > 0 && (
              <span className="ml-1 text-amber-600">({takeawaysNeedsReview})</span>
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
