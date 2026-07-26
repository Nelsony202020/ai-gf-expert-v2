// Media tab: product-scoped media manager with three sub-tabs — Public
// gallery, Testing evidence, and Product assets. Reuses the shared media
// entity and upload API; the global media library remains available.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, dataApi, type EntityRow } from '../../api';
import { useCan } from '../../context';
import {
  Badge,
  Button,
  ErrorNote,
  Field,
  Icon,
  Modal,
  Select,
  TextInput,
  Toggle,
  fmtDate,
  useAsync,
} from '../../ui';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';

const SUB_TABS = ['Public gallery', 'Testing evidence', 'Product assets'] as const;
type SubTab = (typeof SUB_TABS)[number];

const GALLERY_ROLES = ['gallery', 'character', 'hero'];
const ASSET_ROLES = ['logo', 'featured'];

export function MediaTab() {
  const ws = useWorkspace();
  const can = useCan();
  const [subTab, setSubTab] = useState<SubTab>('Public gallery');
  const [editing, setEditing] = useState<EntityRow | null>(null);
  const [evidenceResults, setEvidenceResults] = useState<EntityRow[]>([]);
  const { error, setError } = useAsync();
  const canEdit = can('content.edit');

  const media = ws.related.media;

  useEffect(() => {
    // Needed to resolve testing-evidence attachments to run/category/definition.
    dataApi
      .list('evidenceResults')
      .then((r) => setEvidenceResults(r.rows.filter((row) => row.product?.id === ws.productId)))
      .catch(() => {});
  }, [ws.productId]);

  const galleryMedia = useMemo(
    () =>
      media
        .filter((m) => GALLERY_ROLES.includes(m.role ?? 'gallery') && !m.evidenceResult)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [media],
  );
  const evidenceMedia = useMemo(
    () => media.filter((m) => m.role === 'proof' || m.evidenceResult),
    [media],
  );
  const assetMedia = useMemo(() => media.filter((m) => ASSET_ROLES.includes(m.role ?? '')), [media]);

  async function updateMedia(id: string, fields: Record<string, unknown>) {
    try {
      await dataApi.update('media', id, fields);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function removeMedia(row: EntityRow) {
    if (!confirm('Remove this media item? (Soft delete — restorable from the global library.)')) return;
    try {
      await dataApi.remove('media', row.id);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /** Persist a new gallery order after drag-and-drop. */
  async function reorderGallery(fromId: string, toId: string) {
    const ordered = [...galleryMedia];
    const fromIdx = ordered.findIndex((m) => m.id === fromId);
    const toIdx = ordered.findIndex((m) => m.id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    try {
      await Promise.all(ordered.map((m, i) => dataApi.update('media', m.id, { sortOrder: i })));
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_250px]">
      <div className="space-y-4">
        {error && <ErrorNote message={error} />}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
            {SUB_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSubTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  subTab === t
                    ? 'bg-pink-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {subTab === 'Public gallery' && (
          <>
            {canEdit && <UploadPanel role="gallery" label="Upload gallery image or video" />}
            {galleryMedia.length === 0 ? (
              <EmptyMediaState note="No public gallery media yet. Uploads here appear on the review page after approval." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {galleryMedia.map((m) => (
                  <MediaCard
                    key={m.id}
                    row={m}
                    canEdit={canEdit}
                    draggable
                    onDropOn={(fromId) => void reorderGallery(fromId, m.id)}
                    onEdit={() => setEditing(m)}
                    onApprove={(v) => void updateMedia(m.id, { approved: v })}
                    onRemove={() => void removeMedia(m)}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">
              Drag cards to reorder. 18+ media stays age-gated on the public site.
            </p>
          </>
        )}

        {subTab === 'Testing evidence' && (
          <>
            <p className="text-xs text-slate-500">
              Attachments linked to test runs and evidence results. Evidence media never appears in
              the public gallery automatically — the “public evidence” flag only exposes it inside
              the published evidence section.
            </p>
            {canEdit && (
              <UploadPanel role="proof" label="Upload evidence screenshot, recording, or source" evidenceResults={evidenceResults} />
            )}
            {evidenceMedia.length === 0 ? (
              <EmptyMediaState note="No testing-evidence media yet." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-700">
                      <th className="px-3 py-2">Preview</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Linked evidence</th>
                      <th className="px-3 py-2">Internal note</th>
                      <th className="px-3 py-2">Public evidence</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceMedia.map((m) => {
                      const result = evidenceResults.find((r) => r.id === m.evidenceResult?.id);
                      return (
                        <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2">
                            <MediaThumb row={m} className="h-10 w-14" />
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {m.mediaType === 'video' ? 'Recording' : 'Screenshot'}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {result ? (
                              <>
                                <span className="font-medium">
                                  {result.evidenceDefinition?.name ?? 'Evidence'}
                                </span>
                                <span className="text-slate-400"> · {result.testRun?.name ?? 'run'}</span>
                              </>
                            ) : (
                              <span className="text-slate-400">Unlinked proof</span>
                            )}
                          </td>
                          <td className="max-w-48 truncate px-3 py-2 text-xs text-slate-500">
                            {m.caption || '—'}
                          </td>
                          <td className="px-3 py-2">
                            {canEdit ? (
                              <Toggle
                                checked={m.approved}
                                onChange={(v) => void updateMedia(m.id, { approved: v })}
                                aria-label="Public evidence"
                              />
                            ) : (
                              <Badge tone={m.approved ? 'green' : 'gray'}>
                                {m.approved ? 'public' : 'internal only'}
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {canEdit && (
                              <Button variant="ghost" className="text-xs" onClick={() => setEditing(m)}>
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {subTab === 'Product assets' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <AssetSlot label="Logo" mediaId={ws.links.logo} media={media} fixTo="setup" />
              <AssetSlot label="Featured image" mediaId={ws.links.featuredImage} media={media} fixTo="setup" />
              <AssetField label="Social / Open Graph image" value={ws.fields.ogImageUrl} fixTo="seo" />
              <AssetField label="YouTube review" value={ws.fields.youtubeReviewUrl} fixTo="setup" />
            </div>
            {canEdit && <UploadPanel role="hero" label="Upload app screenshot" />}
            {assetMedia.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Uploaded asset files
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {assetMedia.map((m) => (
                    <MediaCard
                      key={m.id}
                      row={m}
                      canEdit={canEdit}
                      onEdit={() => setEditing(m)}
                      onApprove={(v) => void updateMedia(m.id, { approved: v })}
                      onRemove={() => void removeMedia(m)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CompletionSidebar />

      {editing && (
        <MediaEditModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void ws.refreshRelated();
          }}
        />
      )}
    </div>
  );
}

function EmptyMediaState({ note }: { note: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
      {note}
    </div>
  );
}

function MediaThumb({ row, className = 'h-24 w-full' }: { row: EntityRow; className?: string }) {
  if (row.mediaType === 'video') {
    return (
      <div className={`flex items-center justify-center rounded-md bg-slate-900 ${className}`}>
        <Icon name="play_circle" className="!text-[24px] text-white/80" />
      </div>
    );
  }
  return row.url ? (
    <img src={row.url} alt={row.altText ?? ''} className={`rounded-md object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 ${className}`}>
      <Icon name="image" className="!text-[20px] text-slate-300" />
    </div>
  );
}

function MediaCard({
  row,
  canEdit,
  draggable,
  onDropOn,
  onEdit,
  onApprove,
  onRemove,
}: {
  row: EntityRow;
  canEdit: boolean;
  draggable?: boolean;
  onDropOn?: (fromId: string) => void;
  onEdit: () => void;
  onApprove: (v: boolean) => void;
  onRemove: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      draggable={draggable && canEdit}
      onDragStart={(e) => e.dataTransfer.setData('text/media-id', row.id)}
      onDragOver={(e) => {
        if (!onDropOn) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const fromId = e.dataTransfer.getData('text/media-id');
        if (fromId && fromId !== row.id) onDropOn?.(fromId);
      }}
      className={`rounded-lg border bg-white p-2 shadow-sm transition-colors dark:bg-slate-900 ${
        dragOver ? 'border-pink-400' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <MediaThumb row={row} />
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <Badge tone={row.adult ? 'red' : 'green'}>{row.adult ? '18+' : 'Safe'}</Badge>
        <Badge tone={row.approved ? 'green' : 'amber'}>{row.approved ? 'approved' : 'pending'}</Badge>
        {row.role === 'character' && <Badge tone="pink">character</Badge>}
      </div>
      <p className="mt-1 truncate text-xs text-slate-500" title={row.altText ?? ''}>
        {row.altText || <span className="text-amber-600">No alt text</span>}
      </p>
      {canEdit && (
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Edit media" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={onEdit}>
              <Icon name="edit" className="!text-[16px]" />
            </button>
            <button type="button" aria-label="Remove media" className="text-slate-400 hover:text-red-600" onClick={onRemove}>
              <Icon name="delete" className="!text-[16px]" />
            </button>
          </div>
          <Toggle checked={row.approved} onChange={onApprove} aria-label="Approved" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload panel (product-scoped, optional evidence-result link)
// ---------------------------------------------------------------------------

function UploadPanel({
  role,
  label,
  evidenceResults,
}: {
  role: string;
  label: string;
  evidenceResults?: EntityRow[];
}) {
  const ws = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [adult, setAdult] = useState(false);
  const [evidenceResultId, setEvidenceResultId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { error, setError } = useAsync();

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set('file', file);
        form.set('adult', adult ? '1' : '0');
        form.set('role', role);
        form.set('productId', ws.productId);
        if (evidenceResultId) form.set('evidenceResultId', evidenceResultId);
        await api.upload('/api/admin/media/upload', form);
      }
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      {error && <ErrorNote message={error} />}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 transition-colors ${
          dragOver
            ? 'border-pink-400 bg-pink-50/60 dark:border-pink-700 dark:bg-pink-950/20'
            : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900/40'
        }`}
      >
        <Icon name="upload" className="!text-[20px] text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {dragOver ? 'Drop files here' : label}
          </p>
          <p className="text-xs text-slate-400">Images or video • Max 50MB · new uploads start unapproved</p>
        </div>
        {evidenceResults && evidenceResults.length > 0 && (
          <Select
            value={evidenceResultId}
            onChange={(e) => setEvidenceResultId(e.target.value)}
            className="max-w-52 text-xs"
            aria-label="Link to evidence result"
          >
            <option value="">Link to evidence… (optional)</option>
            {evidenceResults.map((r) => (
              <option key={r.id} value={r.id}>
                {r.evidenceDefinition?.name ?? r.id} · {r.testRun?.name ?? ''}
              </option>
            ))}
          </Select>
        )}
        <Toggle checked={adult} onChange={setAdult} label="18+" />
        <Button variant="secondary" className="text-xs" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Choose files'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit modal: alt text, caption, credit, flags
// ---------------------------------------------------------------------------

function MediaEditModal({
  row,
  onClose,
  onSaved,
}: {
  row: EntityRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [altText, setAltText] = useState(String(row.altText ?? ''));
  const [caption, setCaption] = useState(String(row.caption ?? ''));
  const [credit, setCredit] = useState(String(row.credit ?? ''));
  const [adult, setAdult] = useState(Boolean(row.adult));
  const [ageGated, setAgeGated] = useState(Boolean(row.ageGated));
  const [approved, setApproved] = useState(Boolean(row.approved));
  const { busy, error, run } = useAsync();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      await dataApi.update('media', row.id, {
        altText: altText || undefined,
        caption: caption || undefined,
        credit: credit || undefined,
        adult,
        ageGated: adult ? true : ageGated,
        approved,
      });
      return true;
    });
    if (done) onSaved();
  }

  return (
    <Modal title="Edit media" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        {error && <ErrorNote message={error} />}
        <div className="flex justify-center">
          <MediaThumb row={row} className="h-32 w-auto max-w-full" />
        </div>
        <Field label="Alt text" help="Describes the image for screen readers and SEO.">
          <TextInput value={altText} onChange={(e) => setAltText(e.target.value)} />
        </Field>
        <Field label="Caption / internal note">
          <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} />
        </Field>
        <Field label="Credit">
          <TextInput value={credit} onChange={(e) => setCredit(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-6">
          <Toggle checked={adult} onChange={setAdult} label="18+ content" />
          <Toggle checked={adult ? true : ageGated} onChange={setAgeGated} label="Age-gated" />
          <Toggle checked={approved} onChange={setApproved} label="Approved" />
        </div>
        <p className="text-xs text-slate-400">Uploaded {fmtDate(row.createdAt)} by {row.uploadedBy ?? 'unknown'}.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Product assets helpers
// ---------------------------------------------------------------------------

function AssetSlot({
  label,
  mediaId,
  media,
  fixTo,
}: {
  label: string;
  mediaId: string | null | undefined;
  media: EntityRow[];
  fixTo: string;
}) {
  const ws = useWorkspace();
  const row = mediaId ? ws.related.mediaAll.find((m) => m.id === mediaId) : undefined;
  void media;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      {row ? (
        <MediaThumb row={row} className="h-12 w-12" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
          <Icon name="image" className="!text-[18px] text-slate-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="truncate text-xs text-slate-400">{row ? row.altText || 'Set' : 'Not set'}</p>
      </div>
      <Link to={`/products/${ws.productId}/${fixTo}`} className="text-xs font-medium text-pink-600 hover:underline">
        Manage
      </Link>
    </div>
  );
}

function AssetField({ label, value, fixTo }: { label: string; value?: string; fixTo: string }) {
  const ws = useWorkspace();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
        <Icon name={value ? 'check' : 'link_off'} className={`!text-[18px] ${value ? 'text-green-600' : 'text-slate-300'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="truncate text-xs text-slate-400">{value || 'Not set'}</p>
      </div>
      <Link to={`/products/${ws.productId}/${fixTo}`} className="text-xs font-medium text-pink-600 hover:underline">
        Manage
      </Link>
    </div>
  );
}
