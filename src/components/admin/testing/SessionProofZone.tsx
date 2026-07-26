// Session-level proof drop zone: bulk upload with a picker for which question
// each batch attaches to.

import { useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import { Icon, Select } from '../ui';
import { testerQuestion } from './presentation';
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

export function SessionProofZone({
  items,
  categorySlug,
  runId,
  productId,
  resultByDef,
  onUploaded,
}: {
  items: SessionItem[];
  categorySlug?: string;
  runId: string;
  productId?: string;
  resultByDef: Map<string, EntityRow>;
  onUploaded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [targetDefId, setTargetDefId] = useState(items[0]?.def.id ?? '');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

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

  async function uploadFiles(files: FileList | File[]) {
    if (!targetDefId) return;
    const def = items.find(({ def: d }) => d.id === targetDefId)?.def;
    if (!def) return;
    const accepted = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (accepted.length === 0) {
      setError('Only PNG/JPEG/WebP/GIF images and MP4/WebM videos are supported.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const resultId = await ensureResultId(targetDefId);
      for (const file of accepted) {
        const form = new FormData();
        form.set('file', file);
        form.set('adult', '0');
        form.set('role', 'proof');
        form.set('altText', `Evidence: ${def.name}`);
        form.set('evidenceResultId', resultId);
        if (productId) form.set('productId', productId);
        await api.upload<{ id: string }>('/api/admin/media/upload', form);
      }
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
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
          Session proof (optional bulk upload)
        </span>
        <Icon name="expand_more" className={`!text-[18px] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-500">Attach to</label>
            <Select
              className="!py-1 text-xs"
              value={targetDefId}
              onChange={(e) => setTargetDefId(e.target.value)}
            >
              {items.map(({ def }) => (
                <option key={def.id} value={def.id}>
                  {testerQuestion(def, categorySlug)}
                </option>
              ))}
            </Select>
          </div>
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
              if (e.dataTransfer.files.length > 0) void uploadFiles(e.dataTransfer.files);
            }}
          >
            <Icon name="cloud_upload" className="testing-icon-accent !text-[28px] opacity-70" />
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Drop screenshots here for the selected question
            </p>
            <button
              type="button"
              disabled={busy}
              className="testing-link mt-2 text-xs font-medium hover:underline disabled:opacity-50"
              onClick={() => fileInput.current?.click()}
            >
              {busy ? 'Uploading…' : 'Or choose files'}
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void uploadFiles(e.target.files);
              }}
            />
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
