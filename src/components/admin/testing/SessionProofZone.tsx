// Session-level proof: bulk upload images, then tag each to a question quickly.

import { useMemo, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import { Button, Icon, Select, TextInput } from '../ui';
import { testerQuestion } from './presentation';
import { parseBonusFeaturesDraft } from './BonusExtrasField';
import { bonusExtraCaption, LIVE_CAM_PROOF_TAG, proofTagCaption } from './proofTags';
import type { RawValue } from './EvidenceInput';
import type { SessionItem } from './sessionUi';
import './testing-ui.css';

const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
];

export type ProofAssignTarget = {
  targetId: string;
  defId: string;
  bonusExtraId?: string;
  liveCamProof?: boolean;
  label: string;
  defaultAltText: string;
};

interface SessionDraft {
  raw: RawValue | undefined;
  na: boolean;
  dirty: boolean;
}

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  targetId: string;
  altText: string;
  caption: string;
}

export function buildProofAssignTargets(
  items: SessionItem[],
  categorySlug: string | undefined,
  drafts: Record<string, SessionDraft>,
  liveCamDef?: EntityRow,
): ProofAssignTarget[] {
  const targets: ProofAssignTarget[] = [];
  if (liveCamDef) {
    targets.push({
      targetId: `${liveCamDef.id}::${LIVE_CAM_PROOF_TAG}`,
      defId: liveCamDef.id,
      liveCamProof: true,
      label: 'AI Cam Models',
      defaultAltText: 'Proof: AI Cam Models',
    });
  }
  for (const { def } of items) {
    const slug = String(def.slug ?? '');
    const label = testerQuestion(def, categorySlug);
    if (slug === 'platform-extras-list') {
      const listRaw = drafts[def.id]?.raw;
      const liveRaw = liveCamDef ? drafts[liveCamDef.id]?.raw : undefined;
      const parsed = parseBonusFeaturesDraft(listRaw, liveRaw);
      for (const extra of parsed.extras) {
        const name = extra.name.trim();
        if (!name) continue;
        targets.push({
          targetId: `${def.id}::bonus::${extra.id}`,
          defId: def.id,
          bonusExtraId: extra.id,
          label: `Bonus: ${name}`,
          defaultAltText: `Bonus: ${name}`,
        });
      }
      targets.push({
        targetId: def.id,
        defId: def.id,
        label: `${label} (general)`,
        defaultAltText: `Evidence: ${def.name}`,
      });
    } else {
      targets.push({
        targetId: def.id,
        defId: def.id,
        label,
        defaultAltText: `Evidence: ${def.name}`,
      });
    }
  }
  return targets;
}

function parseTarget(targetId: string): { defId: string; bonusExtraId?: string; liveCamProof?: boolean } {
  if (targetId.endsWith(`::${LIVE_CAM_PROOF_TAG}`)) {
    return { defId: targetId.replace(new RegExp(`::${LIVE_CAM_PROOF_TAG}$`), ''), liveCamProof: true };
  }
  const bonusMatch = targetId.match(/^(.+)::bonus::(.+)$/);
  if (bonusMatch) return { defId: bonusMatch[1], bonusExtraId: bonusMatch[2] };
  return { defId: targetId };
}

export function SessionProofZone({
  items,
  categorySlug,
  runId,
  productId,
  resultByDef,
  drafts,
  liveCamDef,
  onUploaded,
}: {
  items: SessionItem[];
  categorySlug?: string;
  runId: string;
  productId?: string;
  resultByDef: Map<string, EntityRow>;
  drafts: Record<string, SessionDraft>;
  liveCamDef?: EntityRow;
  onUploaded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const assignTargets = useMemo(
    () => buildProofAssignTargets(items, categorySlug, drafts, liveCamDef),
    [items, categorySlug, drafts, liveCamDef],
  );

  const defaultTargetId = assignTargets[0]?.targetId ?? '';

  const targetById = useMemo(
    () => new Map(assignTargets.map((t) => [t.targetId, t])),
    [assignTargets],
  );

  async function ensureResultId(defId: string): Promise<string> {
    const existing = resultByDef.get(defId);
    if (existing?.id) return existing.id;
    const created = await dataApi.create(
      'evidenceResults',
      { testDate: Date.now() },
      { testRun: runId, evidenceDefinition: defId, product: productId ?? null },
    );
    return created.id;
  }

  function addFiles(files: FileList | File[]) {
    const accepted = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (accepted.length === 0) {
      setError('Only PNG/JPEG/WebP/GIF images and MP4/WebM videos are supported.');
      return;
    }
    setError(null);
    const target = targetById.get(defaultTargetId);
    setStaged((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        targetId: defaultTargetId,
        altText: target?.defaultAltText ?? '',
        caption: '',
      })),
    ]);
  }

  function removeStaged(id: string) {
    setStaged((prev) => {
      const item = prev.find((s) => s.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  }

  function patchStaged(id: string, patch: Partial<StagedFile>) {
    setStaged((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        if (patch.targetId && patch.targetId !== row.targetId) {
          const target = targetById.get(patch.targetId);
          if (target && (!row.altText.trim() || row.altText === targetById.get(row.targetId)?.defaultAltText)) {
            next.altText = target.defaultAltText;
          }
        }
        return next;
      }),
    );
  }

  async function uploadStaged() {
    const tagged = staged.filter((s) => s.targetId);
    if (tagged.length === 0) {
      setError('Add files and assign each to a question.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const byDef = new Map<string, StagedFile[]>();
      for (const s of tagged) {
        const { defId } = parseTarget(s.targetId);
        const list = byDef.get(defId) ?? [];
        list.push(s);
        byDef.set(defId, list);
      }
      for (const [defId, files] of byDef) {
        const def = items.find(({ def: d }) => d.id === defId)?.def;
        if (!def) continue;
        const resultId = await ensureResultId(defId);
        for (const s of files) {
          const target = targetById.get(s.targetId);
          const { bonusExtraId, liveCamProof } = parseTarget(s.targetId);
          const form = new FormData();
          form.set('file', s.file);
          form.set('adult', '0');
          form.set('role', 'proof');
          form.set(
            'altText',
            s.altText.trim() || target?.defaultAltText || `Evidence: ${def.name}`,
          );
          if (liveCamProof) {
            form.set('caption', proofTagCaption(LIVE_CAM_PROOF_TAG, s.caption.trim()));
          } else if (bonusExtraId) {
            form.set('caption', proofTagCaption(bonusExtraCaption(bonusExtraId), s.caption.trim()));
          } else if (s.caption.trim()) {
            form.set('caption', s.caption.trim());
          }
          form.set('evidenceResultId', resultId);
          if (productId) form.set('productId', productId);
          await api.upload<{ id: string }>('/api/admin/media/upload', form);
        }
      }
      for (const s of staged) {
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      }
      setStaged([]);
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Icon name="folder_open" className="testing-icon-accent !text-[16px]" />
          Session proof — bulk upload &amp; tag
          {staged.length > 0 && (
            <span className="rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-semibold text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
              {staged.length}
            </span>
          )}
        </span>
        <Icon name="expand_more" className={`!text-[18px] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 p-3 dark:border-slate-800">
          <p className="text-[11px] text-slate-500">
            Drop many images at once, assign each to a question (or a specific bonus feature you named),
            and optionally set alt text and caption before upload.
          </p>
          <div
            className={`testing-proof-zone relative rounded-lg p-4 text-center transition-colors ${dragging ? 'is-dragging' : ''}`}
            onDragEnter={(e) => {
              if (!e.dataTransfer.types.includes('Files')) return;
              e.preventDefault();
              dragDepth.current += 1;
              setDragging(true);
            }}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes('Files')) return;
              e.preventDefault();
            }}
            onDragLeave={() => {
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (dragDepth.current === 0) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              dragDepth.current = 0;
              setDragging(false);
              if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
            }}
          >
            <Icon name="cloud_upload" className="testing-icon-accent !text-[28px] opacity-70" />
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Drop images here to stage them</p>
            <button
              type="button"
              disabled={busy}
              className="testing-link mt-2 text-xs font-medium hover:underline disabled:opacity-50"
              onClick={() => fileInput.current?.click()}
            >
              Or choose files
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {staged.length > 0 && (
            <div className="space-y-2">
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                {staged.map((s) => (
                  <div
                    key={s.id}
                    className="space-y-2 rounded-md border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                        {s.previewUrl ? (
                          <img src={s.previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Icon name="videocam" className="!text-[18px] text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Select
                          className="w-full !py-1 text-[11px]"
                          value={s.targetId}
                          onChange={(e) => patchStaged(s.id, { targetId: e.target.value })}
                        >
                          {assignTargets.map((o) => (
                            <option key={o.targetId} value={o.targetId}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          <TextInput
                            className="!py-1 text-[11px]"
                            placeholder="Alt text"
                            value={s.altText}
                            onChange={(e) => patchStaged(s.id, { altText: e.target.value })}
                          />
                          <TextInput
                            className="!py-1 text-[11px]"
                            placeholder="Caption (optional)"
                            value={s.caption}
                            onChange={(e) => patchStaged(s.id, { caption: e.target.value })}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                        aria-label="Remove"
                        onClick={() => removeStaged(s.id)}
                      >
                        <Icon name="close" className="!text-[16px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">{staged.length} file(s) ready</p>
                <Button type="button" disabled={busy} className="!py-1 text-xs" onClick={() => void uploadStaged()}>
                  {busy ? 'Uploading…' : 'Upload tagged files'}
                </Button>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
