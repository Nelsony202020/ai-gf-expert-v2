import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DRAWER_UNMOUNT_MS } from '../../../../lib/drawer/animate';
import { Button, DrawerCloseButton, Field, Icon, TextArea, TextInput } from '../../ui';
import { CategoryEvidenceList } from './CategoryEvidencePicker';
import { CategoryProsConsEditor } from './CategoryProsConsEditor';
import { deriveCategoryKeyFindings } from './categoryVerdictKeyFindings';
import {
  CATEGORY_MISSING_SUMMARY_LABELS,
  CATEGORY_REQUIRED_FIELDS,
  categoryHeaderStatusLabel,
  computeCategoryVerdictProgress,
  patchCategoryProsOrCons,
  sanitizeCategoryVerdictDraft,
} from './categoryVerdictProgress';
import type { CategoryVerdict } from './types';
import { useCategoryEvidence } from './useCategoryEvidence';
import '../../testing/testing-ui.css';

const EMPTY: CategoryVerdict = {};

function wordCount(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
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
  testingHref,
  onClose,
  onSave,
  onOpenNotes,
  notesOpen = false,
  notesPanel,
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
  /** Global remaining required tests (legacy). */
  remainingRequiredTests: number | null;
  /** Remaining required tests for this category only. */
  categoryRemainingTests: number | null;
  isPreview: boolean;
  aiAssisted?: boolean;
  testRunId?: string;
  testingHref: string;
  onClose: () => void;
  onSave: (slug: string, draft: CategoryVerdict) => Promise<boolean>;
  onOpenNotes: () => void;
  notesOpen?: boolean;
  notesPanel?: ReactNode;
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
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [testingNoticeOpen, setTestingNoticeOpen] = useState(false);
  const savedRef = useRef(JSON.stringify(saved ?? EMPTY));
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusSlug = useRef(slug);

  const { loading: evidenceLoading, entries: evidenceEntries } = useCategoryEvidence(
    testRunId,
    categoryId,
    Boolean(slug),
  );

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

  const keyFindings = useMemo(
    () =>
      deriveCategoryKeyFindings({
        categoryName,
        score,
        evidence: evidenceEntries,
      }),
    [categoryName, score, evidenceEntries],
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

  function patch(p: Partial<CategoryVerdict>) {
    setDraft((prev) => ({ ...prev, ...p }));
    setDirty(true);
  }

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
  const headerStatus = categoryHeaderStatusLabel(progress.status);
  const showLargeTestingWarning = progress.status === 'missing_test_data';
  const showCompactTestingNotice =
    !showLargeTestingWarning && remainingForNotice != null && remainingForNotice > 0;

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
        className={`testing-proof-drawer fixed inset-y-0 right-0 z-[56] flex w-full max-w-[680px] flex-col border-l border-slate-200 bg-white shadow-2xl outline-none transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900 md:max-w-[min(680px,100vw)] max-md:inset-0 max-md:max-w-none ${
          animOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-verdict-drawer-title"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
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
                {score != null ? (
                  <>
                    Score {score.toFixed(1)}
                    {isPreview ? ' · preview' : ''}
                  </>
                ) : (
                  'No score yet'
                )}
                {positionLabel ? ` · ${positionLabel}` : ''}
                {' · '}
                {headerStatus}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {progress.completedRequired} of {progress.totalRequired} required fields complete
              </p>
            </div>
            <DrawerCloseButton onClick={tryClose} />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              disabled={!prevSlug}
              onClick={() => prevSlug && navigateTo(prevSlug)}
            >
              <Icon name="chevron_left" className="!text-[16px]" /> Previous
            </Button>
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              disabled={!nextSlug}
              onClick={() => nextSlug && navigateTo(nextSlug)}
            >
              Next <Icon name="chevron_right" className="!text-[16px]" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-4 dark:bg-slate-900">
          {/* Testing notice */}
          {showLargeTestingWarning && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              No usable test data for this category yet. Complete testing before writing the verdict.
              <Link to={testingHref} className="ml-1 font-medium underline">
                View missing tests
              </Link>
            </div>
          )}

          {showCompactTestingNotice && (
            <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-left"
                  aria-expanded={testingNoticeOpen}
                  onClick={() => setTestingNoticeOpen((v) => !v)}
                >
                  <span>
                    {remainingForNotice} required test answer{remainingForNotice === 1 ? '' : 's'} remain.
                    Suggestions may change.
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
                <p className="mt-1.5 text-xs text-slate-500">
                  Scores and AI suggestions may update after you finish the remaining {categoryName} tests.
                </p>
              )}
            </div>
          )}

          {/* Key findings */}
          <section className="mb-5 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Key findings</h3>
              {keyFindings.hasEvidence && evidenceEntries.some((e) => e.complete) && (
                <button
                  type="button"
                  className="text-xs font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
                  onClick={() => setShowAllEvidence((v) => !v)}
                >
                  {showAllEvidence ? 'Hide evidence' : 'View all evidence'}
                </button>
              )}
            </div>
            {evidenceLoading ? (
              <p className="mt-2 text-xs text-slate-400">Loading test results…</p>
            ) : keyFindings.findings.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {keyFindings.findings.map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400" aria-hidden>
                      •
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No completed {categoryName} evidence yet.</p>
            )}
            {showAllEvidence && <CategoryEvidenceList entries={evidenceEntries} />}
          </section>

          {/* AI action */}
          <div className="mb-5 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Button
              variant="secondary"
              className="w-full justify-center !py-2 text-sm sm:w-auto"
              onClick={onOpenNotes}
            >
              <Icon name="sticky_note_2" className="!text-[16px]" />
              {notesOpen ? 'Hide AI notes & suggestions' : 'AI notes & suggestions'}
            </Button>
            {notesOpen && notesPanel && <div className="mt-3">{notesPanel}</div>}
          </div>

          {/* Headline */}
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

          {/* Verdict — primary writing field */}
          <div className="mt-6">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="category-verdict-body" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Verdict
              </label>
              <span className="text-[11px] tabular-nums text-slate-400">
                {verdictWords} words · {verdictChars} characters
              </span>
            </div>
            <p className="mb-2 text-xs text-slate-500">
              Explain the strongest result, the main limitation, and what this means for the user in 2–4 sentences.
            </p>
            <TextArea
              id="category-verdict-body"
              rows={8}
              className="min-h-[180px] text-base leading-relaxed"
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

          {/* Strength / limitation */}
          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 dark:border-slate-800">
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

          {/* Pros and cons */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
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

          {/* Missing / ready summary */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            {missingSummaryItems.length > 0 ? (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Missing to complete</h3>
                <ul className="mt-2 space-y-1">
                  {missingSummaryItems.map((label) => (
                    <li key={label} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span aria-hidden>•</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                  Ready to complete
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  All required category verdict fields are filled in.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              {saving
                ? 'Saving…'
                : dirty
                  ? 'Unsaved changes'
                  : lastSavedAt
                    ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
                    : progress.status === 'complete'
                      ? 'Complete'
                      : headerStatus}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="!py-2 text-sm"
              disabled={!prevSlug}
              onClick={() => prevSlug && navigateTo(prevSlug)}
            >
              Previous category
            </Button>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="!py-2 text-sm"
                disabled={saving || !dirty}
                onClick={() => void saveDraft()}
              >
                Save draft
              </Button>
              <Button className="!py-2 text-sm" disabled={saving} onClick={() => void saveAndContinue()}>
                {saving ? 'Saving…' : 'Save and continue →'}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
