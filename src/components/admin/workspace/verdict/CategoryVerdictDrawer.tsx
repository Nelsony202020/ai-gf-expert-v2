import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DRAWER_UNMOUNT_MS } from '../../../../lib/drawer/animate';
import { CategoryAnalysisPanel } from '../../ai-verdict/CategoryAnalysisPanel';
import type { AiVerdictNotesDto } from '../../../../lib/ai-verdict/notesSchema';
import type { CategoryPerformanceDto } from '../../../../lib/ai-verdict/categoryPerformance';
import { Button, DrawerCloseButton, Field, Icon, TextArea, TextInput } from '../../ui';
import { CategoryProsConsEditor } from './CategoryProsConsEditor';
import {
  CATEGORY_MISSING_SUMMARY_LABELS,
  CATEGORY_REQUIRED_FIELDS,
  computeCategoryVerdictProgress,
  patchCategoryProsOrCons,
  sanitizeCategoryVerdictDraft,
} from './categoryVerdictProgress';
import type { CategoryVerdict } from './types';
import '../../testing/testing-ui.css';

const EMPTY: CategoryVerdict = {};
const SPLIT_STORAGE_KEY = 'category-verdict-drawer-split';
const DEFAULT_SPLIT_PCT = 30;
const MIN_SPLIT_PCT = 24;
const MAX_SPLIT_PCT = 68;

function wordCount(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function readStoredSplit(): number {
  try {
    const raw = sessionStorage.getItem(SPLIT_STORAGE_KEY);
    const n = raw ? Number(raw) : DEFAULT_SPLIT_PCT;
    if (!Number.isFinite(n)) return DEFAULT_SPLIT_PCT;
    // Older sessions stored ~42% reference height — prefer the smaller writing-first default.
    if (n > 35) return DEFAULT_SPLIT_PCT;
    return Math.min(MAX_SPLIT_PCT, Math.max(MIN_SPLIT_PCT, n));
  } catch {
    return DEFAULT_SPLIT_PCT;
  }
}

export function CategoryVerdictDrawer({
  slug,
  categoryName,
  categoryId,
  score,
  categories,
  saved,
  saving,
  remainingRequiredTests,
  categoryRemainingTests,
  isPreview,
  aiAssisted,
  testRunId,
  productName,
  testRunLabel,
  testingHref,
  onClose,
  onSave,
  analysis,
  onMarkAiAssisted,
  renderFieldAssist,
  onNavigate,
  onContinueNext,
}: {
  slug: string;
  categoryName: string;
  categoryId?: string;
  score: number | null;
  categories: { slug: string; name: string }[];
  saved: CategoryVerdict | undefined;
  saving: boolean;
  remainingRequiredTests: number | null;
  categoryRemainingTests: number | null;
  isPreview: boolean;
  aiAssisted?: boolean;
  testRunId?: string;
  productName?: string;
  testRunLabel?: string;
  testingHref: string;
  onClose: () => void;
  onSave: (slug: string, draft: CategoryVerdict) => Promise<boolean>;
  analysis?: {
    performance: CategoryPerformanceDto | null;
    notes: AiVerdictNotesDto | null;
    loading: boolean;
    generating: boolean;
    error: string | null;
    onGenerate: () => void;
    onRegenerate: () => void;
  };
  onMarkAiAssisted?: () => void;
  renderFieldAssist?: (opts: {
    fieldKey: string;
    targetField: string;
    hasText: boolean;
    currentText?: string;
    list?: boolean;
    onText?: (text: string) => void;
    onItems?: (items: string[]) => void;
  }) => ReactNode;
  onNavigate: (slug: string) => void;
  onContinueNext: (slug: string) => void;
}) {
  const [draft, setDraft] = useState<CategoryVerdict>(saved ?? EMPTY);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [animOpen, setAnimOpen] = useState(false);
  const [testingNoticeOpen, setTestingNoticeOpen] = useState(false);
  const [splitPct, setSplitPct] = useState(readStoredSplit);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const savedRef = useRef(JSON.stringify(saved ?? EMPTY));
  const panelRef = useRef<HTMLElement>(null);
  const splitBodyRef = useRef<HTMLDivElement>(null);
  const returnFocusSlug = useRef(slug);

  const slugs = categories.map((c) => String(c.slug));
  const idx = slugs.indexOf(slug);
  const prevSlug = idx > 0 ? slugs[idx - 1] : null;
  const nextSlug = idx >= 0 && idx < slugs.length - 1 ? slugs[idx + 1] : null;
  const positionLabel = idx >= 0 ? `Category ${idx + 1} of ${slugs.length}` : null;

  const remainingForNotice = categoryRemainingTests ?? remainingRequiredTests;

  useEffect(() => {
    returnFocusSlug.current = slug;
    const t = requestAnimationFrame(() => setAnimOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    panelRef.current?.focus();
  }, [slug]);

  useEffect(() => {
    const next = saved ?? EMPTY;
    setDraft(next);
    savedRef.current = JSON.stringify(next);
    setDirty(false);
  }, [slug, saved]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') tryClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  const progress = useMemo(
    () =>
      computeCategoryVerdictProgress(draft, {
        hasScore: score != null,
        remainingRequiredTests: remainingForNotice,
      }),
    [draft, score, remainingForNotice],
  );

  const missingSummaryItems = useMemo(
    () =>
      CATEGORY_REQUIRED_FIELDS.filter((f) => {
        const sanitized = sanitizeCategoryVerdictDraft(draft);
        switch (f.key) {
          case 'headline':
            return !sanitized.headline;
          case 'verdict':
            return !sanitized.verdict;
          case 'mainStrength':
            return !sanitized.mainStrength;
          case 'mainWeakness':
            return !sanitized.mainWeakness;
          case 'pros':
            return !sanitized.pros?.length;
          case 'cons':
            return !sanitized.cons?.length;
        }
      }).map((f) => CATEGORY_MISSING_SUMMARY_LABELS[f.key]),
    [draft],
  );

  const persistSplit = useCallback((pct: number) => {
    try {
      sessionStorage.setItem(SPLIT_STORAGE_KEY, String(pct));
    } catch {
      /* ignore */
    }
  }, []);

  const startSplitDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const body = splitBodyRef.current;
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const startY = e.clientY;
      const startSplit = splitPct;
      setDraggingSplit(true);

      function onMove(ev: MouseEvent) {
        const deltaPct = ((ev.clientY - startY) / rect.height) * 100;
        const next = Math.min(MAX_SPLIT_PCT, Math.max(MIN_SPLIT_PCT, startSplit + deltaPct));
        setSplitPct(next);
      }

      function onUp(ev: MouseEvent) {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        setDraggingSplit(false);
        const deltaPct = ((ev.clientY - startY) / rect.height) * 100;
        const next = Math.min(MAX_SPLIT_PCT, Math.max(MIN_SPLIT_PCT, startSplit + deltaPct));
        persistSplit(next);
      }

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [splitPct, persistSplit],
  );

  function patch(p: Partial<CategoryVerdict>) {
    setDraft((prev) => ({ ...prev, ...p }));
    setDirty(true);
  }

  const insertProsCons = useCallback(
    (fieldKey: 'pros' | 'cons', items: string[]) => {
      patch(patchCategoryProsOrCons(fieldKey, items));
      onMarkAiAssisted?.();
    },
    [onMarkAiAssisted],
  );

  const getProsConsValue = useCallback(
    (fieldKey: string): string | string[] => {
      if (fieldKey === 'pros') return draft.pros ?? [];
      if (fieldKey === 'cons') return draft.cons ?? [];
      return '';
    },
    [draft.pros, draft.cons],
  );

  function tryClose() {
    if (dirty) {
      void saveDraft().then((ok) => {
        if (ok) closeDrawer();
      });
      return;
    }
    closeDrawer();
  }

  function closeDrawer() {
    setAnimOpen(false);
    window.setTimeout(() => {
      onClose();
      const row = document.querySelector<HTMLElement>(`[data-category-slug="${returnFocusSlug.current}"]`);
      row?.focus();
    }, DRAWER_UNMOUNT_MS);
  }

  async function saveDraft(): Promise<boolean> {
    const cleaned = sanitizeCategoryVerdictDraft(draft);
    const ok = await onSave(slug, cleaned);
    if (ok) {
      setDraft(cleaned);
      setDirty(false);
      savedRef.current = JSON.stringify(cleaned);
      setLastSavedAt(Date.now());
    }
    return ok;
  }

  async function saveAndContinue() {
    const ok = dirty ? await saveDraft() : true;
    if (!ok) return;
    if (nextSlug) onContinueNext(nextSlug);
    else closeDrawer();
  }

  function navigateTo(target: string) {
    if (dirty) {
      void saveDraft().then((ok) => {
        if (ok) onNavigate(target);
      });
      return;
    }
    onNavigate(target);
  }

  const verdictWords = wordCount(draft.verdict ?? '');
  const verdictChars = (draft.verdict ?? '').length;
  const showLargeTestingWarning = progress.status === 'missing_test_data';
  const showCompactTestingNotice =
    !showLargeTestingWarning && remainingForNotice != null && remainingForNotice > 0;

  const scoreSummary =
    score != null ? `${categoryName} score: ${score.toFixed(1)}` : `${categoryName} score: —`;

  if (!slug) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close category editor"
        className={`testing-proof-backdrop fixed inset-0 z-[55] bg-slate-900/50 backdrop-blur-[1px] transition-opacity duration-200 ${
          animOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={tryClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        className={`category-verdict-drawer testing-proof-drawer fixed inset-y-0 right-0 z-[56] flex w-full max-w-[680px] flex-col border-l border-slate-200 bg-white shadow-2xl outline-none transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900 md:max-w-[min(680px,100vw)] max-md:inset-0 max-md:max-w-none ${
          animOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-verdict-drawer-title"
      >
        {/* Fixed header */}
        <div className="category-verdict-drawer__header shrink-0 border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="category-verdict-drawer-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {categoryName} verdict
                {aiAssisted && (
                  <span className="ml-2 text-xs font-normal text-pink-600">AI-assisted</span>
                )}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {productName ?? 'Product'}
                {testRunLabel ? ` · ${testRunLabel}` : ''}
                {positionLabel ? ` · ${positionLabel}` : ''}
              </p>
            </div>
            <DrawerCloseButton onClick={tryClose} />
          </div>
        </div>

        {/* Split body */}
        <div ref={splitBodyRef} className="category-verdict-drawer__split min-h-0 flex-1 flex flex-col">
          {/* Reference panel */}
          <section
            className="category-verdict-drawer__reference flex min-h-0 flex-col"
            style={{ flex: `0 0 ${splitPct}%` }}
          >
            <div className="category-verdict-drawer__subhead category-verdict-drawer__subhead--reference">
              <div className="min-w-0 flex-1">
                <p className="category-verdict-drawer__subhead-title">Reference</p>
                <p className="category-verdict-drawer__subhead-meta tabular-nums">{scoreSummary}</p>
              </div>
              {analysis && (analysis.loading || analysis.generating) && (
                <p className="category-verdict-drawer__status shrink-0" aria-live="polite">
                  <Icon
                    name="progress_activity"
                    className="!text-[14px] animate-spin text-slate-400"
                    aria-hidden
                  />
                  {analysis.generating ? 'Generating…' : 'Loading…'}
                </p>
              )}
            </div>
            <div className="category-verdict-drawer__scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              {showLargeTestingWarning && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                  No usable test data for this category yet. Complete testing before writing the verdict.
                  <Link to={testingHref} className="ml-1 font-medium underline">
                    View missing tests
                  </Link>
                </div>
              )}

              {showCompactTestingNotice && (
                <div className="mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-left"
                      aria-expanded={testingNoticeOpen}
                      onClick={() => setTestingNoticeOpen((v) => !v)}
                    >
                      <span>
                        {remainingForNotice} required test answer{remainingForNotice === 1 ? '' : 's'} remain.
                      </span>
                      <Icon
                        name={testingNoticeOpen ? 'expand_less' : 'expand_more'}
                        className="!text-[18px] shrink-0 text-slate-400"
                      />
                    </button>
                    <Link
                      to={testingHref}
                      className="font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
                    >
                      View missing tests
                    </Link>
                  </div>
                  {testingNoticeOpen && (
                    <p className="mt-1 text-xs text-slate-500">
                      Scores and AI suggestions may update after you finish the remaining {categoryName} tests.
                    </p>
                  )}
                </div>
              )}

              {analysis && (
                <CategoryAnalysisPanel
                  categoryName={categoryName}
                  performance={analysis.performance}
                  notes={analysis.notes}
                  loading={analysis.loading}
                  generating={analysis.generating}
                  error={analysis.error}
                  onGenerate={analysis.onGenerate}
                  onRegenerate={analysis.onRegenerate}
                  getFieldValue={getProsConsValue}
                  onInsertListField={(fieldKey, items) => {
                    if (fieldKey === 'pros' || fieldKey === 'cons') {
                      insertProsCons(fieldKey, items);
                    }
                  }}
                />
              )}
            </div>
          </section>

          {/* Resize divider */}
          <div
            className={`category-verdict-drawer__divider${draggingSplit ? ' category-verdict-drawer__divider--active' : ''}`}
            role="separator"
            aria-orientation="horizontal"
            aria-valuenow={Math.round(splitPct)}
            aria-valuemin={MIN_SPLIT_PCT}
            aria-valuemax={MAX_SPLIT_PCT}
            onMouseDown={startSplitDrag}
          >
            <span className="category-verdict-drawer__divider-grip" aria-hidden />
            <span className="category-verdict-drawer__divider-label">Drag to resize</span>
          </div>

          {/* Writing panel */}
          <section className="category-verdict-drawer__writing flex min-h-0 flex-1 flex-col">
            <div className="category-verdict-drawer__subhead category-verdict-drawer__subhead--writing">
              <div>
                <p className="category-verdict-drawer__subhead-title">Write category verdict</p>
                <p className="category-verdict-drawer__subhead-meta">
                  {progress.completedRequired} of {progress.totalRequired} fields complete
                </p>
              </div>
            </div>
            <div className="category-verdict-drawer__scroll category-verdict-drawer__scroll--writing min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2.5">
              <Field
                label="Category verdict headline"
                hint="A short phrase summarizing how the product performed in this category."
              >
                <TextInput
                  value={draft.headline ?? ''}
                  onChange={(e) => patch({ headline: e.target.value })}
                  placeholder="Large and varied character library"
                />
                {renderFieldAssist?.({
                  fieldKey: 'headline',
                  targetField: `${categoryName} category headline — short phrase, ${categoryName} only`,
                  hasText: Boolean((draft.headline ?? '').trim()),
                  currentText: draft.headline ?? '',
                  onText: (text) => patch({ headline: text }),
                })}
              </Field>

              <div className="mt-3.5">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <label htmlFor="category-verdict-body" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Verdict
                  </label>
                  <span className="text-[11px] tabular-nums text-slate-400">
                    {verdictWords} words · {verdictChars} characters
                  </span>
                </div>
                <p className="mb-1.5 text-xs text-slate-500">
                  Explain the strongest result, the main limitation, and what this means for the user in 2–4 sentences.
                </p>
                <TextArea
                  id="category-verdict-body"
                  rows={5}
                  className="min-h-[112px] text-sm leading-relaxed"
                  value={draft.verdict ?? ''}
                  onChange={(e) => patch({ verdict: e.target.value })}
                  placeholder={`How does this product perform on ${categoryName}?`}
                />
                {renderFieldAssist?.({
                  fieldKey: 'verdict',
                  targetField: `${categoryName} category verdict — 2–4 sentences about ${categoryName} only, not other categories`,
                  hasText: Boolean((draft.verdict ?? '').trim()),
                  currentText: draft.verdict ?? '',
                  onText: (text) => patch({ verdict: text }),
                })}
              </div>

              <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                <Field label="Primary strength">
                  <TextInput
                    value={draft.mainStrength ?? ''}
                    onChange={(e) => patch({ mainStrength: e.target.value })}
                    placeholder="Best-in-class library size"
                  />
                  {renderFieldAssist?.({
                    fieldKey: 'mainStrength',
                    targetField: 'category primary strength — one concise strength for this category',
                    hasText: Boolean((draft.mainStrength ?? '').trim()),
                    currentText: draft.mainStrength ?? '',
                    onText: (text) => patch({ mainStrength: text }),
                  })}
                </Field>
                <Field label="Primary limitation">
                  <TextInput
                    value={draft.mainWeakness ?? ''}
                    onChange={(e) => patch({ mainWeakness: e.target.value })}
                    placeholder="Limited male character options"
                  />
                  {renderFieldAssist?.({
                    fieldKey: 'mainWeakness',
                    targetField: 'category primary limitation — one concise limitation for this category',
                    hasText: Boolean((draft.mainWeakness ?? '').trim()),
                    currentText: draft.mainWeakness ?? '',
                    onText: (text) => patch({ mainWeakness: text }),
                  })}
                </Field>
              </div>

              <div className="mt-3.5">
                <CategoryProsConsEditor
                  pros={draft.pros ?? []}
                  cons={draft.cons ?? []}
                  onProsChange={(items) => patch({ pros: items })}
                  onConsChange={(items) => patch({ cons: items })}
                  renderProsAssist={() =>
                    renderFieldAssist?.({
                      fieldKey: 'pros',
                      targetField: `${categoryName} category pros — max 5 words per line, one per line, ${categoryName} only`,
                      hasText: Boolean(draft.pros?.some((p) => p.trim())),
                      currentText: (draft.pros ?? []).join('\n'),
                      list: true,
                      onItems: (items) => patch(patchCategoryProsOrCons('pros', items)),
                    })
                  }
                  renderConsAssist={() =>
                    renderFieldAssist?.({
                      fieldKey: 'cons',
                      targetField: `${categoryName} category cons — max 5 words per line, one per line, ${categoryName} only`,
                      hasText: Boolean(draft.cons?.some((c) => c.trim())),
                      currentText: (draft.cons ?? []).join('\n'),
                      list: true,
                      onItems: (items) => patch(patchCategoryProsOrCons('cons', items)),
                    })
                  }
                />
              </div>

              {missingSummaryItems.length > 0 ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Still needed</p>
                  <ul className="mt-1 space-y-0.5">
                    {missingSummaryItems.map((label) => (
                      <li key={label} className="text-xs text-slate-600 dark:text-slate-400">
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-xs font-medium text-green-700 dark:text-green-400">
                  All required fields are complete.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Fixed footer */}
        <div className="category-verdict-drawer__footer shrink-0 border-t border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="!py-1.5 !text-xs"
              disabled={!prevSlug}
              onClick={() => prevSlug && navigateTo(prevSlug)}
            >
              Previous category
            </Button>
            <span className="text-[11px] text-slate-400">
              {saving
                ? 'Saving…'
                : dirty
                  ? 'Unsaved changes'
                  : lastSavedAt
                    ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
                    : progress.status === 'complete'
                      ? 'Complete'
                      : progress.statusLabel}
            </span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              <Button
                variant="secondary"
                className="!py-1.5 !text-xs"
                disabled={saving || !dirty}
                onClick={() => void saveDraft()}
              >
                Save draft
              </Button>
              <Button className="!py-1.5 !text-xs" disabled={saving} onClick={() => void saveAndContinue()}>
                {saving ? 'Saving…' : 'Save and continue →'}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
