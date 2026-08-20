import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EntityRow } from '../../../api';
import { dataApi } from '../../../api';
import {
  mergePricingPageCopy,
  parsePricingPageCopy,
  type PricingPageCopy,
  type PricingPageCopyPrivateNotes,
} from '../../../../../lib/pricing/pageCopy';
import { fmtMoney } from '../../../../../lib/pricing/calc';
import type { PricingCopyFieldId } from '../../../../../lib/ai-pricing-copy/context';
import {
  buildCompareIntro,
  buildHermanTake,
  buildMarketAutoLead,
  buildPageIntro,
  buildPlansIntro,
  buildUsageIntro,
} from '../../../../../lib/pricing-tab/sectionCopy';
import { reviewPreviewPageUrl } from '../../../../../lib/slugs';
import { setPricingPageCopyDirty } from '../../../testing/pricingLeaveGuard';
import { Button, Icon } from '../../../ui';
import { PricingSection } from './PricingSection';
import { PricingAiNotesPanel } from './PricingAiNotesPanel';
import { PricingWriteWithAi } from './PricingWriteWithAi';

type StepId = 'intro' | 'market' | 'comparison' | 'expert' | 'additional';

const STEPS: Array<{ id: StepId; eyebrow: string; short: string }> = [
  { id: 'intro', eyebrow: 'Page intro', short: 'Intro' },
  { id: 'market', eyebrow: 'Market position', short: 'Market' },
  { id: 'comparison', eyebrow: 'Market comparison', short: 'Compare' },
  { id: 'expert', eyebrow: 'Expert opinion', short: 'Opinion' },
  { id: 'additional', eyebrow: 'Additional commentary', short: 'Extra' },
];

function WritingTips({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Icon name="info" className="!text-[14px]" />
        Writing tips
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-64 rounded-md border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AlreadyAdded({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400">Already added automatically</p>
      <p className="mt-1.5 border-l-2 border-slate-200 pl-3 text-sm leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {text}
      </p>
    </div>
  );
}

function PrivateNotesToggle({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const hasNotes = Boolean(value.trim());
  const [open, setOpen] = useState(hasNotes);

  useEffect(() => {
    if (hasNotes) setOpen(true);
  }, [hasNotes]);

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50 dark:hover:text-slate-300"
        onClick={() => setOpen(true)}
      >
        <Icon name="add" className="!text-[14px]" />
        Add private notes
      </button>
    );
  }

  return (
    <div className="w-full basis-full">
      <button
        type="button"
        className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        onClick={() => setOpen(false)}
      >
        Private notes
        {hasNotes && <span className="text-slate-400">· Added</span>}
        <Icon name="expand_less" className="!text-[16px] text-slate-400" />
      </button>
      <textarea
        className="w-full rounded-md border border-dashed border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-400 dark:border-slate-700 dark:text-slate-200"
        rows={2}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rough notes while testing — never published"
      />
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  sectionHref,
  children,
}: {
  eyebrow: string;
  title: string;
  sectionHref: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {eyebrow}
          </p>
          <h4 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h4>
        </div>
        <a
          href={sectionHref}
          target="_blank"
          rel="noreferrer"
          className="mt-1 shrink-0 text-[11px] font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
        >
          View section ↗
        </a>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function YourTakeField({
  value,
  onChange,
  disabled,
  placeholder,
  rows = 3,
  tips,
  field,
  productId,
  canEdit,
  privateNoteValue,
  onPrivateNoteChange,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  tips: string[];
  field: PricingCopyFieldId;
  productId: string;
  canEdit: boolean;
  privateNoteValue: string;
  onPrivateNoteChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your take</p>
        <WritingTips items={tips} />
      </div>
      <textarea
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm outline-none focus:border-pink-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="mt-2">
        {canEdit ? (
          <PricingWriteWithAi
            productId={productId}
            field={field}
            currentText={value}
            privateNotes={privateNoteValue}
            hasText={Boolean(value.trim())}
            onReplace={onChange}
            beside={
              <PrivateNotesToggle
                value={privateNoteValue}
                onChange={onPrivateNoteChange}
                disabled={disabled}
              />
            }
          />
        ) : (
          <PrivateNotesToggle
            value={privateNoteValue}
            onChange={onPrivateNoteChange}
            disabled
          />
        )}
      </div>
    </div>
  );
}

export function PricingPageCopyPanel({
  snapshot,
  productId,
  productName,
  productSlug,
  currency,
  pricingModel,
  advertisedMonthly,
  regularUseMonthly,
  includedCreditsMonthly,
  usageEstimatesAvailable = true,
  yearlySavings,
  plansForCopy,
  canEdit,
  onSave,
}: {
  snapshot: EntityRow;
  productId: string;
  productName: string;
  productSlug: string;
  currency: string;
  pricingModel: string | null;
  advertisedMonthly: number | null;
  regularUseMonthly: number | null;
  includedCreditsMonthly?: number | null;
  /** When false, Real-world cost section is unavailable (no fake estimates). */
  usageEstimatesAvailable?: boolean;
  yearlySavings: number | null;
  plansForCopy: Parameters<typeof buildPageIntro>[0]['plans'];
  canEdit: boolean;
  onSave: (pageCopy: PricingPageCopy) => Promise<void>;
}) {
  const saved = useMemo(() => parsePricingPageCopy(snapshot.pageCopy), [snapshot.pageCopy]);
  const [draft, setDraft] = useState<PricingPageCopy>(saved);
  const [baseline, setBaseline] = useState<PricingPageCopy>(saved);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [typicalMonthlyPrice, setTypicalMonthlyPrice] = useState<number | null>(null);

  useEffect(() => {
    setDraft(saved);
    setBaseline(saved);
  }, [saved]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  useEffect(() => {
    setPricingPageCopyDirty(dirty);
    return () => setPricingPageCopyDirty(false);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    let cancelled = false;
    dataApi
      .list('products')
      .then((res: { rows: EntityRow[] }) => {
        const prices = res.rows
          .map((p: EntityRow) => (p.minMonthlyPrice != null ? Number(p.minMonthlyPrice) : null))
          .filter((n: number | null): n is number => n != null && Number.isFinite(n) && n > 0);
        if (cancelled || prices.length === 0) return;
        const sorted = [...prices].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const raw =
          sorted.length % 2 === 0
            ? (sorted[mid - 1]! + sorted[mid]!) / 2
            : sorted[mid]!;
        setTypicalMonthlyPrice(Math.round(raw * 100) / 100);
      })
      .catch(() => {
        if (!cancelled) setTypicalMonthlyPrice(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cheaperPct = useMemo(() => {
    if (advertisedMonthly == null || typicalMonthlyPrice == null || typicalMonthlyPrice <= 0) {
      return null;
    }
    return Math.round(((typicalMonthlyPrice - advertisedMonthly) / typicalMonthlyPrice) * 100);
  }, [advertisedMonthly, typicalMonthlyPrice]);

  const auto = useMemo(() => {
    const pageIntro = buildPageIntro({
      productName,
      pricingModel,
      advertisedMonthly,
      currency,
      plans: plansForCopy,
    });
    const marketLead = buildMarketAutoLead({
      productName,
      advertisedMonthly,
      typicalMonthlyPrice,
      currency,
      cheaperPct,
    });
    const plansIntro = buildPlansIntro(productName, plansForCopy, yearlySavings);
    const usageIntro = buildUsageIntro(productName);
    const compareIntro = buildCompareIntro({ productName, cheaperPct });
    const expert = buildHermanTake({
      productName,
      advertisedMonthly,
      regularUseMonthly,
      currency,
    });
    return { pageIntro, marketLead, plansIntro, usageIntro, compareIntro, expert };
  }, [
    productName,
    pricingModel,
    advertisedMonthly,
    currency,
    plansForCopy,
    yearlySavings,
    regularUseMonthly,
    typicalMonthlyPrice,
    cheaperPct,
  ]);

  const notesSummaryStats = useMemo(() => {
    const stats: Array<{ value: string; label: string }> = [];
    if (advertisedMonthly != null && Number.isFinite(advertisedMonthly)) {
      stats.push({
        value: `${fmtMoney(advertisedMonthly, currency)}/mo`,
        label: 'Starting price',
      });
    }
    if (regularUseMonthly != null && Number.isFinite(regularUseMonthly)) {
      stats.push({
        value: `~${fmtMoney(regularUseMonthly, currency)}/mo`,
        label: 'Regular use',
      });
    }
    if (includedCreditsMonthly != null && includedCreditsMonthly > 0) {
      stats.push({
        value: `${includedCreditsMonthly.toLocaleString('en-US')} credits/mo`,
        label: 'Included',
      });
    }
    return stats;
  }, [advertisedMonthly, regularUseMonthly, includedCreditsMonthly, currency]);

  const basePreview = reviewPreviewPageUrl(productSlug.replace(/\/$/, ''));
  const sectionUrl = (anchor: string) => `${basePreview}#${anchor}`;
  const privateNotes = draft.privateNotes ?? {};
  const step = STEPS[stepIndex]!;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  async function save(): Promise<boolean> {
    if (!canEdit) return false;
    if (!dirty) return true;
    setSaving(true);
    try {
      const next = mergePricingPageCopy({}, draft);
      await onSave(next);
      setDraft(next);
      setBaseline(next);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    if (dirty) {
      const ok = await save();
      if (!ok) return;
    }
    if (!isLast) setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  async function goBack() {
    if (dirty) {
      const ok = await save();
      if (!ok) return;
    }
    if (!isFirst) setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function jumpTo(index: number) {
    if (index === stepIndex) return;
    if (dirty) {
      const ok = await save();
      if (!ok) return;
    }
    setStepIndex(index);
  }

  function setField(key: PricingCopyFieldId, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setPrivate(key: keyof PricingPageCopyPrivateNotes, value: string) {
    setDraft((prev) => ({
      ...prev,
      privateNotes: { ...(prev.privateNotes ?? {}), [key]: value },
    }));
  }

  function renderStepBody() {
    switch (step.id) {
      case 'intro':
        return (
          <StepShell
            eyebrow={step.eyebrow}
            title={`${productName} pricing — introduction`}
            sectionHref={sectionUrl('pricing-intro')}
          >
            {!draft.introduction?.trim() ? <AlreadyAdded text={auto.pageIntro} /> : null}
            <YourTakeField
              field="introduction"
              productId={productId}
              canEdit={canEdit}
              value={draft.introduction ?? ''}
              onChange={(v) => setField('introduction', v)}
              disabled={!canEdit}
              placeholder="Leave blank to keep the automatic introduction"
              tips={[
                'Explain how the pricing works',
                'Mention anything unusual about the model',
                'Aim for 2–3 sentences',
              ]}
              privateNoteValue={privateNotes.introduction ?? ''}
              onPrivateNoteChange={(v) => setPrivate('introduction', v)}
            />
          </StepShell>
        );
      case 'market':
        return (
          <StepShell
            eyebrow={step.eyebrow}
            title={`Is ${productName} expensive?`}
            sectionHref={sectionUrl('pricing-benchmark')}
          >
            <AlreadyAdded text={auto.marketLead} />
            <YourTakeField
              field="marketPositionCommentary"
              productId={productId}
              canEdit={canEdit}
              value={draft.marketPositionCommentary ?? ''}
              onChange={(v) => setField('marketPositionCommentary', v)}
              disabled={!canEdit}
              rows={2}
              placeholder="Your interpretation after the automatic price comparison"
              tips={[
                'Add your interpretation, not the numbers',
                'Explain what can increase or lower the real cost',
                'Aim for 1–2 sentences',
              ]}
              privateNoteValue={privateNotes.marketPositionCommentary ?? ''}
              onPrivateNoteChange={(v) => setPrivate('marketPositionCommentary', v)}
            />
          </StepShell>
        );
      case 'comparison':
        return (
          <StepShell
            eyebrow={step.eyebrow}
            title={`How ${productName} pricing compares`}
            sectionHref={sectionUrl('pricing-comparison')}
          >
            <AlreadyAdded text={auto.compareIntro} />
            <YourTakeField
              field="comparisonCommentary"
              productId={productId}
              canEdit={canEdit}
              value={draft.comparisonCommentary ?? ''}
              onChange={(v) => setField('comparisonCommentary', v)}
              disabled={!canEdit}
              rows={2}
              placeholder="Extra context for the comparison section"
              tips={[
                'Biggest pricing advantage',
                'Biggest pricing weakness',
                'Aim for 1–2 sentences',
              ]}
              privateNoteValue={privateNotes.comparisonCommentary ?? ''}
              onPrivateNoteChange={(v) => setPrivate('comparisonCommentary', v)}
            />
          </StepShell>
        );
      case 'expert':
        return (
          <StepShell
            eyebrow={step.eyebrow}
            title={`Our take on ${productName}'s pricing`}
            sectionHref={sectionUrl('pricing-verdict')}
          >
            {!draft.expertOpinion?.trim() ? <AlreadyAdded text={auto.expert} /> : null}
            <YourTakeField
              field="expertOpinion"
              productId={productId}
              canEdit={canEdit}
              value={draft.expertOpinion ?? ''}
              onChange={(v) => setField('expertOpinion', v)}
              disabled={!canEdit}
              rows={4}
              placeholder="Leave blank to keep the automatic expert take"
              tips={[
                'Your final pricing verdict',
                'Who gets good value vs who may overspend',
                'Replaces the automatic take when filled',
              ]}
              privateNoteValue={privateNotes.expertOpinion ?? ''}
              onPrivateNoteChange={(v) => setPrivate('expertOpinion', v)}
            />
          </StepShell>
        );
      case 'additional':
        return (
          <div className="space-y-8">
            <StepShell
              eyebrow="Plans"
              title="Plans & what you get"
              sectionHref={sectionUrl('pricing-plans')}
            >
              <AlreadyAdded text={auto.plansIntro} />
              <YourTakeField
                field="plansNote"
                productId={productId}
                canEdit={canEdit}
                value={draft.plansNote ?? ''}
                onChange={(v) => setField('plansNote', v)}
                disabled={!canEdit}
                rows={2}
                tips={['Optional note under the plans blurb', 'Do not restate plan prices']}
                privateNoteValue={privateNotes.plansNote ?? ''}
                onPrivateNoteChange={(v) => setPrivate('plansNote', v)}
              />
            </StepShell>
            <StepShell
              eyebrow="Real-world cost"
              title="What you'll actually pay"
              sectionHref={sectionUrl('pricing-real-world-cost')}
            >
              {usageEstimatesAvailable ? (
                <>
                  <AlreadyAdded text={auto.usageIntro} />
                  <YourTakeField
                    field="realWorldCostCommentary"
                    productId={productId}
                    canEdit={canEdit}
                    value={draft.realWorldCostCommentary ?? ''}
                    onChange={(v) => setField('realWorldCostCommentary', v)}
                    disabled={!canEdit}
                    rows={2}
                    tips={[
                      'Optional note under usage estimates',
                      'Do not restate the light/regular/heavy numbers',
                    ]}
                    privateNoteValue={privateNotes.realWorldCostCommentary ?? ''}
                    onPrivateNoteChange={(v) => setPrivate('realWorldCostCommentary', v)}
                  />
                </>
              ) : (
                <div className="rounded-md border border-dashed border-amber-200 bg-amber-50/50 px-3 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Unavailable — not enough verified data
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                    Light, regular, and heavy monthly cost estimates cannot be calculated yet
                    (missing feature costs and/or credit top-up packages). The public Pricing tab
                    will show “Not enough data to estimate” here. No fake monthly estimate is
                    invented.
                  </p>
                </div>
              )}
            </StepShell>
          </div>
        );
    }
  }

  return (
    <PricingSection
      title="5. Pricing page copy"
      badge="MANUAL"
      description="One section at a time. Save anytime — Next saves automatically."
      actions={
        canEdit ? (
          <Button
            variant="primary"
            className="text-xs"
            disabled={!dirty || saving}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <PricingAiNotesPanel
          productId={productId}
          canEdit={canEdit}
          summaryStats={notesSummaryStats}
        />

        <div>
          <p className="text-xs text-slate-500">
            Step {stepIndex + 1} of {STEPS.length}
            <span className="text-slate-300 dark:text-slate-600"> · </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{step.eyebrow}</span>
            {dirty && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
          </p>
          <nav
            className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-400"
            aria-label="Page copy sections"
          >
            {STEPS.map((s, i) => (
              <span key={s.id} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300 dark:text-slate-600">→</span>}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void jumpTo(i)}
                  className={
                    i === stepIndex
                      ? 'font-semibold text-pink-600 dark:text-pink-400'
                      : 'hover:text-slate-600 dark:hover:text-slate-300'
                  }
                >
                  {s.short}
                </button>
              </span>
            ))}
          </nav>
        </div>

        {renderStepBody()}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button
            variant="secondary"
            className="text-xs"
            disabled={isFirst || saving}
            onClick={() => void goBack()}
          >
            <Icon name="arrow_back" className="!text-[14px]" /> Back
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Button
                variant="secondary"
                className="text-xs"
                disabled={!dirty || saving}
                onClick={() => void save()}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
            {!isLast ? (
              <Button
                variant="primary"
                className="text-xs"
                disabled={saving}
                onClick={() => void goNext()}
              >
                {dirty ? 'Save & next' : 'Next'}
                <Icon name="arrow_forward" className="!text-[14px]" />
              </Button>
            ) : (
              canEdit && (
                <Button
                  variant="primary"
                  className="text-xs"
                  disabled={!dirty || saving}
                  onClick={() => void save()}
                >
                  {saving ? 'Saving…' : dirty ? 'Save & finish' : 'All saved'}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </PricingSection>
  );
}
