// Proof-only panel: instructions, attachments, public display and reviewer
// metadata. Does NOT include the answer input — that lives in the session
// table / compact row. Attachments save immediately on upload.

import { useState } from 'react';
import { dataApi, type EntityRow } from '../api';
import { Button, ErrorNote, Field, Select, TextArea, TextInput, useAsync } from '../ui';
import { EvidenceAttachments } from './EvidenceAttachments';
import { renderPublicResult, testerHelpTooltip, testerInstructions } from './presentation';
import type { RawValue } from './EvidenceInput';

export function ProofPanel({
  def,
  categorySlug,
  runId,
  productId,
  existing,
  /** Current answer draft from the session form (for public result templating). */
  answerRaw,
  onSaved,
}: {
  def: EntityRow;
  categorySlug?: string;
  runId: string;
  productId?: string;
  existing: EntityRow | null;
  answerRaw?: RawValue;
  onSaved: () => void;
}) {
  const [publicResult, setPublicResult] = useState(existing?.publicResult ?? '');
  const [publicExplanation, setPublicExplanation] = useState(existing?.publicExplanation ?? '');
  const [internalNotes, setInternalNotes] = useState(existing?.internalNotes ?? '');
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
  const [resultId, setResultId] = useState<string | null>(existing?.id ?? null);
  const { busy, error, setError, run } = useAsync();

  const steps = testerInstructions(def);
  const hint = testerHelpTooltip(def, categorySlug);

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

  function templatedPublicResult(): string | undefined {
    const raw = answerRaw ?? (existing?.rawValue as RawValue | undefined);
    if (!raw || existing?.notApplicable) return undefined;
    const val =
      'value' in raw ? raw.value : 'text' in raw ? raw.text : 'status' in raw ? raw.status : null;
    if (val === null) return undefined;
    return renderPublicResult(def, val) ?? undefined;
  }

  async function saveProof(e: React.FormEvent) {
    e.preventDefault();
    if (override !== '' && !overrideReason.trim()) {
      setError('A manual override requires a reason (it is audit-logged).');
      return;
    }
    const templated = templatedPublicResult();
    const fields: Record<string, unknown> = {
      publicResult: publicResult || templated || undefined,
      publicExplanation: publicExplanation || undefined,
      internalNotes: internalNotes || undefined,
      confidence,
      verificationStatus: verification,
      manualOverrideScore: override === '' ? undefined : Number(override),
      manualOverrideReason: override === '' ? undefined : overrideReason,
      testDate: Date.now(),
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
    <form onSubmit={saveProof} className="space-y-4">
      {error && <ErrorNote message={error} />}

      {(hint || steps.length > 0 || def.sampleSize) && (
        <div className="space-y-2 rounded-lg border border-slate-200/80 bg-white/80 p-3 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          {hint && steps.length === 0 && <p className="text-xs">{hint}</p>}
          {steps.length > 0 && (
            <ol className="list-decimal space-y-0.5 pl-4 text-xs">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {def.sampleSize ? (
            <p className="text-xs text-slate-500">Sample: {String(def.sampleSize)} items.</p>
          ) : null}
        </div>
      )}

      <EvidenceAttachments
        def={def}
        resultId={resultId}
        productId={productId}
        ensureResultId={ensureResultId}
        disabled={busy}
      />

      <Field
        label="Public result display"
        hint='Shown on the review page, e.g. "4.2 seconds", "84%"'
      >
        <TextInput
          value={publicResult}
          placeholder={templatedPublicResult() ?? 'Auto-filled when you save answers'}
          onChange={(e) => setPublicResult(e.target.value)}
        />
      </Field>

      <button
        type="button"
        className="testing-link text-xs font-medium hover:underline"
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
          <div className="rounded-md border border-[var(--testing-accent-border)] bg-[var(--testing-accent-soft)]/50 p-3 dark:border-[var(--testing-accent-border)]/40 dark:bg-[var(--testing-accent-soft)]">
            <div className="mb-2 text-xs font-semibold text-[var(--testing-accent-muted)]">
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

      <div className="border-t border-slate-200/80 pt-3 dark:border-slate-700">
        <Button type="submit" disabled={busy} className="testing-btn-primary w-full">
          {busy ? 'Saving…' : 'Save proof & notes'}
        </Button>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          Uploads save immediately. Use Save all on the session for your answers.
        </p>
      </div>
    </form>
  );
}
