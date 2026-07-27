import { useEffect, useState } from 'react';
import { Button, ErrorNote, Icon, Spinner } from '../ui';
import type { AiVerdictScope } from '../../../lib/ai-verdict/config';
import type { AiSuggestionOutput } from '../../../lib/ai-verdict/suggestionSchema';
import { AiKeyFindingsList } from './AiKeyFindingsList';
import {
  AiSuggestionField,
  AiSuggestionListField,
  extractCategoryFields,
  extractOverallFields,
} from './AiSuggestionField';
import { AiStaleBanner } from './AiStaleBanner';
import type { AiSuggestionDto } from './useAiVerdict';
import '../testing/testing-ui.css';

export function AiVerdictDrawer({
  open,
  scope,
  categorySlug,
  categoryName,
  productName,
  testRunName,
  evidenceCount,
  loading,
  error,
  suggestion,
  onClose,
  onRegenerate,
  onInsertOverall,
  onInsertCategory,
  onInsertField,
  onReject,
}: {
  open: boolean;
  scope: AiVerdictScope;
  categorySlug?: string;
  categoryName?: string;
  productName: string;
  testRunName?: string;
  evidenceCount?: number;
  loading: boolean;
  error: string | null;
  suggestion: AiSuggestionDto | null;
  onClose: () => void;
  onRegenerate: () => void;
  onInsertOverall: (patch: Record<string, unknown>) => void;
  onInsertCategory: (slug: string, patch: Record<string, unknown>) => void;
  onInsertField: (field: string, text: string) => void;
  onReject: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [animOpen, setAnimOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const t = requestAnimationFrame(() => setAnimOpen(true));
      return () => cancelAnimationFrame(t);
    }
    setAnimOpen(false);
    const t = window.setTimeout(() => setVisible(false), 220);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function handleClose() {
    setAnimOpen(false);
    window.setTimeout(onClose, 220);
  }

  if (!visible) return null;

  const output = suggestion?.structuredOutput;
  const title =
    scope === 'category'
      ? `Suggest from ${categoryName ?? categorySlug ?? 'category'} data`
      : scope === 'field'
        ? 'Suggest field'
        : scope === 'outline'
          ? 'Expert opinion outline'
          : 'Suggest from testing';

  function confirmReplace(existing: boolean): boolean {
    if (!existing) return true;
    return confirm('Replace existing text in this field?');
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close AI suggestions"
        className={`testing-proof-backdrop fixed inset-0 z-[60] bg-slate-900/30 transition-opacity duration-200 ${
          animOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <aside
        className={`testing-proof-drawer fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900 ${
          animOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-labelledby="ai-verdict-drawer-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--testing-accent-muted)]">
              AI editorial assistant
            </p>
            <h2 id="ai-verdict-drawer-title" className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {productName}
              {testRunName ? ` · ${testRunName}` : ''}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700">
            <Icon name="close" className="!text-[20px]" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Spinner />
              Analyzing {evidenceCount ?? '…'} test results…
            </div>
          )}
          {error && <ErrorNote message={error} />}

          {suggestion && (
            <>
              <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
                <p>
                  Source: test run · {suggestion.evidenceIds.length} evidence items · {suggestion.model}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Suggestions are drafts — insert individually, edit, then save the product manually.
                </p>
              </div>

              {output?.warnings && output.warnings.length > 0 && (
                <ul className="text-xs text-amber-700 dark:text-amber-300">
                  {output.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              )}

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Key findings</h3>
                <AiKeyFindingsList findings={suggestion.keyFindings} />
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggestions</h3>
                {scope === 'overall' && output && (
                  <>
                    <AiSuggestionField
                      label="Verdict headline"
                      block={output.one_line_verdict}
                      busy={loading}
                      onInsert={() => {
                        if (confirmReplace(Boolean(output.one_line_verdict?.text))) {
                          onInsertOverall(extractOverallFields(output));
                        }
                      }}
                      onDismiss={onReject}
                    />
                    <AiSuggestionField
                      label="Overall verdict"
                      block={output.overall_verdict}
                      busy={loading}
                      onInsert={() => onInsertOverall({ ourTake: output.overall_verdict?.text })}
                      onDismiss={onReject}
                    />
                    <AiSuggestionListField
                      label="Pros"
                      items={output.pros}
                      busy={loading}
                      onInsertAll={() => onInsertOverall({ pros: output.pros?.map((x) => x.text) })}
                    />
                    <AiSuggestionListField
                      label="Cons"
                      items={output.cons}
                      busy={loading}
                      onInsertAll={() => onInsertOverall({ cons: output.cons?.map((x) => x.text) })}
                    />
                    <AiSuggestionListField
                      label="Best for"
                      items={output.best_for}
                      busy={loading}
                      onInsertAll={() =>
                        onInsertOverall({ bestFor: output.best_for?.map((x) => x.text) })
                      }
                    />
                    <AiSuggestionListField
                      label="Not ideal for"
                      items={output.not_ideal_for}
                      busy={loading}
                      onInsertAll={() =>
                        onInsertOverall({ notIdealFor: output.not_ideal_for?.map((x) => x.text) })
                      }
                    />
                    <div className="pt-2">
                      <Button
                        className="w-full !py-2 text-sm"
                        disabled={loading}
                        onClick={() => onInsertOverall(extractOverallFields(output))}
                      >
                        Insert all overall suggestions
                      </Button>
                    </div>
                  </>
                )}
                {scope === 'category' && output && categorySlug && (
                  <>
                    <AiSuggestionField
                      label="Category headline"
                      block={output.category_verdict_headline}
                      busy={loading}
                      onInsert={() =>
                        onInsertCategory(categorySlug, extractCategoryFields(output))
                      }
                      onDismiss={onReject}
                    />
                    <AiSuggestionField
                      label="Category verdict"
                      block={output.category_verdict}
                      busy={loading}
                      onInsert={() =>
                        onInsertCategory(categorySlug, {
                          verdict: output.category_verdict?.text,
                        })
                      }
                      onDismiss={onReject}
                    />
                    <AiSuggestionListField
                      label="Category pros"
                      items={output.category_pros}
                      busy={loading}
                      onInsertAll={() =>
                        onInsertCategory(categorySlug, {
                          pros: output.category_pros?.map((x) => x.text),
                        })
                      }
                    />
                    <div className="pt-2">
                      <Button
                        className="w-full !py-2 text-sm"
                        disabled={loading}
                        onClick={() =>
                          onInsertCategory(categorySlug, extractCategoryFields(output))
                        }
                      >
                        Insert all category suggestions
                      </Button>
                    </div>
                  </>
                )}
                {scope === 'field' && output?.field_suggestion && (
                  <AiSuggestionField
                    label="Suggested text"
                    block={output.field_suggestion}
                    busy={loading}
                    onInsert={() => onInsertField('', output.field_suggestion!.text)}
                    onDismiss={onReject}
                  />
                )}
                {scope === 'outline' && output?.expert_opinion_outline && (
                  <AiSuggestionListField
                    label="Expert opinion outline (prompts only)"
                    items={output.expert_opinion_outline}
                    busy={loading}
                    onInsertAll={() => {}}
                  />
                )}
              </section>

              <AiStaleBanner onRegenerate={onRegenerate} />
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onRegenerate} disabled={loading}>
              Regenerate
            </Button>
            <Button variant="ghost" className="flex-1" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
