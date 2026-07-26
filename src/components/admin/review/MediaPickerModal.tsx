// Media picker for the review editor: choose an existing image from the
// media library (thumbnail grid + search, product images first) or upload a
// new one. Returns { id, url, altText } for insertion as an image node.

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../api';
import { Button, ErrorNote, Field, Icon, Modal, Spinner, TextInput, Toggle } from '../ui';

export interface PickedMedia {
  id: string;
  url: string;
  altText: string;
}

export function MediaPickerModal({
  productId,
  onClose,
  onSelect,
}: {
  productId: string;
  onClose: () => void;
  onSelect: (media: PickedMedia) => void;
}) {
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [productOnly, setProductOnly] = useState(true);

  // Upload form state
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadAdult, setUploadAdult] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    dataApi
      .list('media')
      .then((r) => {
        if (!cancelled) setRows(r.rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const images = useMemo(() => {
    const all = (rows ?? []).filter((m) => m.mediaType === 'image' && m.url);
    const scoped = productOnly ? all.filter((m) => m.product?.id === productId) : all;
    const q = search.trim().toLowerCase();
    const filtered = q
      ? scoped.filter((m) =>
          [m.altText, m.caption, m.credit, m.role, m.url]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(q)),
        )
      : scoped;
    return [...filtered].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [rows, productOnly, productId, search]);

  function mediaLabel(m: EntityRow): string {
    return String(m.altText || m.caption || 'Untitled image');
  }

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('adult', uploadAdult ? '1' : '0');
      form.set('altText', uploadAlt);
      form.set('role', 'gallery');
      form.set('productId', productId);
      const created = await api.upload<{ id: string; url?: string }>('/api/admin/media/upload', form);
      onSelect({ id: created.id, url: created.url ?? '', altText: uploadAlt });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal title="Insert image" onClose={onClose} wide>
      <div className="space-y-4">
        {error && <ErrorNote message={error} />}

        <div className="flex flex-wrap items-center gap-3">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by alt text, caption, credit…"
            className="max-w-xs"
          />
          <Toggle
            checked={productOnly}
            onChange={setProductOnly}
            label="This product only"
          />
        </div>

        {rows === null ? (
          <Spinner />
        ) : images.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
            No matching images{productOnly ? ' for this product' : ''}. Upload one below.
          </p>
        ) : (
          <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
            {images.map((m) => (
              <button
                key={m.id}
                type="button"
                title={mediaLabel(m)}
                onClick={() =>
                  onSelect({ id: m.id, url: String(m.url), altText: String(m.altText ?? '') })
                }
                className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 hover:border-pink-400 focus:border-pink-500 focus:outline-none dark:border-slate-700"
              >
                <img
                  src={String(m.url)}
                  alt={mediaLabel(m)}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-left text-[11px] text-white">
                  {mediaLabel(m)}
                </span>
                {m.adult && (
                  <span className="absolute right-1 top-1 rounded bg-red-600 px-1 text-[10px] font-semibold text-white">
                    18+
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Icon name="upload" className="!text-[15px]" /> Upload new image
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
            />
            <Field label="Alt text (describes the image)">
              <TextInput
                value={uploadAlt}
                onChange={(e) => setUploadAlt(e.target.value)}
                placeholder="e.g. Character creation screen"
              />
            </Field>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Toggle checked={uploadAdult} onChange={setUploadAdult} label="Adult content (18+)" />
            <Button onClick={() => void upload()} disabled={uploading} className="text-xs">
              {uploading ? 'Uploading…' : 'Upload and insert'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
