// Verdict tab: structured editorial workspace mirroring the public "Our
// Verdict" section — overall summary, decision lists, pros/cons, expert
// opinion, optional award, and per-category verdicts. Stored on the product
// record; scores always come from published test runs, never from here.

import { useState } from 'react';
import { ProductFormSection } from '../../ProductFormSection';
import { Field, Icon, Select, StringListEditor, TextArea, TextInput } from '../../ui';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';

interface CategoryVerdict {
  headline?: string;
  verdict?: string;
  mainStrength?: string;
  mainWeakness?: string;
  pros?: string[];
  cons?: string[];
  expertOpinion?: string;
  evidenceRefs?: string[];
}

interface Award {
  kind: string;
  customLabel?: string;
  active?: boolean;
  startAt?: number;
  endAt?: number;
  reason?: string;
}

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

/** Split legacy newline/sentence text into list items. */
function splitLegacy(text: unknown): string[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  return text
    .split('\n')
    .map((s) => s.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean);
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
  const { fields, set, related } = ws;
  const [openCat, setOpenCat] = useState<string | null>(null);

  const categoryVerdicts = (fields.categoryVerdicts ?? {}) as Record<string, CategoryVerdict>;

  // Structured lists with safe fallback from the legacy newline fields —
  // editing writes the structured field; legacy values are never deleted here.
  const bestFor: string[] = Array.isArray(fields.bestFor)
    ? fields.bestFor
    : splitLegacy(fields.recommendedFor);
  const bestForIsLegacy = !Array.isArray(fields.bestFor) && bestFor.length > 0;
  const notIdealFor: string[] = Array.isArray(fields.notIdealFor)
    ? fields.notIdealFor
    : splitLegacy(fields.notRecommendedFor);
  const notIdealIsLegacy = !Array.isArray(fields.notIdealFor) && notIdealFor.length > 0;

  const award: Award = (fields.award as Award | undefined) ??
    (fields.bestForLabel
      ? { kind: 'custom', customLabel: String(fields.bestForLabel), active: true }
      : { kind: 'none' });
  const awardIsLegacy = !fields.award && Boolean(fields.bestForLabel);

  function setAward(patch: Partial<Award>) {
    set('award', { ...award, ...patch });
  }

  function setCategoryVerdict(slug: string, patch: Partial<CategoryVerdict>) {
    set('categoryVerdicts', {
      ...categoryVerdicts,
      [slug]: { ...categoryVerdicts[slug], ...patch },
    });
  }

  function verdictFilledCount(v: CategoryVerdict | undefined): number {
    if (!v) return 0;
    let n = 0;
    if (v.headline?.trim()) n++;
    if (v.verdict?.trim()) n++;
    if (v.mainStrength?.trim()) n++;
    if (v.mainWeakness?.trim()) n++;
    if (v.pros?.length) n++;
    if (v.cons?.length) n++;
    if (v.expertOpinion?.trim()) n++;
    return n;
  }

  const publishedScores = (() => {
    const live = related.scoreHistory.find((h) => h.isCurrentPublished);
    return live ? new Map(live.categories.map((c) => [c.slug, c.value])) : null;
  })();

  const pros: string[] = Array.isArray(fields.pros) ? fields.pros : [];
  const cons: string[] = Array.isArray(fields.cons) ? fields.cons : [];
  const expertWords = wordCount(String(fields.expertOpinion ?? ''));
  const catsComplete = related.categories.filter(
    (c) => verdictFilledCount(categoryVerdicts[String(c.slug)]) >= 2,
  ).length;

  const completionRows: { label: string; value: string; ok: boolean }[] = [
    {
      label: 'Overall summary',
      value:
        fields.oneLineVerdict?.trim() && fields.ourTake?.trim() ? 'Complete' : 'Missing fields',
      ok: Boolean(fields.oneLineVerdict?.trim() && fields.ourTake?.trim()),
    },
    {
      label: 'Decision summary',
      value: `${bestFor.length} best for · ${notIdealFor.length} not ideal`,
      ok: bestFor.length > 0,
    },
    {
      label: 'Pros and cons',
      value: `${pros.length} pros · ${cons.length} cons`,
      ok: pros.length > 0 && cons.length > 0,
    },
    {
      label: 'Expert opinion',
      value: expertWords > 0 ? `${expertWords} words` : 'Missing',
      ok: expertWords > 0,
    },
    {
      label: 'Award',
      value: award.kind === 'none' ? 'Optional' : AWARD_OPTIONS.find((o) => o.value === award.kind)?.label ?? 'Set',
      ok: true,
    },
    {
      label: 'Category verdicts',
      value: `${catsComplete} of ${related.categories.length} complete`,
      ok: catsComplete === related.categories.length && related.categories.length > 0,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_250px]">
      <div className="space-y-4">
        {/* Verdict completion summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Verdict completion
          </h3>
          <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {completionRows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-2">
                <span className="text-slate-500">{row.label}</span>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    row.ok ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {row.ok && <Icon name="check_circle" className="!text-[13px]" />}
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          {/* 1. Overall summary */}
          <ProductFormSection num={1} title="Overall summary">
            <div className="space-y-3">
              <Field
                label="Verdict headline"
                required
                hint="Short label shown beside the overall score on the public review, e.g. “Top-tier companion platform”."
              >
                <TextInput
                  value={fields.oneLineVerdict ?? ''}
                  onChange={(e) => set('oneLineVerdict', e.target.value)}
                  placeholder="Top-tier companion platform"
                />
                <CharCount value={String(fields.oneLineVerdict ?? '')} ideal="30–70" />
              </Field>
              <Field
                label="Overall verdict"
                required
                hint="The main paragraph of the public “Our Verdict” section. Summarize the strongest areas, who it suits, and the most important limitations in 3–5 sentences."
              >
                <TextArea
                  rows={5}
                  value={fields.ourTake ?? ''}
                  onChange={(e) => set('ourTake', e.target.value)}
                />
                <p className="mt-1 text-right text-[11px] text-slate-400">
                  {wordCount(String(fields.ourTake ?? ''))} words ·{' '}
                  {String(fields.ourTake ?? '').length} characters
                </p>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Primary strength"
                  hint="Concise phrase, not a full sentence — e.g. “Highly realistic conversations”."
                >
                  <TextInput
                    value={fields.mainStrength ?? ''}
                    onChange={(e) => set('mainStrength', e.target.value)}
                    placeholder="Highly realistic conversations"
                  />
                  <CharCount value={String(fields.mainStrength ?? '')} ideal="under 60" />
                </Field>
                <Field
                  label="Primary limitation"
                  hint="Concise phrase — e.g. “Slow image generation”."
                >
                  <TextInput
                    value={fields.mainLimitation ?? ''}
                    onChange={(e) => set('mainLimitation', e.target.value)}
                    placeholder="Slow image generation"
                  />
                  <CharCount value={String(fields.mainLimitation ?? '')} ideal="under 60" />
                </Field>
                <Field
                  label="Short directory description"
                  hint="Brief description shown in listings and previews."
                >
                  <TextArea
                    rows={3}
                    value={fields.directoryDescription ?? ''}
                    onChange={(e) => set('directoryDescription', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </ProductFormSection>

          {/* 2. Decision summary */}
          <ProductFormSection num={2} title="Decision summary" divider>
            <p className="mb-3 text-xs text-slate-500">
              Rendered as separate rows in the public “Best for / Not ideal for” lists.
            </p>
            {(bestForIsLegacy || notIdealIsLegacy) && (
              <p className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                These items were imported from the old free-text fields. Saving stores them as a
                structured list; the original text is preserved.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">Best for</p>
                <StringListEditor
                  value={bestFor}
                  onChange={(items) => set('bestFor', items)}
                  addLabel="Add “Best for” item"
                  placeholder="Users who want deep, realistic conversations"
                  emptyHint="Who should choose this product? Aim for 3–4 short items."
                  maxRecommended={4}
                  maxItemLength={90}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">Not ideal for</p>
                <StringListEditor
                  value={notIdealFor}
                  onChange={(items) => set('notIdealFor', items)}
                  addLabel="Add “Not ideal for” item"
                  placeholder="Users who need instant image generation"
                  emptyHint="Who should look elsewhere? Aim for 2–4 short items."
                  maxRecommended={4}
                  maxItemLength={90}
                />
              </div>
            </div>
          </ProductFormSection>

          {/* 3. Pros and cons */}
          <ProductFormSection num={3} title="Pros and cons" divider>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">Pros</p>
                <StringListEditor
                  value={pros}
                  onChange={(items) => set('pros', items)}
                  addLabel="Add pro"
                  placeholder="Fantastic character variety with 2,450+ presets"
                  emptyHint="What genuinely stood out in testing?"
                  maxItemLength={120}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">Cons</p>
                <StringListEditor
                  value={cons}
                  onChange={(items) => set('cons', items)}
                  addLabel="Add con"
                  placeholder="Image generation is slower than competing platforms"
                  emptyHint="What are the honest drawbacks?"
                  maxItemLength={120}
                />
              </div>
            </div>
          </ProductFormSection>

          {/* 4. Expert opinion */}
          <ProductFormSection num={4} title="Expert opinion" divider>
            <Field
              label="Expert opinion"
              hint="Write a first-person conclusion based on hands-on testing: what stood out, who you would recommend it to, and whether you would keep using it. Shown as the expert card with the author byline."
            >
              <TextArea
                rows={5}
                value={fields.expertOpinion ?? ''}
                onChange={(e) => set('expertOpinion', e.target.value)}
                placeholder="After three weeks of daily testing, what stood out most was…"
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">
                {expertWords} words · recommended 100–250
                {expertWords > 0 && expertWords < 100 ? ' · a bit short' : ''}
                {expertWords > 250 ? ' · consider trimming' : ''}
              </p>
            </Field>
            {!related.review?.author && (
              <p className="mt-1 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                No review author is set — the public expert card needs an author byline (Review tab
                → author).
              </p>
            )}
          </ProductFormSection>

          {/* 5. Optional award */}
          <ProductFormSection num={5} title="Award (optional)" divider>
            <p className="mb-3 text-xs text-slate-500">
              Awards are never required. Only set one when this product genuinely earns it.
            </p>
            {awardIsLegacy && (
              <p className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                Imported from the old free-text award label — saving stores it as a structured
                award.
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
                  <Field label="Internal reason" hint="Why this product earned the award (internal only).">
                    <TextInput
                      value={award.reason ?? ''}
                      onChange={(e) => setAward({ reason: e.target.value })}
                    />
                  </Field>
                  <Field label="Start date (optional)">
                    <TextInput
                      type="date"
                      value={award.startAt ? new Date(award.startAt).toISOString().slice(0, 10) : ''}
                      onChange={(e) =>
                        setAward({ startAt: e.target.value ? new Date(e.target.value).getTime() : undefined })
                      }
                    />
                  </Field>
                  <Field label="Expiration date (optional)">
                    <TextInput
                      type="date"
                      value={award.endAt ? new Date(award.endAt).toISOString().slice(0, 10) : ''}
                      onChange={(e) =>
                        setAward({ endAt: e.target.value ? new Date(e.target.value).getTime() : undefined })
                      }
                    />
                  </Field>
                </>
              )}
            </div>
            {award.startAt && award.endAt && award.endAt <= award.startAt && (
              <p className="mt-2 text-xs text-red-600">
                The expiration date must be after the start date.
              </p>
            )}
          </ProductFormSection>

          {/* 6. Category verdicts */}
          <ProductFormSection num={6} title="Category verdicts" divider>
            <p className="mb-3 text-xs text-slate-500">
              Structured editorial copy for each rating category — shown in the category verdict
              areas of the public review page. Scores themselves come from the published test run.
            </p>
            <div className="space-y-2">
              {related.categories.map((cat) => {
                const slug = String(cat.slug);
                const v = categoryVerdicts[slug];
                const isOpen = openCat === slug;
                const filled = verdictFilledCount(v);
                const score = publishedScores?.get(slug) ?? null;
                return (
                  <div
                    key={cat.id}
                    className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenCat(isOpen ? null : slug)}
                      className="flex w-full items-center gap-2 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                    >
                      <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </span>
                      {score !== null && (
                        <span className="text-xs text-slate-500">Score {score}</span>
                      )}
                      {filled >= 2 ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                          <Icon name="check_circle" className="!text-[14px]" /> {filled} of 7 fields
                        </span>
                      ) : filled > 0 ? (
                        <span className="text-xs text-amber-700 dark:text-amber-400">
                          {7 - filled} fields missing
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">empty</span>
                      )}
                      <Icon
                        name="expand_more"
                        className={`!text-[18px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="space-y-3 border-t border-slate-100 p-3 dark:border-slate-800">
                        <Field
                          label="Category verdict headline"
                          hint="Short phrase summarizing the category, e.g. “Large and varied character library”."
                        >
                          <TextInput
                            value={v?.headline ?? ''}
                            onChange={(e) => setCategoryVerdict(slug, { headline: e.target.value })}
                            placeholder="Large and varied character library"
                          />
                        </Field>
                        <Field
                          label="Category verdict paragraph"
                          hint="Explain the strongest result, important limitations, and what this means for the user."
                        >
                          <TextArea
                            rows={3}
                            value={v?.verdict ?? ''}
                            onChange={(e) => setCategoryVerdict(slug, { verdict: e.target.value })}
                            placeholder={`How does ${fields.name || 'this product'} perform on ${cat.name}?`}
                          />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Primary category strength">
                            <TextInput
                              value={v?.mainStrength ?? ''}
                              onChange={(e) => setCategoryVerdict(slug, { mainStrength: e.target.value })}
                            />
                          </Field>
                          <Field label="Primary category limitation">
                            <TextInput
                              value={v?.mainWeakness ?? ''}
                              onChange={(e) => setCategoryVerdict(slug, { mainWeakness: e.target.value })}
                            />
                          </Field>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                              Category pros
                            </p>
                            <StringListEditor
                              value={v?.pros}
                              onChange={(items) => setCategoryVerdict(slug, { pros: items })}
                              addLabel="Add pro"
                              maxItemLength={120}
                            />
                          </div>
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                              Category cons
                            </p>
                            <StringListEditor
                              value={v?.cons}
                              onChange={(items) => setCategoryVerdict(slug, { cons: items })}
                              addLabel="Add con"
                              maxItemLength={120}
                            />
                          </div>
                        </div>
                        <Field
                          label="Expert note"
                          hint="Optional short first-person observation for this category."
                        >
                          <TextArea
                            rows={2}
                            value={v?.expertOpinion ?? ''}
                            onChange={(e) => setCategoryVerdict(slug, { expertOpinion: e.target.value })}
                          />
                        </Field>
                        <Field
                          label="Linked evidence references (optional)"
                          hint="Comma-separated evidence slugs to cite under this verdict, e.g. reply-speed, long-term-memory-test."
                        >
                          <TextInput
                            value={(v?.evidenceRefs ?? []).join(', ')}
                            onChange={(e) =>
                              setCategoryVerdict(slug, {
                                evidenceRefs: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="e.g. reply-speed, long-term-memory-test"
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                );
              })}
              {related.categories.length === 0 && (
                <p className="text-sm text-slate-400">
                  No active rating categories found — configure them under Testing → Categories.
                </p>
              )}
            </div>
          </ProductFormSection>
        </div>
      </div>

      <CompletionSidebar />
    </div>
  );
}
