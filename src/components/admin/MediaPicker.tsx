// Shared visual media picker: thumbnails, readable labels, search, and a
// product-only filter. Never shows raw media IDs as the primary label.

import { useEffect, useState } from 'react';
import { dataApi, type EntityRow } from './api';
import { Icon, Modal, TextInput } from './ui';

/** Visual picker over existing media (thumbnails, not raw IDs). */
export function MediaPickerModal({
  productId,
  excludeIds,
  onSelect,
  onClose,
}: {
  productId?: string;
  excludeIds: string[];
  onSelect: (mediaId: string) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<EntityRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [productOnly, setProductOnly] = useState(Boolean(productId));

  useEffect(() => {
    dataApi
      .list('media')
      .then((r) => setRows(r.rows.filter((m) => !m.deletedAt)))
      .catch(() => setRows([]));
  }, []);

  const filtered = (rows ?? [])
    .filter((m) => !excludeIds.includes(m.id))
    .filter((m) => !productOnly || !productId || m.product?.id === productId)
    .filter((m) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [m.altText, m.caption, m.url].some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
    })
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 60);

  return (
    <Modal title="Choose existing media" onClose={onClose} wide>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <TextInput
          placeholder="Search by title or caption…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {productId && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
              checked={productOnly}
              onChange={(e) => setProductOnly(e.target.checked)}
            />
            This product only
          </label>
        )}
      </div>
      {rows === null ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading media…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No matching media found.</p>
      ) : (
        <ul className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                className="w-full overflow-hidden rounded-lg border border-slate-200 text-left transition-colors hover:border-pink-400 dark:border-slate-700"
              >
                <span className="flex h-20 w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                  {m.mediaType === 'image' && m.url ? (
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name={m.mediaType === 'video' ? 'videocam' : 'description'} className="!text-[24px] text-slate-400" />
                  )}
                </span>
                <span className="block truncate px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {m.altText || m.caption || m.mediaType}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
