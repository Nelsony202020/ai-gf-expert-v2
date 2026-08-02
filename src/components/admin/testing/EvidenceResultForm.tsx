// Guided test card for one evidence definition: plain-English question,
// what/why/how instructions, the correct result control, unable-to-verify,
// proof requirements, and reviewer metadata. Used inside the evidence modal,
// inline category editing, and guided testing mode.
//
// Re-mount with key={def.id} when switching definitions so state resets.

import { useState, type ReactNode } from 'react';
import { dataApi, type EntityRow } from '../api';
import { Button, ErrorNote, Field, Select, TextArea, TextInput, useAsync } from '../ui';
import { EvidenceAttachments } from './EvidenceAttachments';
import { EvidenceInput, type RawValue } from './EvidenceInput';
import {
  renderPublicResult,
  testerInstructions,
  testerQuestion,
} from './presentation';
import { formatChecklistAnswer } from '../../../lib/testing/evidenceFormat';

export function EvidenceResultForm({
  def,
  runId,
  productId,
  existing,
  onSaved,
  showQuestion = false,
  submitLabel = 'Save result',
  secondaryActions,
}: {
  def: EntityRow;
  runId: string;
  productId?: string;
  existing: EntityRow | null;
  /** Called with true when the save actually wrote data. */
  onSaved: () => void;
  /** Render the question as a heading (guided mode / inline card). */
  showQuestion?: boolean;
  submitLabel?: string;
  /** Extra footer actions (e.g. Previous / Skip in guided mode). */
  secondaryActions?: ReactNode;
}) {
  const [rawValue, setRawValue] = useState<RawValue | undefined>(
    (existing?.rawValue as RawValue | undefined) ?? undefined,
  );
  const [publicResult, setPublicResult] = useState(existing?.publicResult ?? '');
  const [publicExplanation, setPublicExplanation] = useState(existing?.publicExplanation ?? '');
  const [internalNotes, setInternalNotes] = useState(existing?.internalNotes ?? '');
  const [notApplicable, setNotApplicable] = useState(Boolean(existing?.notApplicable));
  const [override, setOverride] = useState<string>(
    existing?.manualOverrideScore !== undefined && existing?.manualOverrideScore !== null
      ? String(existing.manualOverrideScore)
      : '',
  );
  const [overrideReason, setOverrideReason] = useState(existing?.manualOverrideReason ?? '');
  const [confidence, setConfidence] = useState(existing?.confidence ?? 'high');
  const [verification, setVerification] = useState(existing?.verificationStatus ?? 'unverified');
  const [showDetails, setShowDetails] = useState(
    Boolean(existing?.publicExplanation || existing?.internalNotes || existing?.manualOverrideScore != null),
  );
  // The saved record id — created eagerly on first proof upload so media can
  // link to the result before the tester presses Save.
  const [resultId, setResultId] = useState<string | null>(existing?.id ?? null);
  const { busy, error, setError, run } = useAsync();

  const question = testerQuestion(def);
  const steps = testerInstructions(def);
  // Legacy "unknown" results still load correctly even though the checkbox
  // was removed from the form.
  const unableToVerify = rawValue !== undefined && 'status' in rawValue && rawValue.status === 'unknown';

  async function ensureResultId(): Promise<string> {
    if (resultId) return resultId;
    const created = await dataApi.create(
      'evidenceResults',
      { testDate: Date.now() },
      { testRun: runId, evidenceDefinition: def.id, product: productId ?? null },
    );
    setResultId(created.id);
    return created.id;
  }

  // Keep the public result display in sync with the template unless the tester
  // edited it manually.
  function updateRawValue(next: RawValue | undefined) {
    setRawValue(next);
    if (!next) return;
    const checklistLabel =
      def.slug === 'included-features'
        ? 'features included'
        : def.slug === 'pricing-clarity'
          ? 'features'
          : 'items';
    const checklistText = formatChecklistAnswer(next, { itemLabel: checklistLabel });
    if (checklistText) {
      const previousChecklist = rawValue ? formatChecklistAnswer(rawValue, { itemLabel: checklistLabel }) : null;
      if (publicResult === '' || publicResult === previousChecklist) {
        setPublicResult(checklistText);
      }
      return;
    }
    const raw =
      'value' in next ? next.value : 'text' in next ? next.text : 'status' in next ? next.status : null;
    if (raw === null) return;
    const templated = renderPublicResult(def, raw);
    const previous =
      rawValue && 'value' in rawValue
        ? renderPublicResult(def, rawValue.value)
        : rawValue && 'text' in rawValue
          ? renderPublicResult(def, rawValue.text)
          : null;
    if (templated && (publicResult === '' || publicResult === previous)) {
      setPublicResult(templated);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (override !== '' && !overrideReason.trim()) {
      setError('A manual override requires a reason (it is audit-logged).');
      return;
    }
    const finalRaw = notApplicable ? { status: 'na' } : rawValue;

    const fields: Record<string, unknown> = {
      rawValue: finalRaw,
      publicResult: publicResult || undefined,
      publicExplanation: publicExplanation || undefined,
      internalNotes: internalNotes || undefined,
      notApplicable,
      isUnknown: unableToVerify,
      testDate: Date.now(),
      confidence,
      verificationStatus: verification,
      manualOverrideScore: override === '' ? undefined : Number(override),
      manualOverrideReason: override === '' ? undefined : overrideReason,
    };

    const done = await run(async () => {
      if (resultId) {
        await dataApi.update('evidenceResults', resultId, fields);
      } else {
        const created = await dataApi.create('evidenceResults', fields, {
          testRun: runId,
          evidenceDefinition: def.id,
          product: productId ?? null,
        });
        setResultId(created.id);
      }
      return true;
    });
    if (done) onSaved();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {error && <ErrorNote message={error} />}

      {showQuestion && (
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{question}</h3>
      )}

      {/* What / why / how */}
      {(def.shortDescription || def.whyItMatters || steps.length > 0 || def.sampleSize) && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {def.shortDescription && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">What to test</p>
              <p>{String(def.shortDescription)}</p>
            </div>
          )}
          {def.whyItMatters && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Why this matters</p>
              <p>{String(def.whyItMatters)}</p>
            </div>
          )}
          {steps.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">How to test</p>
              <ol className="mt-0.5 list-decimal space-y-0.5 pl-5">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}
          {def.sampleSize ? (
            <p className="text-xs text-slate-500">Sample size: review {String(def.sampleSize)} items.</p>
          ) : null}
        </div>
      )}

      {/* Result input */}
      {!notApplicable && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Result</p>
          <EvidenceInput
            def={def}
            value={unableToVerify ? undefined : rawValue}
            onChange={updateRawValue}
            disabled={unableToVerify}
          />
          {def.exampleAnswer && (
            <p className="mt-1.5 text-xs text-slate-400">Example: {String(def.exampleAnswer)}</p>
          )}
          {def.helpText && (
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{String(def.helpText)}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-100 py-2 dark:border-slate-800">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
            checked={notApplicable}
            onChange={(e) => setNotApplicable(e.target.checked)}
          />
          Not applicable (removed from calculation)
        </label>
      </div>

      {/* Proof attachments — uploaded directly from the test card */}
      <EvidenceAttachments
        def={def}
        resultId={resultId}
        productId={productId}
        ensureResultId={ensureResultId}
      />

      {!notApplicable && (
        <Field label="Public result display" hint='Shown on the review page, e.g. "4.2 seconds", "84%"'>
          <TextInput value={publicResult} onChange={(e) => setPublicResult(e.target.value)} />
        </Field>
      )}

      {/* Reviewer metadata + override, collapsed by default to keep the card focused */}
      <button
        type="button"
        className="text-xs font-medium text-slate-500 hover:text-pink-600"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
      >
        {showDetails ? '− Hide' : '+ Show'} notes, verification &amp; override
      </button>

      {showDetails && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Public explanation">
              <TextArea rows={2} value={publicExplanation} onChange={(e) => setPublicExplanation(e.target.value)} />
            </Field>
            <Field label="Internal tester notes">
              <TextArea rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Confidence">
              <Select value={confidence} onChange={(e) => setConfidence(e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </Field>
            <Field label="Verification">
              <Select value={verification} onChange={(e) => setVerification(e.target.value)}>
                <option value="unverified">Unverified</option>
                <option value="verified">Verified (fact-checked)</option>
              </Select>
            </Field>
          </div>

          <div className="rounded-md border border-pink-100 bg-pink-50/50 p-3">
            <div className="mb-2 text-xs font-semibold text-pink-700">
              Restricted manual override (audited — reason required)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Override score (0-10)">
                <TextInput type="number" step="0.1" min={0} max={10} value={override} onChange={(e) => setOverride(e.target.value)} />
              </Field>
              <Field label="Override reason" required={override !== ''}>
                <TextInput value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {secondaryActions}
          <span className="text-xs text-slate-400">{def.name}</span>
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
