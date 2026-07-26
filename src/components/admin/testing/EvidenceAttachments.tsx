// Proof attachments for one evidence result: upload media (single or bulk,
// via button or drag-and-drop) or attach existing product media directly from
// the test card. Uploads are automatically linked to the product and evidence
// result (role "proof", internal-only by default) and appear in the product
// Media tab.

import { useEffect, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import { Button, Icon } from '../ui';
import { MediaPickerModal } from '../MediaPicker';
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
}: {
  def: EntityRow;
  /** Saved evidence-result id, if the result exists yet. */
  resultId: string | null;
  productId?: string;
  /** Creates the result record on first upload so media can link to it. */
  ensureResultId: () => Promise<string>;
  disabled?: boolean;
}) {
  const [attachments, setAttachments] = useState<EntityRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // Drag events fire enter/leave for every child; count to avoid flicker.
  const dragDepth = useRef(0);

  const requirements = evidenceRequirements(def);
  const uploading = uploadProgress !== null;

  async function reload(id: string | null = resultId) {
    if (!id) return;
    try {
      const res = await dataApi.list('media');
      setAttachments(res.rows.filter((m) => m.evidenceResult?.id === id && !m.deletedAt));
    } catch {
      /* non-fatal */
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId]);

  /** Uploads one or many files sequentially (button pick or drag-and-drop). */
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
      const id = await ensureResultId();
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ done: i, total: files.length });
        try {
          const form = new FormData();
          form.set('file', files[i]);
          form.set('adult', '0');
          form.set('role', 'proof');
          form.set('altText', `Evidence: ${def.name}`);
          form.set('evidenceResultId', id);
          if (productId) form.set('productId', productId);
          await api.upload<{ id: string }>('/api/admin/media/upload', form);
        } catch (e) {
          failures.push(`${files[i].name}: ${e instanceof Error ? e.message : 'upload failed'}`);
        }
      }
      await reload(id);
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
      const id = await ensureResultId();
      await dataApi.update('media', mediaId, {}, { evidenceResult: id });
      setShowPicker(false);
      await reload(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not attach media');
    }
  }

  async function detach(mediaId: string) {
    setError(null);
    try {
      await dataApi.update('media', mediaId, {}, { evidenceResult: null });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove attachment');
    }
  }

  const requiredCount = requirements.length;
  const attachedCount = attachments.length;

  return (
    <div
      className={`relative rounded-md border p-3 transition-colors ${
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
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Evidence</p>
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
      </div>

      {requirements.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500">
          {requirements.map((r, i) => (
            <li key={i}>
              • {r.description} <span className="text-slate-400">({r.type})</span>
            </li>
          ))}
        </ul>
      )}

      {attachments.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {attachments.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {m.mediaType === 'image' && m.url ? (
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Icon name={m.mediaType === 'video' ? 'videocam' : 'description'} className="!text-[18px] text-slate-400" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                  {m.altText || m.caption || m.url?.split('/').pop() || m.mediaType}
                </span>
                <span className="block text-[11px] text-slate-400">
                  {m.approved ? 'Approved for public evidence' : 'Internal evidence'}
                </span>
              </span>
              {m.url && (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-pink-600 hover:underline"
                >
                  View
                </a>
              )}
              {!disabled && (
                <button
                  type="button"
                  aria-label="Remove attachment"
                  onClick={() => void detach(m.id)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-700"
                >
                  <Icon name="close" className="!text-[16px]" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
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
            Choose existing media
          </Button>
          <span className="text-[11px] text-slate-400">or drag files here (multiple supported)</span>
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
