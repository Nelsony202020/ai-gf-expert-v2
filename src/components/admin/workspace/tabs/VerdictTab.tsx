// Verdict tab: guided 5-step editorial workspace mirroring the public "Our
// Verdict" section. Scores always come from test runs, never from here.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { AiNotesDrawer } from '../../ai-verdict/AiNotesDrawer';
import { AiNotesSectionButton } from '../../ai-verdict/AiNotesSectionButton';
import { AiFieldAssist } from '../../ai-verdict/AiFieldAssist';
import { useAiVerdictNotes } from '../../ai-verdict/useAiVerdictNotes';
import {
  categorySectionKey,
  normalizeListField,
  sectionConfig,
  verdictStepSectionKey,
} from '../../../../lib/ai-verdict/notesSchema';
import { Field, Select, StringListEditor, TextArea, TextInput } from '../../ui';
import { useToast } from '../../Toast';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';
import { CategoryVerdictDrawer } from '../verdict/CategoryVerdictDrawer';
import { CategoryVerdictOverview } from '../verdict/CategoryVerdictOverview';
import { VerdictProgressHeader } from '../verdict/VerdictProgressHeader';
import { VerdictStepFooter } from '../verdict/VerdictStepFooter';
import { VerdictStepNav } from '../verdict/VerdictStepNav';
import { VerdictTestingSummary } from '../verdict/VerdictTestingSummary';
import type { Award, CategoryVerdict, VerdictStepId } from '../verdict/types';
import {
  computeVerdictProgress,
  VERDICT_STEPS,
} from '../verdict/verdictSteps';
import { sanitizeCategoryVerdictDraft } from '../verdict/categoryVerdictProgress';
import { useVerdictTestingSummary, countCategoryRemainingRequired } from '../verdict/useVerdictTestingSummary';
import { workspaceTabPath } from '../completion';

const AWARD_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'No award' },
  { value: 'best_overall', label: 'Best Overall' },
  { value: 'best_chat', label: 'Best for Chat' },
  { value: 'best_images', label: 'Best for Images' },
  { value: 'best_video', label: 'Best for Video' },
  { value: 'best_roleplay', label: 'Best for Roleplay' },
  { value: 'best_voice', label: 'Best for Voice' },
  { value: 'best_memory', label: 'Best for Memory' },
  { value: 'best_value', label: 'Best Value' },
  { value: 'best_free', label: 'Best Free Option' },
  { value: 'custom', label: 'Custom award' },
];

function splitLegacy(text: unknown): string[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  return text
    .split('\n')
    .map((s) => s.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean);
}

/** Raw list for editors — preserves in-progress empty rows and trailing spaces while typing. */
function editorListField(value: unknown, legacy?: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item ?? ''));
  if (legacy != null) return splitLegacy(legacy);
  return [];
}

function wordCount(text: string): number {
  const t = text.trim();
  return t === '' ? 0 : t.split(/\s+/).length;
}

function CharCount({ value, ideal }: { value: string; ideal?: string }) {
  return (
    <p className="mt-1 text-right text-[11px] text-slate-400">
      {value.length} characters{ideal ? ` · recommended ${ideal}` : ''}
    </p>
  );
}

export function VerdictTab() {
  const ws = useWorkspace();
  const toast = useToast();
  const { fields, set, setMany, related, productId, saving } = ws;
  const [activeStep, setActiveStep] = useState<VerdictStepId>('overall');
  const [categoryDrawerSlug, setCategoryDrawerSlug] = useState<string | null>(null);
  const [categoryNotesOpen, setCategoryNotesOpen] = useState(false);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [notesSectionKey, setNotesSectionKey] = useState<string | null>(null);
  const [aiAssistedFields, setAiAssistedFields] = useState<Set<string>>(new Set());

  const testing = useVerdictTestingSummary(related.testRuns);
  const aiNotes = useAiVerdictNotes(productId, testing.currentRun?.id);

  const categoryVerdicts = (fields.categoryVerdicts ?? {}) as Record<string, CategoryVerdict>;

  const bestForEditor = editorListField(
    fields.bestFor,
    !Array.isArray(fields.bestFor) ? fields.recommendedFor : undefined,
  );
  const bestFor = useMemo(() => normalizeListField(bestForEditor), [bestForEditor]);
  const bestForIsLegacy = !Array.isArray(fields.bestFor) && bestFor.length > 0;
  const notIdealEditor = editorListField(
    fields.notIdealFor,
    !Array.isArray(fields.notIdealFor) ? fields.notRecommendedFor : undefined,
  );
  const notIdealFor = useMemo(() => normalizeListField(notIdealEditor), [notIdealEditor]);
  const notIdealIsLegacy = !Array.isArray(fields.notIdealFor) && notIdealFor.length > 0;

  const award: Award = (fields.award as Award | undefined) ??
    (fields.bestForLabel
      ? { kind: 'custom', customLabel: String(fields.bestForLabel), active: true }
      : { kind: 'none' });
  const awardIsLegacy = !fields.award && Boolean(fields.bestForLabel);

  const prosEditor = editorListField(fields.pros);
  const consEditor = editorListField(fields.cons);
  const pros = useMemo(() => normalizeListField(prosEditor), [prosEditor]);
  const cons = useMemo(() => normalizeListField(consEditor), [consEditor]);
  const expertWords = wordCount(String(fields.expertOpinion ?? ''));

  const categorySlugs = useMemo(
    () => related.categories.map((c) => String(c.slug)),
    [related.categories],
  );

  const progress = useMemo(
    () =>
      computeVerdictProgress({
        oneLineVerdict: String(fields.oneLineVerdict ?? ''),
        ourTake: String(fields.ourTake ?? ''),
        bestFor,
        notIdealFor,
        pros,
        cons,
        expertOpinion: String(fields.expertOpinion ?? ''),
        categoryVerdicts,
        categorySlugs,
      }),
    [
      fields.oneLineVerdict,
      fields.ourTake,
      fields.expertOpinion,
      bestFor,
      notIdealFor,
      pros,
      cons,
      categoryVerdicts,
      categorySlugs,
    ],
  );

  useEffect(() => {
    if (progress.nextIncomplete) setActiveStep(progress.nextIncomplete);
    // Only on first mount — intentional single run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publishedScores = useMemo(() => {
    const live = related.scoreHistory.find((h) => h.isCurrentPublished);
    return live ? new Map(live.categories.map((c) => [c.slug, c.value])) : null;
  }, [related.scoreHistory]);

  const categoryScores = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const cat of related.categories) {
      const slug = String(cat.slug);
      const preview = testing.categoryScores.get(slug);
      map.set(slug, preview ?? publishedScores?.get(slug) ?? null);
    }
    return map;
  }, [related.categories, testing.categoryScores, publishedScores]);

  const drawerCategory = categoryDrawerSlug
    ? related.categories.find((c) => String(c.slug) === categoryDrawerSlug)
    : undefined;

  const categoryRemainingTests = useMemo(() => {
    if (!categoryDrawerSlug || !testing.tree) return null;
    return countCategoryRemainingRequired(testing.tree, categoryDrawerSlug);
  }, [categoryDrawerSlug, testing.tree]);

  function setAward(patch: Partial<Award>) {
    set('award', { ...award, ...patch });
  }

  function setCategoryVerdict(slug: string, patch: Partial<CategoryVerdict>) {
    set('categoryVerdicts', {
      ...categoryVerdicts,
      [slug]: { ...categoryVerdicts[slug], ...patch },
    });
  }

  function markAiAssisted(keys: string[]) {
    setAiAssistedFields((prev) => new Set([...prev, ...keys]));
  }

  function AiAssistBadge({ fieldKey }: { fieldKey: string }) {
    if (!aiAssistedFields.has(fieldKey)) return null;
    return (
      <span className="ml-1.5 rounded bg-pink-100 px-1.5 py-0.5 text-[10px] font-medium text-pink-700 dark:bg-pink-950/40 dark:text-pink-300">
        AI-assisted
      </span>
    );
  }

  const testRunId = testing.currentRun?.id;

  useEffect(() => {
    setCategoryNotesOpen(false);
  }, [categoryDrawerSlug]);

  function currentNotesSectionKey(): string {
    if (categoryDrawerSlug) return categorySectionKey(categoryDrawerSlug);
    return verdictStepSectionKey(activeStep);
  }

  function notesContextForSection() {
    const key = currentNotesSectionKey();
    return aiNotes.sectionKey === key ? aiNotes.notes?.keyFindings : undefined;
  }

  function renderAssist(opts: {
    fieldKey: string;
    targetField: string;
    categorySlug?: string;
    hasText: boolean;
    list?: boolean;
    currentText?: string;
    onText?: (text: string) => void;
    onItems?: (items: string[]) => void;
  }) {
    if (!testRunId) return null;
    return (
      <AiFieldAssist
        productId={productId}
        testRunId={testRunId}
        targetField={opts.targetField}
        categorySlug={opts.categorySlug}
        currentText={opts.currentText}
        notesContext={notesContextForSection()}
        hasText={opts.hasText}
        list={opts.list}
        onText={(t) => {
          opts.onText?.(t);
          markAiAssisted([opts.fieldKey]);
        }}
        onItems={(items) => {
          opts.onItems?.(items);
          markAiAssisted([opts.fieldKey]);
        }}
      />
    );
  }

  const openNotesDrawer = useCallback(
    async (sectionKey: string) => {
      if (!testing.currentRun) {
        toast.warning('No test run', { message: 'Start a test run on the Testing tab first.' });
        return;
      }
      setNotesSectionKey(sectionKey);
      setNotesDrawerOpen(true);
      await aiNotes.load(sectionKey);
    },
    [aiNotes, testing.currentRun, toast],
  );

  async function handleGenerateNotes() {
    if (!notesSectionKey) return;
    await aiNotes.generate(notesSectionKey, false);
  }

  async function handleRegenerateNotes() {
    if (!notesSectionKey) return;
    await aiNotes.generate(notesSectionKey, true);
  }

  function getNotesFieldValue(fieldKey: string): string | string[] {
    if (notesSectionKey?.startsWith('category:')) {
      const slug = notesSectionKey.slice(9);
      const cv = categoryVerdicts[slug] ?? {};
      const val = (cv as Record<string, unknown>)[fieldKey];
      if (Array.isArray(val)) return val as string[];
      return String(val ?? '');
    }
    const val = (fields as Record<string, unknown>)[fieldKey];
    if (Array.isArray(val)) return val as string[];
    return String(val ?? '');
  }

  function handleNotesInsertField(fieldKey: string, value: string) {
    if (notesSectionKey?.startsWith('category:')) {
      const slug = notesSectionKey.slice(9);
      setCategoryVerdict(slug, { [fieldKey]: value });
      markAiAssisted([`categoryVerdicts.${slug}.${fieldKey}`]);
      return;
    }
    set(fieldKey, value);
    markAiAssisted([fieldKey]);
  }

  function handleNotesInsertListField(fieldKey: string, items: string[]) {
    const normalized = normalizeListField(items);
    if (notesSectionKey?.startsWith('category:')) {
      const slug = notesSectionKey.slice(9);
      setCategoryVerdict(slug, { [fieldKey]: normalized });
      markAiAssisted([`categoryVerdicts.${slug}.${fieldKey}`]);
      return;
    }
    set(fieldKey, normalized);
    markAiAssisted([fieldKey]);
  }

  async function handleSaveSection() {
    const ok = await ws.save();
    if (ok) toast.success('Section saved');
    else if (ws.saveError) toast.error(ws.saveError);
  }

  async function saveCategoryDraft(slug: string, draft: CategoryVerdict): Promise<boolean> {
    const cleaned = sanitizeCategoryVerdictDraft(draft);
    const next = {
      ...categoryVerdicts,
      [slug]: { ...categoryVerdicts[slug], ...cleaned },
    };
    flushSync(() => setMany({ categoryVerdicts: next }));
    const ok = await ws.save({ categoryVerdicts: next });
    if (ok) toast.success('Category verdict saved');
    else if (ws.saveError) toast.error(ws.saveError);
    return ok;
  }

  const openCategoryNotes = useCallback(
    async (slug: string) => {
      if (categoryNotesOpen && notesSectionKey === categorySectionKey(slug)) {
        setCategoryNotesOpen(false);
        return;
      }
      setCategoryNotesOpen(true);
      await openNotesDrawer(categorySectionKey(slug));
    },
    [categoryNotesOpen, notesSectionKey, openNotesDrawer],
  );

  const activeStepLabel = VERDICT_STEPS.find((s) => s.id === activeStep)?.label ?? '';

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-4">
        <VerdictProgressHeader
          completed={progress.completed}
          total={progress.total}
          onContinue={() => {
            if (progress.nextIncomplete) setActiveStep(progress.nextIncomplete);
          }}
        />

        <VerdictStepNav
          steps={progress.steps}
          activeStep={activeStep}
          onSelect={setActiveStep}
        />

        <VerdictTestingSummary
          previewScore={testing.previewScore}
          topCategories={testing.topCategories}
          remainingRequired={testing.remainingRequired}
          loading={testing.loading}
          calcError={testing.calcError}
          isPreview={testing.isPreview}
          runName={testing.currentRun?.name}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {activeStepLabel}
            </h2>
            <AiNotesSectionButton
              disabled={!testRunId || (activeStep === 'categories' && !categoryDrawerSlug)}
              onClick={() => void openNotesDrawer(currentNotesSectionKey())}
            />
          </div>
          {activeStep === 'categories' && !categoryDrawerSlug && testRunId && (
            <p className="mt-1 text-[11px] text-slate-500">
              Open a category below to use AI notes for that category.
            </p>
          )}
          {!testRunId && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Start a test run on the Testing tab to enable AI suggestions.
            </p>
          )}

          {activeStep === 'overall' && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500">
                Scores from {testing.isPreview ? 'current draft' : 'published'} test run
                {testing.currentRun ? `: ${testing.currentRun.name}` : ' (none yet)'}.
              </p>
              <Field
                label={
                  <span>
                    Verdict headline
                    <AiAssistBadge fieldKey="oneLineVerdict" />
                  </span>
                }
                required
                hint="Short label beside the overall score, e.g. “Top-tier companion platform”."
              >
                <TextInput
                  value={fields.oneLineVerdict ?? ''}
                  onChange={(e) => set('oneLineVerdict', e.target.value)}
                  placeholder="Top-tier companion platform"
                />
                <div className="flex items-center justify-between">
                  {renderAssist({
                    fieldKey: 'oneLineVerdict',
                    targetField:
                      'oneLineVerdict — a short verdict headline shown beside the overall score, 30–70 characters',
                    hasText: Boolean(String(fields.oneLineVerdict ?? '').trim()),
                    onText: (t) => set('oneLineVerdict', t),
                  })}
                  <CharCount value={String(fields.oneLineVerdict ?? '')} ideal="30–70" />
                </div>
              </Field>
              <Field
                label={
                  <span>
                    Overall verdict
                    <AiAssistBadge fieldKey="ourTake" />
                  </span>
                }
                required
                hint="Main paragraph of the public “Our Verdict” section — 3–5 sentences."
              >
                <TextArea
                  rows={5}
                  value={fields.ourTake ?? ''}
                  onChange={(e) => set('ourTake', e.target.value)}
                />
                <div className="flex items-center justify-between">
                  {renderAssist({
                    fieldKey: 'ourTake',
                    targetField:
                      'ourTake — the main overall verdict paragraph: strongest areas, who it suits, most important limitations, 3–5 sentences',
                    hasText: Boolean(String(fields.ourTake ?? '').trim()),
                    onText: (t) => set('ourTake', t),
                  })}
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {wordCount(String(fields.ourTake ?? ''))} words ·{' '}
                    {String(fields.ourTake ?? '').length} characters
                  </p>
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={
                    <span>
                      Primary strength
                      <AiAssistBadge fieldKey="mainStrength" />
                    </span>
                  }
                  hint="Concise phrase — e.g. “Highly realistic conversations”."
                >
                  <TextInput
                    value={fields.mainStrength ?? ''}
                    onChange={(e) => set('mainStrength', e.target.value)}
                    placeholder="Highly realistic conversations"
                  />
                  <div className="flex items-center justify-between">
                    {renderAssist({
                      fieldKey: 'mainStrength',
                      targetField:
                        'mainStrength — concise phrase (not a full sentence) naming the product’s single biggest strength, under 60 characters',
                      hasText: Boolean(String(fields.mainStrength ?? '').trim()),
                      onText: (t) => set('mainStrength', t),
                    })}
                    <CharCount value={String(fields.mainStrength ?? '')} ideal="under 60" />
                  </div>
                </Field>
                <Field
                  label={
                    <span>
                      Primary limitation
                      <AiAssistBadge fieldKey="mainLimitation" />
                    </span>
                  }
                  hint="Concise phrase — e.g. “Slow image generation”."
                >
                  <TextInput
                    value={fields.mainLimitation ?? ''}
                    onChange={(e) => set('mainLimitation', e.target.value)}
                    placeholder="Slow image generation"
                  />
                  <div className="flex items-center justify-between">
                    {renderAssist({
                      fieldKey: 'mainLimitation',
                      targetField:
                        'mainLimitation — concise phrase naming the product’s single biggest limitation, under 60 characters',
                      hasText: Boolean(String(fields.mainLimitation ?? '').trim()),
                      onText: (t) => set('mainLimitation', t),
                    })}
                    <CharCount value={String(fields.mainLimitation ?? '')} ideal="under 60" />
                  </div>
                </Field>
              </div>
              <Field
                label={
                  <span>
                    Directory description
                    <AiAssistBadge fieldKey="directoryDescription" />
                  </span>
                }
                hint="Brief description shown in listings and previews."
              >
                <TextArea
                  rows={3}
                  value={fields.directoryDescription ?? ''}
                  onChange={(e) => set('directoryDescription', e.target.value)}
                />
                <div className="mt-1">
                  {renderAssist({
                    fieldKey: 'directoryDescription',
                    targetField:
                      'directoryDescription — brief 1–2 sentence description of the product for directory listings and previews',
                    hasText: Boolean(String(fields.directoryDescription ?? '').trim()),
                    onText: (t) => set('directoryDescription', t),
                  })}
                </div>
              </Field>
            </div>
          )}

          {activeStep === 'decision' && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                Rendered as separate rows in the public “Best for / Not ideal for” lists.
              </p>
              {(bestForIsLegacy || notIdealIsLegacy) && (
                <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  Imported from legacy free-text fields. Saving stores them as structured lists.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Best for
                    <AiAssistBadge fieldKey="bestFor" />
                  </p>
                  <StringListEditor
                    value={bestForEditor}
                    onChange={(items) => set('bestFor', items)}
                    addLabel="Add “Best for” item"
                    placeholder="Users who want deep, realistic conversations"
                    emptyHint="Who should choose this product? Aim for 3–4 short items."
                    maxRecommended={4}
                    maxItemLength={90}
                  />
                  <div className="mt-1">
                    {renderAssist({
                      fieldKey: 'bestFor',
                      targetField:
                        'bestFor — 3–4 short items describing who this product is best for, each under 90 characters',
                      hasText: bestFor.length > 0,
                      list: true,
                      onItems: (items) => set('bestFor', items),
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Not ideal for
                    <AiAssistBadge fieldKey="notIdealFor" />
                  </p>
                  <StringListEditor
                    value={notIdealEditor}
                    onChange={(items) => set('notIdealFor', items)}
                    emptyHint="Who should look elsewhere? Aim for 2–4 short items."
                    addLabel="Add “Not ideal for” item"
                    placeholder="Users who need instant image generation"
                    maxRecommended={4}
                    maxItemLength={90}
                  />
                  <div className="mt-1">
                    {renderAssist({
                      fieldKey: 'notIdealFor',
                      targetField:
                        'notIdealFor — 2–4 short items describing who this product is not ideal for, each under 90 characters',
                      hasText: notIdealFor.length > 0,
                      list: true,
                      onItems: (items) => set('notIdealFor', items),
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'pros-cons' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  Pros
                  <AiAssistBadge fieldKey="pros" />
                </p>
                <StringListEditor
                  value={prosEditor}
                  onChange={(items) => set('pros', items)}
                  addLabel="Add pro"
                  placeholder="Fantastic character variety with 2,450+ presets"
                  emptyHint="What genuinely stood out in testing?"
                  maxItemLength={120}
                />
                <div className="mt-1">
                  {renderAssist({
                    fieldKey: 'pros',
                    targetField:
                      'pros — 3–5 specific pros based on test results, each under 120 characters',
                    hasText: pros.length > 0,
                    list: true,
                    onItems: (items) => set('pros', items),
                  })}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  Cons
                  <AiAssistBadge fieldKey="cons" />
                </p>
                <StringListEditor
                  value={consEditor}
                  onChange={(items) => set('cons', items)}
                  addLabel="Add con"
                  placeholder="Image generation is slower than competing platforms"
                  emptyHint="What are the honest drawbacks?"
                  maxItemLength={120}
                />
                <div className="mt-1">
                  {renderAssist({
                    fieldKey: 'cons',
                    targetField:
                      'cons — 2–4 honest cons based on test results, each under 120 characters',
                    hasText: cons.length > 0,
                    list: true,
                    onItems: (items) => set('cons', items),
                  })}
                </div>
              </div>
            </div>
          )}

          {activeStep === 'expert' && (
            <div className="mt-4">
              <Field
                label={
                  <span>
                    Expert opinion
                    <AiAssistBadge fieldKey="expertOpinion" />
                  </span>
                }
                hint="First-person conclusion based on hands-on testing — shown with the author byline."
              >
                <TextArea
                  rows={6}
                  value={fields.expertOpinion ?? ''}
                  onChange={(e) => set('expertOpinion', e.target.value)}
                  placeholder="After three weeks of daily testing, what stood out most was…"
                />
                <div className="flex items-center justify-between">
                  {renderAssist({
                    fieldKey: 'expertOpinion',
                    targetField:
                      'expertOpinion — a first-person expert conclusion (100–250 words) based on hands-on testing: what stood out, who it is recommended for, and whether the tester would keep using it',
                    hasText: expertWords > 0,
                    currentText: String(fields.expertOpinion ?? ''),
                    onText: (t) => set('expertOpinion', t),
                  })}
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {expertWords} words · recommended 100–250
                    {expertWords > 0 && expertWords < 100 ? ' · a bit short' : ''}
                    {expertWords > 250 ? ' · consider trimming' : ''}
                  </p>
                </div>
              </Field>
              {!related.review?.author && (
                <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  No review author is set — the public expert card needs an author byline (Review tab
                  → author).
                </p>
              )}
            </div>
          )}

          {activeStep === 'categories' && (
            <CategoryVerdictOverview
              categories={related.categories.map((c) => ({
                slug: String(c.slug),
                name: String(c.name),
              }))}
              categoryVerdicts={categoryVerdicts}
              categoryScores={categoryScores}
              remainingRequiredTests={testing.remainingRequired}
              onOpen={(slug) => setCategoryDrawerSlug(slug)}
              onContinueNext={(slug) => setCategoryDrawerSlug(slug)}
            />
          )}

          <VerdictStepFooter
            onSuggest={() => void openNotesDrawer(currentNotesSectionKey())}
            onSave={() => void handleSaveSection()}
            saving={saving}
            suggestDisabled={!testing.currentRun || (activeStep === 'categories' && !categoryDrawerSlug)}
          />
        </div>

        {/* Optional award — excluded from step progress */}
        <details className="rounded-xl border border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
            Award (optional)
          </summary>
          <div className="space-y-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800">
            {awardIsLegacy && (
              <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                Imported from legacy award label — saving stores it as a structured award.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Award">
                <Select value={award.kind} onChange={(e) => setAward({ kind: e.target.value })}>
                  {AWARD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {award.kind === 'custom' && (
                <Field label="Custom award label" required>
                  <TextInput
                    value={award.customLabel ?? ''}
                    onChange={(e) => setAward({ customLabel: e.target.value })}
                    placeholder="Best for Long-Term Roleplay"
                  />
                </Field>
              )}
              {award.kind !== 'none' && (
                <>
                  <Field label="Active">
                    <Select
                      value={award.active === false ? 'no' : 'yes'}
                      onChange={(e) => setAward({ active: e.target.value === 'yes' })}
                    >
                      <option value="yes">Active</option>
                      <option value="no">Inactive</option>
                    </Select>
                  </Field>
                  <Field label="Internal reason">
                    <TextInput
                      value={award.reason ?? ''}
                      onChange={(e) => setAward({ reason: e.target.value })}
                    />
                  </Field>
                </>
              )}
            </div>
          </div>
        </details>
      </div>

      <CompletionSidebar />

      {categoryDrawerSlug && (
        <CategoryVerdictDrawer
          slug={categoryDrawerSlug}
          categoryName={
            String(related.categories.find((c) => String(c.slug) === categoryDrawerSlug)?.name ?? categoryDrawerSlug)
          }
          categoryId={drawerCategory?.id}
          score={categoryScores.get(categoryDrawerSlug) ?? null}
          categories={related.categories.map((c) => ({
            slug: String(c.slug),
            name: String(c.name),
          }))}
          saved={categoryVerdicts[categoryDrawerSlug]}
          saving={saving}
          remainingRequiredTests={testing.remainingRequired}
          categoryRemainingTests={categoryRemainingTests}
          isPreview={testing.isPreview}
          testRunId={testing.currentRun?.id}
          testingHref={`${workspaceTabPath(productId, 'testing')}?category=${encodeURIComponent(categoryDrawerSlug)}`}
          aiAssisted={aiAssistedFields.has(`categoryVerdicts.${categoryDrawerSlug}`)}
          onClose={() => setCategoryDrawerSlug(null)}
          onSave={saveCategoryDraft}
          onOpenNotes={() => void openCategoryNotes(categoryDrawerSlug)}
          notesOpen={categoryNotesOpen}
          notesPanel={
            categoryNotesOpen ? (
              <AiNotesDrawer
                embedded
                open
                sectionLabel={
                  String(
                    related.categories.find((c) => String(c.slug) === categoryDrawerSlug)?.name ??
                      categoryDrawerSlug,
                  )
                }
                productName={String(fields.name ?? 'Product')}
                testRunName={testing.currentRun?.name}
                notes={aiNotes.notes}
                loading={aiNotes.loading}
                generating={aiNotes.generating}
                error={aiNotes.error}
                onClose={() => setCategoryNotesOpen(false)}
                onGenerate={() => void handleGenerateNotes()}
                onRegenerate={() => void handleRegenerateNotes()}
                getFieldValue={getNotesFieldValue}
                onInsertField={handleNotesInsertField}
                onInsertListField={handleNotesInsertListField}
              />
            ) : null
          }
          renderFieldAssist={(opts) =>
            renderAssist({
              ...opts,
              categorySlug: categoryDrawerSlug,
              fieldKey: `categoryVerdicts.${categoryDrawerSlug}.${opts.fieldKey}`,
            })
          }
          onNavigate={(slug) => setCategoryDrawerSlug(slug)}
          onContinueNext={(slug) => setCategoryDrawerSlug(slug)}
        />
      )}

      <AiNotesDrawer
        open={notesDrawerOpen && !categoryDrawerSlug}
        sectionLabel={
          notesSectionKey
            ? sectionConfig(
                notesSectionKey,
                related.categories.find(
                  (c) => notesSectionKey === categorySectionKey(String(c.slug)),
                )?.name as string | undefined,
              ).label
            : 'Verdict section'
        }
        productName={String(fields.name ?? 'Product')}
        testRunName={testing.currentRun?.name}
        notes={aiNotes.notes}
        loading={aiNotes.loading}
        generating={aiNotes.generating}
        error={aiNotes.error}
        onClose={() => {
          setNotesDrawerOpen(false);
        }}
        onGenerate={() => void handleGenerateNotes()}
        onRegenerate={() => void handleRegenerateNotes()}
        getFieldValue={getNotesFieldValue}
        onInsertField={handleNotesInsertField}
        onInsertListField={handleNotesInsertListField}
      />
    </div>
  );
}
