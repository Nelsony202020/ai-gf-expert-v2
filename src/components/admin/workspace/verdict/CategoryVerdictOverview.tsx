import { Button, Icon } from '../../ui';
import {
  computeCategoryVerdictProgress,
  countCompleteCategories,
  nextIncompleteCategorySlug,
  type CategoryVerdictProgress,
} from './categoryVerdictProgress';
import type { CategoryVerdict } from './types';

export function CategoryVerdictOverview({
  categories,
  categoryVerdicts,
  categoryScores,
  remainingRequiredTests,
  onOpen,
  onContinueNext,
}: {
  categories: { slug: string; name: string }[];
  categoryVerdicts: Record<string, CategoryVerdict>;
  categoryScores: Map<string, number | null>;
  remainingRequiredTests?: number | null;
  onOpen: (slug: string) => void;
  onContinueNext: (slug: string) => void;
}) {
  const slugs = categories.map((c) => String(c.slug));
  const completeCount = countCompleteCategories(slugs, categoryVerdicts);
  const nextSlug = nextIncompleteCategorySlug(slugs, categoryVerdicts);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {completeCount} of {categories.length} complete
          </p>
        </div>
        {nextSlug && (
          <Button variant="secondary" className="!py-1.5 text-xs" onClick={() => onContinueNext(nextSlug)}>
            <Icon name="arrow_forward" className="!text-[16px]" />
            Continue next incomplete
          </Button>
        )}
      </div>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
        {categories.map((cat) => {
          const slug = String(cat.slug);
          const score = categoryScores.get(slug);
          const prog = computeCategoryVerdictProgress(categoryVerdicts[slug], {
            hasScore: score != null,
            remainingRequiredTests,
          });
          return (
            <li key={slug}>
              <button
                type="button"
                data-category-slug={slug}
                onClick={() => onOpen(slug)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {cat.name}
                </span>
                {score != null && (
                  <span className="shrink-0 text-sm tabular-nums text-slate-600 dark:text-slate-300">
                    {score.toFixed(1)}
                  </span>
                )}
                <StatusPill progress={prog} />
                <Icon name="chevron_right" className="!text-[20px] shrink-0 text-slate-400" />
              </button>
            </li>
          );
        })}
      </ul>
      {categories.length === 0 && (
        <p className="text-sm text-slate-400">No rating categories configured.</p>
      )}
    </div>
  );
}

function StatusPill({ progress }: { progress: CategoryVerdictProgress }) {
  const tone =
    progress.status === 'complete'
      ? 'text-green-700 dark:text-green-400'
      : progress.status === 'not_started'
        ? 'text-slate-400'
        : progress.status === 'missing_test_data'
          ? 'text-slate-500'
          : 'text-amber-700 dark:text-amber-400';

  return (
    <span className={`shrink-0 text-xs font-medium ${tone}`}>
      {progress.status === 'complete' && (
        <Icon name="check_circle" className="mr-0.5 inline !text-[13px] align-[-2px]" />
      )}
      {progress.statusLabel}
    </span>
  );
}
