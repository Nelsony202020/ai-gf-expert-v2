// Proof attachments for one evidence result: upload, drag-drop, pick existing, alt/caption.

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import { Button, Icon, TextInput } from '../ui';
import { MediaPickerModal } from '../MediaPicker';
import { ProofThumb } from './ProofThumb';
import {
  displayCaption,
  mediaMatchesProofTag,
  parseProofCaption,
  proofTagCaption,
} from './proofTags';
import { evidenceRequirements } from './presentation';

const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
];

export function EvidenceAttachments({
  def,
  resultId,
  productId,
  ensureResultId,
  disabled,
  captionTag,
  embedded,
  altTextPrefix,
  onUploaded,
}: {
  def: EntityRow;
  resultId: string | null;
  productId?: string;
  ensureResultId: () => Promise<string>;
  disabled?: boolean;
  /** When set, only show/upload media tagged with this caption prefix. */
  captionTag?: string;
  /** Compact block for inline rows (bonus features, etc.). */
  embedded?: boolean;
  altTextPrefix?: string;
  onUploaded?: () => void;
}) {
  const [attachments, setAttachments] = useState<EntityRow[]>([]);
  const [resolvedResultId, setResolvedResultId] = useState<string | null>(resultId);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const reloadGen = useRef(0);

  const requirements = evidenceRequirements(def);
  const uploading = uploadProgress !== null;

  useEffect(() => {
    if (resultId) setResolvedResultId(resultId);
  }, [resultId]);

  const reload = useCallback(
    async (id: string | null = resolvedResultId) => {
      if (!id) return;
      const gen = ++reloadGen.current;
      setLoading(true);
      try {
        const res = await dataApi.list('media');
        if (gen !== reloadGen.current) return;
        let rows = res.rows.filter((m) => m.evidenceResult?.id === id && !m.deletedAt);
        if (captionTag) {
          rows = rows.filter((m) => mediaMatchesProofTag(String(m.caption ?? ''), captionTag));
        }
        setAttachments(rows);
      } catch {
        if (gen === reloadGen.current) setAttachments([]);
      } finally {
        if (gen === reloadGen.current) setLoading(false);
      }
    },
    [resolvedResultId, captionTag],
  );

  useEffect(() => {
    void reload(resolvedResultId);
  }, [reload, resolvedResultId]);

  async function resolveResultId(): Promise<string> {
    if (resolvedResultId) return resolvedResultId;
    const id = await ensureResultId();
    setResolvedResultId(id);
    return id;
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => ACCEPTED_TYPES.includes(f.type));
    const skipped = Array.from(fileList).length - files.length;
    if (files.length === 0) {
      if (skipped > 0) setError('Only PNG/JPEG/WebP/GIF images and MP4/WebM videos are supported.');
      return;
    }
    setError(null);
    setUploadProgress({ done: 0, total: files.length });
    const failures: string[] = [];
    try {
      const id = await resolveResultId();
      const alt = altTextPrefix?.trim() ? `Proof: ${altTextPrefix.trim()}` : `Evidence: ${def.name}`;
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ done: i, total: files.length });
        try {
          const form = new FormData();
          form.set('file', files[i]);
          form.set('adult', '0');
          form.set('role', 'proof');
          form.set('altText', alt);
          if (captionTag) form.set('caption', proofTagCaption(captionTag));
          form.set('evidenceResultId', id);
          if (productId) form.set('productId', productId);
          await api.upload<{ id: string }>('/api/admin/media/upload', form);
        } catch (e) {
          failures.push(`${files[i].name}: ${e instanceof Error ? e.message : 'upload failed'}`);
        }
      }
      await reload(id);
      onUploaded?.();
    } catch (e) {
      failures.push(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadProgress(null);
      if (fileInput.current) fileInput.current.value = '';
      const notes = [...failures];
      if (skipped > 0) notes.push(`${skipped} unsupported file${skipped === 1 ? '' : 's'} skipped.`);
      if (notes.length > 0) setError(notes.join(' · '));
    }
  }

  async function attachExisting(mediaId: string) {
    setError(null);
    try {
      const id = await resolveResultId();
      const patch: Record<string, unknown> = {};
      if (captionTag) patch.caption = proofTagCaption(captionTag);
      await dataApi.update('media', mediaId, patch, { evidenceResult: id });
      setShowPicker(false);
      await reload(id);
      onUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not attach media');
    }
  }

  async function updateMediaMeta(mediaId: string, patch: { altText?: string; caption?: string }) {
    setError(null);
    try {
      await dataApi.update('media', mediaId, patch);
      await reload();
      onUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update media');
    }
  }

  function saveCaption(media: EntityRow, userCaption: string) {
    if (captionTag) {
      const next = proofTagCaption(captionTag, userCaption);
      if (next !== String(media.caption ?? '')) {
        void updateMediaMeta(media.id, { caption: next });
      }
      return;
    }
    if (userCaption !== String(media.caption ?? '')) {
      void updateMediaMeta(media.id, { caption: userCaption });
    }
  }

  async function detach(mediaId: string) {
    setError(null);
    try {
      await dataApi.update('media', mediaId, {}, { evidenceResult: null });
      await reload();
      onUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove attachment');
    }
  }

  const requiredCount = captionTag ? 0 : requirements.length;
  const attachedCount = attachments.length;

  return (
    <div
      className={`relative rounded-md border transition-colors ${
        embedded ? 'p-2' : 'p-3'
      } ${
        dragging
          ? 'border-pink-400 bg-pink-50/60 dark:border-pink-600 dark:bg-pink-950/20'
          : 'border-slate-200 dark:border-slate-700'
      }`}
      onDragEnter={(e) => {
        if (disabled || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        if (disabled || !e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-pink-400 bg-pink-50/90 dark:bg-pink-950/60">
          <p className="flex items-center gap-1.5 text-sm font-medium text-pink-700 dark:text-pink-300">
            <Icon name="upload" className="!text-[18px]" /> Drop to upload evidence
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`font-semibold uppercase tracking-wide text-slate-400 ${embedded ? 'text-[10px]' : 'text-xs'}`}>
          Evidence
          {loading && attachments.length === 0 && (
            <span className="ml-1.5 font-normal normal-case text-slate-400">Loading…</span>
          )}
        </p>
        {requiredCount > 0 && (
          <span
            className={`text-xs font-medium ${
              attachedCount >= requiredCount ? 'text-green-600' : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            {Math.min(attachedCount, requiredCount)} of {requiredCount} required attachment
            {requiredCount === 1 ? '' : 's'} uploaded
          </span>
        )}
        {!requiredCount && attachedCount > 0 && (
          <span className="text-[10px] font-medium text-slate-400">
            {attachedCount} file{attachedCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {!embedded && requirements.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500">
          {requirements.map((r, i) => (
            <li key={i}>
              • {r.description} <span className="text-slate-400">({r.type})</span>
            </li>
          ))}
        </ul>
      )}

      {attachments.length > 0 && (
        <ul className={`space-y-1.5 ${embedded ? 'mt-1.5' : 'mt-2'}`}>
          {attachments.map((m) => {
            const captionValue = captionTag
              ? parseProofCaption(m.caption).userCaption
              : String(m.caption ?? '');
            return (
              <li
                key={m.id}
                className="space-y-2 rounded-md bg-slate-50 px-2 py-2 dark:bg-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <ProofThumb media={m} size="sm" disabled={disabled} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                    {displayCaption(m.caption, m.altText) || m.url?.split('/').pop() || m.mediaType}
                  </span>
                  {m.url && (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs font-medium text-pink-600 hover:underline"
                    >
                      View
                    </a>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      aria-label="Remove attachment"
                      onClick={() => void detach(m.id)}
                      className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-700"
                    >
                      <Icon name="close" className="!text-[16px]" />
                    </button>
                  )}
                </div>
                {!disabled && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block text-[11px] text-slate-500">
                      Alt text
                      <TextInput
                        className="mt-0.5 !py-1 text-xs"
                        defaultValue={String(m.altText ?? '')}
                        placeholder="Describe the image"
                        onBlur={(e) => {
                          if (e.target.value !== String(m.altText ?? '')) {
                            void updateMediaMeta(m.id, { altText: e.target.value });
                          }
                        }}
                      />
                    </label>
                    <label className="block text-[11px] text-slate-500">
                      Caption
                      <TextInput
                        className="mt-0.5 !py-1 text-xs"
                        defaultValue={captionValue}
                        placeholder="Optional caption"
                        onBlur={(e) => saveCaption(m, e.target.value)}
                      />
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!disabled && (
        <div className={`flex flex-wrap items-center gap-2 ${embedded ? 'mt-1.5' : 'mt-2'}`}>
          <Button
            type="button"
            variant="secondary"
            className="!py-1 text-xs"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            <Icon name="upload" className="!text-[15px]" /> Upload media
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="!py-1 text-xs"
            disabled={uploading}
            onClick={() => setShowPicker(true)}
          >
            Choose existing
          </Button>
          {!embedded && (
            <span className="text-[11px] text-slate-400">or drag files here</span>
          )}
          {uploadProgress && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-pink-600" />
              {uploadProgress.total > 1
                ? `Uploading ${Math.min(uploadProgress.done + 1, uploadProgress.total)} of ${uploadProgress.total}…`
                : 'Uploading…'}
            </span>
          )}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) void handleFiles(e.target.files);
        }}
      />

      {showPicker && (
        <MediaPickerModal
          productId={productId}
          excludeIds={attachments.map((m) => m.id)}
          onSelect={(id) => void attachExisting(id)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
