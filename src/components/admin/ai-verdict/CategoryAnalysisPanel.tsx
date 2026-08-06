import { useMemo, useState } from 'react';
import { Button, ErrorNote, Icon } from '../ui';
import { useToast } from '../Toast';
import type { AiVerdictNotesDto } from '../../../lib/ai-verdict/notesSchema';
import { normalizeListField } from '../../../lib/ai-verdict/notesSchema';
import type { CategoryPerformanceDto, CategorySubscoreGroup } from '../../../lib/ai-verdict/categoryPerformance';
import { defaultExpandedSubscoreSlugs } from '../../../lib/ai-verdict/categoryPerformance';
import { getScoreVisual, isScoreCalculated } from '../../../lib/scores';
import {
  applyListInsert,
  confirmInsertConflict,
} from './insertHelpers';

function BreakdownScoreChip({ score, notApplicable }: { score: number | null; notApplicable?: boolean }) {
  if (notApplicable) {
    return <span className="cat-breakdown-score cat-breakdown-score--na">N/A</span>;
  }
  if (!isScoreCalculated(score)) {
    return <span className="cat-breakdown-score cat-breakdown-score--na">—</span>;
  }
  const visual = getScoreVisual(score);
  return (
    <span className={`cat-breakdown-score cat-breakdown-score--${visual.band}`}>
      {score.toFixed(1)}
    </span>
  );
}

function noteLabel(note?: string): string | null {
  switch (note) {
    case 'best':
      return 'Best';
    case 'limitation':
      return 'Limitation';
    case 'unavailable':
      return 'N/A';
    default:
      return null;
  }
}

function SubscoreGroupSection({
  group,
  defaultOpen,
}: {
  group: CategorySubscoreGroup;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="cat-breakdown-group">
      <button
        type="button"
        className="cat-breakdown-group__head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cat-breakdown-group__name">{group.name}</span>
        <BreakdownScoreChip score={group.score} />
        <Icon
          name={open ? 'expand_more' : 'chevron_right'}
          className="cat-breakdown-group__chev !text-[18px]"
        />
      </button>
      {open && (
        <div className="cat-breakdown-table" role="table">
          <div className="cat-breakdown-table__head" role="row">
            <span role="columnheader">Result</span>
            <span role="columnheader" className="text-right">
              Score
            </span>
            <span role="columnheader" className="text-right">
              Note
            </span>
          </div>
          {group.rows.map((row) => {
            const note = noteLabel(
              row.note ??
                (row.highlight === 'best' ? 'best' : row.highlight === 'worst' ? 'limitation' : undefined),
            );
            return (
              <div key={row.slug} className="cat-breakdown-table__row" role="row">
                <span className="cat-breakdown-table__label" role="cell">
                  {row.label}
                </span>
                <span className="cat-breakdown-table__score" role="cell">
                  <BreakdownScoreChip score={row.score} notApplicable={row.notApplicable} />
                </span>
                <span className="cat-breakdown-table__note" role="cell">
                  {note ?? ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProConChip({ text, onInsert }: { text: string; onInsert: () => void }) {
  return (
    <div className="cat-analysis-chip">
      <span className="min-w-0 flex-1">{text}</span>
      <Button variant="secondary" className="!px-2 !py-0.5 text-[11px] shrink-0" onClick={onInsert}>
        Insert
      </Button>
    </div>
  );
}

export function CategoryAnalysisPanel({
  categoryName,
  performance,
  notes,
  loading,
  generating,
  error,
  onGenerate,
  onRegenerate,
  getFieldValue,
  onInsertListField,
}: {
  categoryName: string;
  performance: CategoryPerformanceDto | null;
  notes: AiVerdictNotesDto | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  getFieldValue: (fieldKey: string) => string | string[];
  onInsertListField: (fieldKey: string, items: string[]) => void;
}) {
  const toast = useToast();

  const pros = normalizeListField(notes?.fieldSuggestions?.pros);
  const cons = normalizeListField(notes?.fieldSuggestions?.cons);
  const findings = notes?.keyFindings ?? [];

  function insertList(fieldKey: 'pros' | 'cons', items: string[], single?: string) {
    const label = fieldKey === 'pros' ? 'Pros' : 'Cons';
    const toInsert = single ? [single] : items;
    const existing = getFieldValue(fieldKey);
    const current = (Array.isArray(existing) ? existing : []).filter((s) => s.trim());
    if (current.length > 0) {
      const choice = confirmInsertConflict(label);
      const next = applyListInsert(current, toInsert, choice);
      if (next == null) return;
      onInsertListField(fieldKey, next);
    } else {
      onInsertListField(fieldKey, toInsert);
    }
    toast.success(single ? `Inserted into ${label}` : `Inserted all into ${label}`);
  }

  const perf = performance ?? notes?.performance ?? null;
  const groups = perf?.subscoreGroups?.length
    ? perf.subscoreGroups
    : perf?.breakdown?.length
      ? [{ slug: '_all', name: categoryName, score: perf.categoryScore, rows: perf.breakdown }]
      : [];

  const expandedSlugs = useMemo(() => defaultExpandedSubscoreSlugs(groups), [groups]);

  return (
    <div className="cat-analysis-panel">
      {error && <ErrorNote message={error} />}

      {notes?.stale && (
        <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
          Test results changed — regenerate analysis for updated findings.
        </p>
      )}

      {perf && (
        <section className="cat-analysis-score-block">
          <p className="cat-analysis-kicker">{categoryName} score</p>
          <p className="cat-analysis-score-value tabular-nums">
            {perf.categoryScore != null ? perf.categoryScore.toFixed(1) : '—'}
            <span className="cat-analysis-score-denom"> / 10</span>
          </p>
          {perf.siteAverage != null && (
            <p className="cat-analysis-avg tabular-nums">
              Site average {perf.siteAverage.toFixed(1)}
              {perf.difference != null && (
                <>
                  {' '}
                  · {perf.difference >= 0 ? '+' : ''}
                  {perf.difference.toFixed(1)}
                </>
              )}
            </p>
          )}
        </section>
      )}

      {groups.length > 0 && (
        <section className="cat-analysis-section">
          <p className="cat-analysis-kicker">Category breakdown</p>
          <div className="cat-breakdown-groups">
            {groups.map((group) => (
              <SubscoreGroupSection
                key={group.slug}
                group={group}
                defaultOpen={expandedSlugs.has(group.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {!loading && !generating && !notes && !error && (
        <div className="cat-analysis-empty">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Generate analysis for important findings and suggested pros/cons.
          </p>
          <Button className="mt-3" onClick={onGenerate}>
            <Icon name="auto_awesome" className="!text-[18px]" />
            Generate analysis
          </Button>
        </div>
      )}

      {notes && (
        <>
          <section className="cat-analysis-section">
            <p className="cat-analysis-kicker">Important findings</p>
            {findings.length === 0 ? (
              <p className="text-sm text-slate-500">No findings generated yet.</p>
            ) : (
              <ul className="cat-analysis-findings">
                {findings.map((f, i) => (
                  <li key={i}>{f.text}</li>
                ))}
              </ul>
            )}
          </section>

          {(pros.length > 0 || cons.length > 0) && (
            <section className="cat-analysis-section">
              <p className="cat-analysis-kicker">Suggested pros and cons</p>
              <div className="cat-analysis-pros-cons">
                {pros.length > 0 && (
                  <div className="cat-analysis-pros-cons__col">
                    <p className="cat-analysis-subkicker">Pros</p>
                    <div className="cat-analysis-pros-cons__list">
                      {pros.map((item) => (
                        <ProConChip key={item} text={item} onInsert={() => insertList('pros', pros, item)} />
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      className="mt-1.5 !py-0.5 !text-[11px]"
                      onClick={() => insertList('pros', pros)}
                    >
                      Insert all
                    </Button>
                  </div>
                )}
                {cons.length > 0 && (
                  <div className="cat-analysis-pros-cons__col">
                    <p className="cat-analysis-subkicker">Cons</p>
                    <div className="cat-analysis-pros-cons__list">
                      {cons.map((item) => (
                        <ProConChip key={item} text={item} onInsert={() => insertList('cons', cons, item)} />
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      className="mt-1.5 !py-0.5 !text-[11px]"
                      onClick={() => insertList('cons', cons)}
                    >
                      Insert all
                    </Button>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="cat-analysis-regen">
            <button
              type="button"
              disabled={generating}
              className="cat-analysis-regen-btn"
              onClick={() => onRegenerate()}
            >
              <Icon
                name={generating ? 'progress_activity' : 'auto_awesome'}
                className={`!text-[14px] ${generating ? 'animate-spin' : ''}`}
              />
              {generating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
