// Step-by-step worksheet UI for image/video/consistency batch tests.

import { useMemo, useRef, useState } from 'react';
import type { EntityRow } from '../api';
import { Icon, TextArea } from '../ui';
import {
  IMAGE_BATCH_PROMPT,
  consistencyPromptForStep,
  videoBatchPromptForStep,
} from './testPrompts';
import {
  resolveWorksheetConfig,
  capWorksheetRows,
  type DerivedColumn,
  type WorksheetConfig,
  type WorksheetRow,
} from './worksheets';
import {
  IMAGE_DEFECTS,
  VIDEO_DEFECTS,
  batchSummaryStats,
  consistencySummaryStats,
  defectCounts,
  deriveWorksheetExtended,
  imageUsable,
  syncDerivedRowFields,
  type TriValue,
  videoUsable,
} from './worksheetScoring';
import './testing-ui.css';

function RatingButtons({
  value,
  max = 5,
  disabled,
  onChange,
}: {
  value: number | undefined;
  max?: number;
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          className={`min-w-[2rem] rounded-md border px-1.5 py-1 text-xs font-semibold tabular-nums transition-colors ${
            value === n
              ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function TriButtons({
  value,
  disabled,
  onChange,
}: {
  value: TriValue | undefined;
  disabled?: boolean;
  onChange: (v: TriValue) => void;
}) {
  const opts: { v: TriValue; label: string }[] = [
    { v: 'yes', label: 'Yes' },
    { v: 'mostly', label: 'Mostly' },
    { v: 'no', label: 'No' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map(({ v, label }) => (
        <button
          key={v}
          type="button"
          disabled={disabled}
          className={`min-w-[4rem] rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            value === v
              ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
          }`}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function DefectChecklist({
  defects,
  options,
  disabled,
  onChange,
}: {
  defects: string[];
  options: readonly string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
      {options.map((item) => (
        <li key={item}>
          <label className="flex cursor-pointer items-start gap-1 text-[11px] text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="testing-checkbox mt-0.5 h-3 w-3 shrink-0 rounded"
              checked={defects.includes(item)}
              disabled={disabled}
              onChange={() => {
                const next = defects.includes(item) ? defects.filter((d) => d !== item) : [...defects, item];
                onChange(next);
              }}
            />
            <span>{item}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function imageRatingSummary(row: WorksheetRow): string | null {
  const parts: string[] = [];
  if (typeof row.realism === 'number') parts.push(`Quality ${row.realism}/5`);
  if (typeof row['prompt-accuracy'] === 'number') parts.push(`Prompt ${row['prompt-accuracy']}/5`);
  if (typeof row.composition === 'number') parts.push(`Comp ${row.composition}/5`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function rowComplete(sessionId: string, row: WorksheetRow, isReferenceStep: boolean): boolean {
  if (sessionId === 'image-batch-review') {
    return typeof row.realism === 'number' && typeof row['prompt-accuracy'] === 'number';
  }
  if (sessionId === 'video-batch-review') {
    return (
      Boolean(row._videoUrl || row._imageUrl) &&
      typeof row.motion === 'number' &&
      typeof row.accuracy === 'number'
    );
  }
  if (sessionId === 'image-consistency') {
    if (isReferenceStep) return Boolean(row._imageUrl || row._videoUrl);
    return Boolean(row['face-consistency'] && row['body-consistency'] && row['style-consistency']);
  }
  return false;
}

/** Fixed-height media upload — images use inline preview; videos use compact bar + player below. */
function CompactMediaDrop({
  kind,
  mediaUrl,
  disabled,
  uploading,
  onFiles,
}: {
  kind: 'image' | 'video';
  mediaUrl?: string;
  disabled?: boolean;
  uploading?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const accept = kind === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*';
  const acceptMime =
    kind === 'video'
      ? (f: File) => f.type.startsWith('video/')
      : (f: File) => f.type.startsWith('image/');

  function openFilePicker() {
    if (!disabled) fileInput.current?.click();
  }

  if (kind === 'video' && mediaUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Icon name="videocam" className="!text-[18px] shrink-0 text-pink-500" />
            <span className="truncate font-medium">Video uploaded</span>
          </div>
          <button
            type="button"
            className="testing-link shrink-0 text-[11px] font-medium"
            disabled={disabled}
            onClick={openFilePicker}
          >
            Replace
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-black/90 dark:border-slate-700">
          <video
            src={mediaUrl}
            controls
            playsInline
            className="mx-auto max-h-[240px] w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFiles([f]);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
        dragOver
          ? 'border-pink-400 bg-pink-50/60 dark:border-pink-600 dark:bg-pink-950/30'
          : 'border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800/30'
      }`}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        const files = Array.from(e.dataTransfer.files).filter(acceptMime);
        if (files.length > 0) onFiles(files);
      }}
      onClick={() => {
        if (!disabled && !mediaUrl) fileInput.current?.click();
      }}
    >
      {mediaUrl ? (
        kind === 'video' ? (
          <video
            src={mediaUrl}
            controls
            className="max-h-full max-w-full cursor-pointer object-contain p-1"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) fileInput.current?.click();
            }}
          />
        ) : (
          <img
            src={mediaUrl}
            alt=""
            className="max-h-full max-w-full cursor-pointer object-contain p-1"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) fileInput.current?.click();
            }}
          />
        )
      ) : uploading ? (
        <Icon name="progress_activity" className="!text-[22px] animate-spin text-slate-400" />
      ) : (
        <Icon
          name={kind === 'video' ? 'videocam' : 'add_photo_alternate'}
          className="!text-[28px] text-slate-300"
        />
      )}
      <input
        ref={fileInput}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFiles([f]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function FixedMediaPreview({ kind, url, label }: { kind: 'image' | 'video'; url: string; label: string }) {
  if (kind === 'video') {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-black/90 dark:border-slate-700">
          <video
            src={url}
            controls
            playsInline
            className="mx-auto max-h-[240px] w-full object-contain"
            aria-label={label}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-[180px] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/40">
      <img src={url} alt={label} className="max-h-full max-w-full object-contain p-1" />
    </div>
  );
}

function StepPills({
  rowCount,
  step,
  rows,
  sessionId,
  onSelect,
}: {
  rowCount: number;
  step: number;
  rows: WorksheetRow[];
  sessionId: string;
  onSelect: (i: number) => void;
}) {
  const isConsistency = sessionId === 'image-consistency';
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: rowCount }, (_, i) => {
        const done = rowComplete(sessionId, rows[i] ?? {}, isConsistency && i === 0);
        const rating =
          sessionId === 'image-batch-review'
            ? imageRatingSummary(rows[i] ?? {})
            : sessionId === 'video-batch-review' && typeof rows[i]?.motion === 'number'
              ? `Motion ${rows[i].motion}/5`
              : null;
        return (
          <button
            key={i}
            type="button"
            title={rating ?? (done ? 'Complete' : `Go to ${i + 1}`)}
            onClick={() => onSelect(i)}
            className={`h-6 min-w-[1.5rem] rounded px-1.5 text-[10px] font-semibold tabular-nums transition-colors ${
              step === i
                ? 'bg-pink-600 text-white'
                : done
                  ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

export function WorksheetStepView({
  sessionId,
  config: baseConfig,
  defsBySlug,
  initialRows,
  disabled,
  productSlug,
  onChange,
  onUploadProof,
}: {
  sessionId: string;
  config: WorksheetConfig;
  defsBySlug: Map<string, EntityRow>;
  initialRows?: WorksheetRow[];
  disabled?: boolean;
  productSlug?: string;
  onChange: (rows: WorksheetRow[], derived: DerivedColumn[]) => void;
  onOpenProof?: () => void;
  onUploadProof?: (files: File[]) => Promise<{ id: string; url?: string }[]>;
}) {
  const cappedInitial = useMemo(
    () => capWorksheetRows(sessionId, baseConfig, initialRows, productSlug),
    [sessionId, baseConfig, initialRows, productSlug],
  );
  const config = useMemo(
    () => resolveWorksheetConfig(sessionId, baseConfig, cappedInitial, productSlug),
    [sessionId, baseConfig, cappedInitial, productSlug],
  );

  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isConsistency = sessionId === 'image-consistency';
  const isReferenceStep = isConsistency && step === 0;
  const prompt =
    sessionId === 'image-batch-review'
      ? IMAGE_BATCH_PROMPT
      : sessionId === 'video-batch-review'
        ? videoBatchPromptForStep(step)
        : isConsistency
          ? consistencyPromptForStep(step)
          : '';

  const [rows, setRows] = useState<WorksheetRow[]>(() => {
    const base: WorksheetRow[] = [];
    for (let i = 0; i < config.rowCount; i++) base.push({ ...(cappedInitial?.[i] ?? {}) });
    return base;
  });

  const syncedRows = useMemo(
    () => rows.map((r) => syncDerivedRowFields(r, sessionId)),
    [rows, sessionId],
  );
  const row = syncedRows[step] ?? {};
  const allDone = syncedRows.every((r, i) => rowComplete(sessionId, r, isConsistency && i === 0));

  function emit(next: WorksheetRow[]) {
    onChange(next, deriveWorksheetExtended(config, next, sessionId));
  }

  function patchRow(patch: Partial<WorksheetRow>) {
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === step ? syncDerivedRowFields({ ...r, ...patch }, sessionId) : r,
      );
      emit(next);
      return next;
    });
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const isVideoBatch = sessionId === 'video-batch-review';

  async function handleMediaDrop(files: File[]) {
    if (!onUploadProof) return;
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await onUploadProof(files);
      const first = uploaded[0];
      if (first?.url) {
        patchRow(
          isVideoBatch
            ? { _mediaId: first.id, _videoUrl: first.url }
            : { _mediaId: first.id, _imageUrl: first.url },
        );
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const mediaKind: 'image' | 'video' = isVideoBatch ? 'video' : 'image';
  const currentMediaUrl =
    typeof row._imageUrl === 'string'
      ? (row._imageUrl as string)
      : typeof row._videoUrl === 'string'
        ? (row._videoUrl as string)
        : undefined;
  const referenceUrl =
    typeof syncedRows[0]?._imageUrl === 'string'
      ? (syncedRows[0]._imageUrl as string)
      : typeof syncedRows[0]?._videoUrl === 'string'
        ? (syncedRows[0]._videoUrl as string)
        : undefined;
  const ratingLine = imageRatingSummary(row);

  const consistencyLive =
    sessionId === 'image-consistency' ? consistencySummaryStats(syncedRows) : null;

  const summary =
    config.showBatchSummary && allDone
      ? batchSummaryStats(
          syncedRows,
          isVideoBatch
            ? ['motion', 'accuracy', 'character-consistency', 'frame-consistency']
            : ['realism', 'prompt-accuracy', 'composition'],
          isVideoBatch ? videoUsable : imageUsable,
        )
      : null;
  const topDefects = config.showBatchSummary && allDone ? defectCounts(syncedRows) : [];

  return (
    <div className="space-y-3">
      {config.instruction && step === 0 && (
        <p className="text-xs text-slate-600 dark:text-slate-400">{config.instruction}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {config.rowLabel} {step + 1} of {config.rowCount}
          {isReferenceStep && (
            <span className="ml-1.5 text-xs font-normal text-pink-600 dark:text-pink-400">Reference</span>
          )}
          {ratingLine && (
            <span className="ml-1.5 text-xs font-normal text-slate-500" title={ratingLine}>
              · {ratingLine}
            </span>
          )}
        </p>
      </div>

      <StepPills rowCount={config.rowCount} step={step} rows={syncedRows} sessionId={sessionId} onSelect={setStep} />

      {prompt && (
        <div className="rounded-md border border-slate-200 bg-slate-50/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {isConsistency && !isReferenceStep ? 'Variation prompt' : 'Prompt'}
          </p>
          <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">{prompt}</p>
          <button type="button" className="testing-link mt-1 text-[11px] font-medium" onClick={() => void copyPrompt()}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

      {isConsistency && step > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase text-slate-400">Reference</p>
            {referenceUrl ? (
              <FixedMediaPreview kind={mediaKind} url={referenceUrl} label="Reference" />
            ) : (
              <button type="button" className="testing-link text-xs" onClick={() => setStep(0)}>
                Upload reference first
              </button>
            )}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase text-slate-400">This image</p>
            <CompactMediaDrop
              kind={mediaKind}
              mediaUrl={currentMediaUrl}
              disabled={disabled}
              uploading={uploading}
              onFiles={(files) => void handleMediaDrop(files)}
            />
          </div>
        </div>
      )}

      {(sessionId === 'image-batch-review' || isReferenceStep) && (
        <CompactMediaDrop
          kind={mediaKind}
          mediaUrl={currentMediaUrl}
          disabled={disabled}
          uploading={uploading}
          onFiles={(files) => void handleMediaDrop(files)}
        />
      )}

      {isVideoBatch && !isReferenceStep && (
        <CompactMediaDrop
          kind="video"
          mediaUrl={currentMediaUrl}
          disabled={disabled}
          uploading={uploading}
          onFiles={(files) => void handleMediaDrop(files)}
        />
      )}

      {sessionId === 'image-batch-review' && (
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-500">Quality</p>
            <RatingButtons
              value={typeof row.realism === 'number' ? row.realism : undefined}
              disabled={disabled}
              onChange={(n) => patchRow({ realism: n })}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-500">Prompt</p>
            <RatingButtons
              value={typeof row['prompt-accuracy'] === 'number' ? row['prompt-accuracy'] : undefined}
              disabled={disabled}
              onChange={(n) => patchRow({ 'prompt-accuracy': n })}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-500">Composition</p>
            <RatingButtons
              value={typeof row.composition === 'number' ? row.composition : undefined}
              disabled={disabled}
              onChange={(n) => patchRow({ composition: n })}
            />
          </div>
        </div>
      )}

      {sessionId === 'image-batch-review' && (
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">Defects (optional)</summary>
          <div className="mt-1.5">
            <DefectChecklist
              defects={Array.isArray(row._defects) ? (row._defects as string[]) : []}
              options={IMAGE_DEFECTS}
              disabled={disabled}
              onChange={(d) => patchRow({ _defects: d })}
            />
          </div>
        </details>
      )}

      {sessionId === 'video-batch-review' && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['motion', 'accuracy', 'character-consistency', 'frame-consistency'] as const).map((slug, idx) => {
              const labels = ['Motion', 'Prompt', 'Character', 'Stability'];
              return (
                <div key={slug}>
                  <p className="mb-1 text-[10px] font-medium text-slate-500">{labels[idx]}</p>
                  <RatingButtons
                    value={typeof row[slug] === 'number' ? row[slug] : undefined}
                    disabled={disabled}
                    onChange={(n) => patchRow({ [slug]: n })}
                  />
                </div>
              );
            })}
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500">Defects (optional)</summary>
            <div className="mt-1.5">
              <DefectChecklist
                defects={Array.isArray(row._defects) ? (row._defects as string[]) : []}
                options={VIDEO_DEFECTS}
                disabled={disabled}
                onChange={(d) => patchRow({ _defects: d })}
              />
            </div>
          </details>
        </>
      )}

      {!isReferenceStep && isConsistency && (
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ['face-consistency', 'Face'],
              ['body-consistency', 'Body'],
              ['style-consistency', 'Style'],
            ] as const
          ).map(([slug, label]) => (
            <div key={slug}>
              <p className="mb-1 text-[10px] font-medium text-slate-500">{label}</p>
              <TriButtons
                value={row[slug] as TriValue | undefined}
                disabled={disabled}
                onChange={(v) => patchRow({ [slug]: v })}
              />
            </div>
          ))}
        </div>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-slate-500">Note (optional)</summary>
        <TextArea
          rows={2}
          className="mt-1.5 text-sm"
          placeholder="Tester note"
          value={typeof row._note === 'string' ? row._note : ''}
          disabled={disabled}
          onChange={(e) => patchRow({ _note: e.target.value })}
        />
      </details>

      {config.rowCount > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
          {step > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
              onClick={() => setStep((s) => s - 1)}
            >
              ← Previous {config.rowLabel.toLowerCase()}
            </button>
          ) : (
            <span aria-hidden />
          )}
          {step < config.rowCount - 1 ? (
            <button
              type="button"
              className="text-xs font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
              onClick={() => setStep((s) => s + 1)}
            >
              Next {config.rowLabel.toLowerCase()} →
            </button>
          ) : (
            <span aria-hidden />
          )}
        </div>
      )}

      {consistencyLive && consistencyLive.rated > 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/40">
          <p className="font-semibold text-slate-800 dark:text-slate-100">Live summary</p>
          <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
            <li>
              Face match (Yes): {consistencyLive.faceYes} of {consistencyLive.rated} rated
            </li>
            <li>
              Body match (Yes): {consistencyLive.bodyYes} of {consistencyLive.rated} rated
            </li>
            <li>
              Style match (Yes): {consistencyLive.styleYes} of {consistencyLive.rated} rated
            </li>
            {consistencyLive.avgOverall != null && (
              <li>Avg overall score: {consistencyLive.avgOverall}/5</li>
            )}
          </ul>
        </div>
      )}

      {summary && (
        <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/40">
          <p className="font-semibold text-slate-800 dark:text-slate-100">Summary</p>
          <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
            {Object.entries(summary.avgs).map(([slug, v]) => (
              <li key={slug}>
                Avg {slug.replace(/-/g, ' ')}: {v !== null ? `${v}/5` : '—'}
              </li>
            ))}
            <li>
              Usable: {summary.usable} of {config.rowCount}
            </li>
          </ul>
          {topDefects.length > 0 && (
            <p className="mt-2 text-slate-500">Top defects: {topDefects.slice(0, 3).map((d) => d.label).join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
