// Media tab: unified product media library. Default view is "All" — public
// gallery, testing evidence, and product assets in one grid with a section
// badge on each card. Filter by section via dropdown; layout is identical
// for every filter.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, dataApi, type EntityRow } from '../../api';
import { useCan } from '../../context';
import {
  Badge,
  Button,
  Field,
  Icon,
  Modal,
  Select,
  TextInput,
  Toggle,
  fmtDate,
  inputClass,
} from '../../ui';
import { useAsyncToast, useToast } from '../../Toast';
import { ConfirmDialog } from '../../ConfirmDialog';
import { useWorkspace } from '../context';
import { CompletionSidebar } from '../CompletionSidebar';
import { MediaRoleFields } from './MediaRoleFields';
import { MediaPreviewLightbox, MediaPreviewThumb, MediaThumb } from './MediaPreviewLightbox';
import {
  getMediaPlacement,
  getMediaTags,
  isAssetMedia,
  isHeroMedia,
  isPricingProofMedia,
  pricingProofMediaPatch,
  pricingProofPlacementLabel,
  readMediaRoleState,
  sortHeroMedia,
  tagLabels,
  writeMediaRoleState,
  heroSortOrderUpdates,
  type MediaRoleState,
} from '../../../../lib/media/catalog';
import { pricingProofVisibleInLibrary } from '../../../../lib/media/pricingProofLibrary';
import {
  altTextForUpdate,
  displayAltText,
  isMissingAltText,
  isPlaceholderAltText,
  isUsableAltSuggestion,
} from '../../../../lib/media/altText';


const ASSET_ROLES = ['logo', 'featured'];

type MediaSection = 'gallery' | 'evidence' | 'assets';

const ALL_SECTIONS: MediaSection[] = ['gallery', 'evidence', 'assets'];

const SECTION_LABELS: Record<MediaSection, string> = {
  gallery: 'Public gallery',
  evidence: 'Testing evidence',
  assets: 'Product assets',
};

function sectionFilterLabel(filters: Set<MediaSection>): string {
  if (filters.size === 0) return 'None';
  if (filters.size === ALL_SECTIONS.length) return 'All';
  if (filters.size === 1) return SECTION_LABELS[[...filters][0]!];
  return `${filters.size} sections`;
}

function mediaSection(row: EntityRow): MediaSection {
  if (getMediaPlacement(row) === 'proof') return 'evidence';
  if (isAssetMedia(row)) return 'assets';
  return 'gallery';
}

function placementLabel(row: EntityRow): string {
  const placement = getMediaPlacement(row);
  if (placement === 'proof' && isPricingProofMedia(row)) {
    return pricingProofPlacementLabel();
  }
  const tags = tagLabels(getMediaTags(row));
  const base = placement === 'proof' ? 'Proof' : 'Gallery';
  return tags.length > 0 ? `${base} · ${tags.join(', ')}` : base;
}

function sectionBadgeTone(section: MediaSection): 'pink' | 'blue' | 'gray' {
  if (section === 'gallery') return 'pink';
  if (section === 'evidence') return 'blue';
  return 'gray';
}

// Videos are not a category — mediaType === 'video' is detected automatically.

type AltFilter = 'all' | 'no-alt' | 'adult' | 'safe';
type ViewMode = 'grid' | 'list';

type AiReviewItem = { mediaId: string; row: EntityRow; suggested: string };

type AiReviewState = {
  items: AiReviewItem[];
  phase: 'choose' | 'review';
  reviewIndex: number;
  edits: Record<string, string>;
  skipped: Set<string>;
};

export function MediaTab() {
  const ws = useWorkspace();
  const can = useCan();
  const [sectionFilters, setSectionFilters] = useState<Set<MediaSection>>(() => new Set(ALL_SECTIONS));
  const [editQueue, setEditQueue] = useState<string[] | null>(null);
  const [evidenceResults, setEvidenceResults] = useState<EntityRow[]>([]);
  const [altFilter, setAltFilter] = useState<AltFilter>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReview, setAiReview] = useState<AiReviewState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: 'one'; row: EntityRow } | { kind: 'bulk'; count: number } | null>(null);
  const [previewRow, setPreviewRow] = useState<EntityRow | null>(null);
  const altInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const { setError } = useAsyncToast();
  const toast = useToast();
  const canEdit = can('content.edit');

  const media = useMemo(
    () =>
      ws.related.media.filter((row) =>
        pricingProofVisibleInLibrary(row, ws.related.pricingSnapshots),
      ),
    [ws.related.media, ws.related.pricingSnapshots],
  );

  const allMedia = useMemo(
    () =>
      [...media].sort((a, b) => {
        const sectionOrder = { gallery: 0, evidence: 1, assets: 2 };
        const sa = sectionOrder[mediaSection(a)];
        const sb = sectionOrder[mediaSection(b)];
        if (sa !== sb) return sa - sb;
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      }),
    [media],
  );

  const galleryMedia = useMemo(
    () => allMedia.filter((m) => mediaSection(m) === 'gallery'),
    [allMedia],
  );

  const heroMedia = useMemo(
    () => sortHeroMedia(allMedia.filter((m) => isHeroMedia(m))),
    [allMedia],
  );

  const visibleMedia = useMemo(() => {
    if (sectionFilters.size === 0) return [];
    if (sectionFilters.size === ALL_SECTIONS.length) return allMedia;
    return allMedia.filter((m) => sectionFilters.has(mediaSection(m)));
  }, [allMedia, sectionFilters]);

  const canReorderGallery =
    sectionFilters.has('gallery') || sectionFilters.size === ALL_SECTIONS.length;

  const filteredMedia = useMemo(
    () =>
      visibleMedia.filter((m) => {
        if (altFilter === 'no-alt') return isMissingAltText(m.altText);
        if (altFilter === 'adult') return Boolean(m.adult);
        if (altFilter === 'safe') return !m.adult;
        return true;
      }),
    [visibleMedia, altFilter],
  );

  useEffect(() => {
    dataApi
      .list('evidenceResults')
      .then((r) => setEvidenceResults(r.rows.filter((row) => row.product?.id === ws.productId)))
      .catch(() => {});
  }, [ws.productId]);

  const queueRows = useMemo(
    () =>
      editQueue
        ? editQueue.map((id) => media.find((m) => m.id === id)).filter((m): m is EntityRow => Boolean(m))
        : null,
    [editQueue, media],
  );

  async function updateMedia(id: string, fields: Record<string, unknown>) {
    try {
      await dataApi.update('media', id, fields);
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function removeMedia(row: EntityRow) {
    try {
      await dataApi.remove('media', row.id);
      await ws.refreshRelated();
      setDeleteConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function removeSelected() {
    if (selected.size === 0) return;
    try {
      await Promise.all([...selected].map((id) => dataApi.remove('media', id)));
      setSelected(new Set());
      await ws.refreshRelated();
      setDeleteConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function applyBulkEdit(patch: { altText?: string; caption?: string }) {
    const fields: Record<string, unknown> = {};
    if (patch.altText?.trim()) fields.altText = patch.altText.trim();
    if (patch.caption?.trim()) fields.caption = patch.caption.trim();
    if (Object.keys(fields).length === 0) return;
    try {
      await Promise.all([...selected].map((id) => dataApi.update('media', id, fields)));
      setBulkEditOpen(false);
      setSelected(new Set());
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const missingAltCount = useMemo(
    () => visibleMedia.filter((m) => isMissingAltText(m.altText)).length,
    [visibleMedia],
  );

  const registerAltInput = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) altInputRefs.current.set(id, el);
    else altInputRefs.current.delete(id);
  }, []);

  const focusAltInput = useCallback(
    (id: string) => {
      altInputRefs.current.get(id)?.focus();
    },
    [],
  );

  const tabBetweenAlt = useCallback(
    (id: string, direction: 'next' | 'prev') => {
      const ids = filteredMedia.map((m) => m.id);
      const idx = ids.indexOf(id);
      if (idx < 0) return;
      const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
      if (nextIdx >= 0 && nextIdx < ids.length) focusAltInput(ids[nextIdx]!);
    },
    [filteredMedia, focusAltInput],
  );

  async function applyAltTextUpdates(updates: Array<{ mediaId: string; altText: string }>) {
    const usable = updates.filter((u) => isUsableAltSuggestion(u.altText));
    if (usable.length === 0) return;
    await Promise.all(
      usable.map((u) => dataApi.update('media', u.mediaId, { altText: altTextForUpdate(u.altText) })),
    );
    await ws.refreshRelated();
    toast.success(`Updated alt text on ${usable.length} item${usable.length === 1 ? '' : 's'}`);
  }

  async function aiAltTextSelected(explicitIds?: string[]) {
    const ids = (explicitIds ?? [...selected]).filter((id) => {
      const row = media.find((m) => m.id === id);
      return row && row.mediaType !== 'video';
    });
    if (ids.length === 0) {
      setError('Select at least one image (videos are skipped).');
      return;
    }
    setError(null);
    setAiBusy(true);
    try {
      const { altTexts } = await api.post<{ altTexts: Array<{ mediaId: string; altText: string }> }>(
        '/api/admin/ai-alt-text/generate',
        { productId: ws.productId, mediaIds: ids },
      );
      const byId = new Map(altTexts.map((a) => [a.mediaId, a.altText]));
      const items: AiReviewItem[] = ids
        .map((id) => {
          const row = media.find((m) => m.id === id);
          const suggested = byId.get(id)?.trim();
          if (!row || !suggested || !isUsableAltSuggestion(suggested)) return null;
          return { mediaId: id, row, suggested };
        })
        .filter((item): item is AiReviewItem => Boolean(item));

      if (items.length === 0) {
        setError('No alt text suggestions returned — try again.');
        return;
      }

      setAiReview({
        items,
        phase: 'choose',
        reviewIndex: 0,
        edits: Object.fromEntries(items.map((i) => [i.mediaId, i.suggested])),
        skipped: new Set(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI alt text failed');
    } finally {
      setAiBusy(false);
    }
  }

  async function acceptAllAiReview(state: AiReviewState) {
    const updates = state.items.map((i) => ({
      mediaId: i.mediaId,
      altText: state.edits[i.mediaId]?.trim() || i.suggested,
    }));
    await applyAltTextUpdates(updates);
    setAiReview(null);
    setSelected(new Set());
  }

  async function confirmAiReview(state: AiReviewState) {
    const updates = state.items
      .filter((i) => !state.skipped.has(i.mediaId))
      .map((i) => ({
        mediaId: i.mediaId,
        altText: state.edits[i.mediaId]?.trim() || i.suggested,
      }))
      .filter((u) => u.altText);
    await applyAltTextUpdates(updates);
    setAiReview(null);
    setSelected(new Set());
  }

  function selectMissingAlt(enterSelectMode = false) {
    if (enterSelectMode || !selectMode) setSelectMode(true);
    const ids = filteredMedia.filter((m) => isMissingAltText(m.altText)).map((m) => m.id);
    setSelected(new Set(ids));
  }

  async function aiAltTextForMissing() {
    const imageIds = filteredMedia
      .filter((m) => isMissingAltText(m.altText) && m.mediaType !== 'video')
      .map((m) => m.id);
    selectMissingAlt(true);
    await aiAltTextSelected(imageIds);
  }

  function toggleSelectMode() {
    setSelectMode((on) => {
      if (on) setSelected(new Set());
      return !on;
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  async function reorderHero(fromId: string, toId: string) {
    const ordered = [...heroMedia];
    const fromIdx = ordered.findIndex((m) => m.id === fromId);
    const toIdx = ordered.findIndex((m) => m.id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    try {
      await Promise.all(ordered.map((m, i) => dataApi.update('media', m.id, { heroSortOrder: i })));
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionFilterDropdown value={sectionFilters} onChange={setSectionFilters} />

          <div className="flex items-center gap-2">
            <Select
              value={altFilter}
              onChange={(e) => setAltFilter(e.target.value as AltFilter)}
              className="w-36 text-xs"
              aria-label="Filter media"
            >
              <option value="all">All images</option>
              <option value="no-alt">Missing alt text</option>
              <option value="adult">18+ only</option>
              <option value="safe">Safe only</option>
            </Select>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
              {(
                [
                  { mode: 'grid', icon: 'grid_view', label: 'Card view' },
                  { mode: 'list', icon: 'view_list', label: 'Row view' },
                ] as const
              ).map((v) => (
                <button
                  key={v.mode}
                  type="button"
                  aria-label={v.label}
                  title={v.label}
                  onClick={() => setView(v.mode)}
                  className={`cursor-pointer rounded-md px-2 py-1 transition-colors ${
                    view === v.mode
                      ? 'bg-pink-600 text-white'
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon name={v.icon} className="!text-[16px]" />
                </button>
              ))}
            </div>
            {canEdit && (
              <button
                type="button"
                aria-pressed={selectMode}
                aria-label="Select multiple"
                title="Select multiple"
                onClick={toggleSelectMode}
                className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                  selectMode
                    ? 'border-pink-500 bg-pink-600 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                }`}
              >
                <Icon name="checklist" className="!text-[16px]" />
                Select
              </button>
            )}
          </div>
        </div>

        {canEdit && (
          <HeroMediaStrip
            items={heroMedia}
            canEdit={canEdit}
            onPreview={setPreviewRow}
            onReorder={(fromId, toId) => void reorderHero(fromId, toId)}
          />
        )}

        {canEdit && (
          <UploadPanel
            role="gallery"
            label="Drop images or videos here (added to public gallery by default)"
            onUploaded={(ids) => setEditQueue(ids)}
          />
        )}

        {canEdit && !selectMode && missingAltCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
            <span className="text-amber-800 dark:text-amber-200">
              {missingAltCount} item{missingAltCount === 1 ? '' : 's'} missing alt text
            </span>
            <span className="flex-1" />
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => selectMissingAlt(true)}
            >
              Select all missing
            </Button>
            <Button
              variant="secondary"
              className="text-xs"
              disabled={aiBusy}
              onClick={() => void aiAltTextForMissing()}
            >
              <Icon name="auto_awesome" className="!text-[14px]" /> AI alt text
            </Button>
          </div>
        )}

        {canEdit && selectMode && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-sm dark:border-pink-900/50 dark:bg-pink-950/30">
            <span className="font-medium text-pink-700 dark:text-pink-300">
              {selected.size} selected
            </span>
            <Button variant="ghost" className="text-xs" onClick={selectMissingAlt}>
              Select missing alt text
            </Button>
            <span className="flex-1" />
            <Button
              variant="secondary"
              className="text-xs"
              disabled={selected.size === 0}
              onClick={() => setBulkEditOpen(true)}
            >
              <Icon name="edit" className="!text-[14px]" /> Bulk edit
            </Button>
            <Button
              variant="secondary"
              className="text-xs"
              disabled={selected.size === 0 || aiBusy}
              onClick={() => void aiAltTextSelected()}
            >
              <Icon
                name={aiBusy ? 'progress_activity' : 'auto_awesome'}
                className={`!text-[14px] ${aiBusy ? 'animate-spin' : ''}`}
              />
              {aiBusy ? 'Writing alt text…' : 'AI alt text'}
            </Button>
            <Button
              variant="danger"
              className="text-xs"
              disabled={selected.size === 0}
              onClick={() => setDeleteConfirm({ kind: 'bulk', count: selected.size })}
            >
              <Icon name="delete" className="!text-[14px]" /> Delete
            </Button>
            <Button variant="ghost" className="text-xs" onClick={toggleSelectMode}>
              Done
            </Button>
          </div>
        )}

        {filteredMedia.length === 0 ? (
          <EmptyMediaState
            note={
              sectionFilters.size === 0
                ? 'Select at least one section in the filter.'
                : altFilter === 'all'
                  ? 'No media yet. Drop files above — you will set alt text and 18+ per image right after upload.'
                  : 'No media matches this filter.'
            }
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {filteredMedia.map((m) => {
              const section = mediaSection(m);
              return (
                <MediaCard
                  key={m.id}
                  row={m}
                  section={section}
                  canEdit={canEdit}
                  draggable={canReorderGallery && section === 'gallery'}
                  selectMode={selectMode}
                  selected={selected.has(m.id)}
                  onSelect={() => toggleSelected(m.id)}
                  onPreview={() => setPreviewRow(m)}
                  onDropOn={
                    canReorderGallery && section === 'gallery'
                      ? (fromId) => void reorderGallery(fromId, m.id)
                      : undefined
                  }
                  onEdit={() => setEditQueue([m.id])}
                  onRemove={() => setDeleteConfirm({ kind: 'one', row: m })}
                />
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-700">
                  {selectMode && <th className="w-8 px-3 py-2" />}
                  <th className="px-3 py-2">Preview</th>
                  <th className="px-3 py-2">Section</th>
                  <th className="px-3 py-2">Alt text</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((m) => {
                  const section = mediaSection(m);
                  return (
                    <tr
                      key={m.id}
                      onClick={selectMode ? () => toggleSelected(m.id) : undefined}
                      className={`border-b border-slate-100 dark:border-slate-800 ${
                        selectMode
                          ? `cursor-pointer ${
                              selected.has(m.id)
                                ? 'bg-pink-50/70 dark:bg-pink-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`
                          : ''
                      }`}
                    >
                      {selectMode && (
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(m.id)}
                            readOnly
                            tabIndex={-1}
                            aria-label="Select media"
                            className="pointer-events-none h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <MediaPreviewThumb
                          row={m}
                          className="h-12 w-12"
                          hoverPreview={!selectMode}
                          onClick={selectMode ? undefined : () => setPreviewRow(m)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={sectionBadgeTone(section)}>{SECTION_LABELS[section]}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        {canEdit && !selectMode ? (
                          <AltTextCell
                            row={m}
                            onSave={(v) => void updateMedia(m.id, { altText: altTextForUpdate(v) })}
                            onRegister={registerAltInput}
                            onTab={(direction) => tabBetweenAlt(m.id, direction)}
                          />
                        ) : (
                          <span className="text-xs">{m.altText || '—'}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{placementLabel(m)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge tone={m.adult ? 'red' : 'green'}>{m.adult ? '18+' : 'Safe'}</Badge>
                          {m.mediaType === 'video' && <Badge tone="blue">video</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canEdit && !selectMode && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              aria-label="Edit media"
                              className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => setEditQueue([m.id])}
                            >
                              <Icon name="edit" className="!text-[16px]" />
                            </button>
                            <button
                              type="button"
                              aria-label="Remove media"
                              className="cursor-pointer text-slate-400 hover:text-red-600"
                              onClick={() => setDeleteConfirm({ kind: 'one', row: m })}
                            >
                              <Icon name="delete" className="!text-[16px]" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {(canReorderGallery || (view === 'list' && canEdit && !selectMode)) && (
          <p className="text-xs text-slate-400">
            {canReorderGallery && (
              <>Drag public gallery cards to reorder. 18+ media is automatically age-gated on the public site.</>
            )}
            {canReorderGallery && view === 'list' && canEdit && !selectMode && <> </>}
            {view === 'list' && canEdit && !selectMode && (
              <>In row view, press Tab in an alt text field to jump to the next row.</>
            )}
          </p>
        )}
      </div>

      <CompletionSidebar />

      {bulkEditOpen && (
        <BulkEditModal
          count={selected.size}
          onClose={() => setBulkEditOpen(false)}
          onApply={applyBulkEdit}
        />
      )}

      {aiReview && (
        <AiAltTextReviewModal
          state={aiReview}
          onClose={() => setAiReview(null)}
          onAcceptAll={() => void acceptAllAiReview(aiReview)}
          onConfirmReview={() => void confirmAiReview(aiReview)}
          onChange={setAiReview}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={deleteConfirm.kind === 'bulk' ? `Delete ${deleteConfirm.count} items?` : 'Remove this media item?'}
          message="Soft delete — restorable from the global library."
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() =>
            void (deleteConfirm.kind === 'bulk' ? removeSelected() : removeMedia(deleteConfirm.row))
          }
        />
      )}

      {queueRows && queueRows.length > 0 && (
        <MediaEditFlow
          rows={queueRows}
          categories={ws.related.categories}
          evidenceResults={evidenceResults}
          heroCount={heroMedia.length}
          onClose={() => setEditQueue(null)}
          onDone={() => {
            setEditQueue(null);
            void ws.refreshRelated();
          }}
        />
      )}

      <MediaPreviewLightbox row={previewRow} onClose={() => setPreviewRow(null)} />
    </div>
  );
}

function SectionFilterDropdown({
  value,
  onChange,
}: {
  value: Set<MediaSection>;
  onChange: (next: Set<MediaSection>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const allSelected = value.size === ALL_SECTIONS.length;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function toggleAll() {
    onChange(allSelected ? new Set() : new Set(ALL_SECTIONS));
  }

  function toggleSection(section: MediaSection) {
    const next = new Set(value);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    onChange(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Icon name="filter_list" className="!text-[16px] text-slate-400" />
        {sectionFilterLabel(value)}
        <Icon name="expand_more" className="!text-[16px] text-slate-400" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Filter by section"
          className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
            />
            All
          </label>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          {ALL_SECTIONS.map((section) => (
            <label
              key={section}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={value.has(section)}
                onChange={() => toggleSection(section)}
                className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
              />
              {SECTION_LABELS[section]}
            </label>
          ))}
        </div>
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

function AltTextCell({
  row,
  onSave,
  onRegister,
  onTab,
}: {
  row: EntityRow;
  onSave: (value: string) => void;
  onRegister?: (id: string, el: HTMLInputElement | null) => void;
  onTab?: (direction: 'next' | 'prev') => void;
}) {
  const [value, setValue] = useState(() => displayAltText(row.altText));

  useEffect(() => {
    setValue(displayAltText(row.altText));
  }, [row.altText, row.id]);

  useEffect(() => {
    if (isPlaceholderAltText(row.altText)) {
      onSave('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- purge once per stale placeholder row
  }, [row.id]);

  function saveIfChanged(next = value) {
    const trimmed = altTextForUpdate(next);
    if (isPlaceholderAltText(row.altText)) {
      if (!trimmed) {
        onSave('');
        return;
      }
    }
    const stored = altTextForUpdate(displayAltText(row.altText));
    if (trimmed !== stored) onSave(trimmed);
  }

  return (
    <input
      ref={(el) => onRegister?.(row.id, el)}
      value={value}
      placeholder="Add alt text…"
      aria-label="Alt text"
      className={`${inputClass} !py-1 text-xs ${!value ? 'border-amber-300' : ''}`}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => saveIfChanged()}
      onKeyDown={(e) => {
        if (e.key === 'Tab' && onTab) {
          e.preventDefault();
          saveIfChanged();
          onTab(e.shiftKey ? 'prev' : 'next');
        }
      }}
    />
  );
}

function AiAltTextReviewModal({
  state,
  onClose,
  onAcceptAll,
  onConfirmReview,
  onChange,
}: {
  state: AiReviewState;
  onClose: () => void;
  onAcceptAll: () => void;
  onConfirmReview: () => void;
  onChange: (next: AiReviewState) => void;
}) {
  const total = state.items.length;
  const current = state.items[state.reviewIndex];

  if (state.phase === 'choose') {
    return (
      <Modal title="AI alt text ready" onClose={onClose}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Generated suggestions for {total} image{total === 1 ? '' : 's'}. Accept them all, or review
          one by one before saving.
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => onChange({ ...state, phase: 'review', reviewIndex: 0 })}>
            Review one by one
          </Button>
          <Button onClick={onAcceptAll}>
            Accept all
          </Button>
        </div>
      </Modal>
    );
  }

  if (!current) return null;

  const isLast = state.reviewIndex >= total - 1;
  const editValue = state.edits[current.mediaId] ?? current.suggested;

  function setEdit(text: string) {
    onChange({ ...state, edits: { ...state.edits, [current.mediaId]: text } });
  }

  function skipCurrent() {
    const skipped = new Set(state.skipped);
    skipped.add(current.mediaId);
    if (isLast) onConfirmReview();
    else onChange({ ...state, skipped, reviewIndex: state.reviewIndex + 1 });
  }

  function nextCurrent() {
    if (isLast) onConfirmReview();
    else onChange({ ...state, reviewIndex: state.reviewIndex + 1 });
  }

  return (
    <Modal title={`Review alt text ${state.reviewIndex + 1} of ${total}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex justify-center">
          <MediaThumb row={current.row} className="h-40 w-40" />
        </div>
        {current.row.altText && !isMissingAltText(current.row.altText) && (
          <p className="text-xs text-slate-500">
            Current: <span className="text-slate-700 dark:text-slate-300">{displayAltText(current.row.altText)}</span>
          </p>
        )}
        <Field label="Suggested alt text">
          <TextInput value={editValue} onChange={(e) => setEdit(e.target.value)} autoFocus />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={skipCurrent}>
            Skip
          </Button>
          <Button onClick={nextCurrent}>{isLast ? 'Confirm & save' : 'Next'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function HeroMediaStrip({
  items,
  canEdit,
  onPreview,
  onReorder,
}: {
  items: EntityRow[];
  canEdit: boolean;
  onPreview: (row: EntityRow) => void;
  onReorder: (fromId: string, toId: string) => void;
}) {
  return (
    <section className="rounded-xl border border-pink-200 bg-pink-50/50 p-3 dark:border-pink-900/40 dark:bg-pink-950/20">
      <div className="mb-2 flex items-center gap-2">
        <Icon name="star" className="!text-[18px] text-pink-600" />
        <h3 className="text-sm font-bold text-pink-800 dark:text-pink-200">Featured in hero</h3>
        <span className="text-xs text-pink-600/80 dark:text-pink-300/80">
          Drag to set order on the review page hero carousel
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">
          No hero media yet. Edit any item and toggle <strong>Hero</strong> to feature it on the review page.
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((row) => (
            <HeroMediaCard
              key={row.id}
              row={row}
              canEdit={canEdit}
              onPreview={() => onPreview(row)}
              onDropOn={(fromId) => onReorder(fromId, row.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HeroMediaCard({
  row,
  canEdit,
  onPreview,
  onDropOn,
}: {
  row: EntityRow;
  canEdit: boolean;
  onPreview: () => void;
  onDropOn: (fromId: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => e.dataTransfer.setData('text/hero-media-id', row.id)}
      onDragOver={(e) => {
        if (!canEdit) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const fromId = e.dataTransfer.getData('text/hero-media-id');
        if (fromId && fromId !== row.id) onDropOn(fromId);
      }}
      className={`w-28 shrink-0 rounded-lg border bg-white p-1.5 shadow-sm transition-colors dark:bg-slate-900 ${
        dragOver ? 'border-pink-400' : 'border-pink-200 dark:border-pink-900/50'
      }`}
    >
      <MediaPreviewThumb row={row} className="aspect-[4/3] w-full" onClick={onPreview} />
      <p className="mt-1 truncate text-[10px] text-slate-500">{row.altText || row.caption || 'No label'}</p>
    </div>
  );
}

function MediaCard({
  row,
  section,
  canEdit,
  draggable,
  selectMode,
  selected,
  onSelect,
  onPreview,
  onDropOn,
  onEdit,
  onRemove,
}: {
  row: EntityRow;
  section: MediaSection;
  canEdit: boolean;
  draggable?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
  onDropOn?: (fromId: string) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const selecting = Boolean(selectMode && onSelect);
  return (
    <div
      role={selecting ? 'checkbox' : undefined}
      aria-checked={selecting ? Boolean(selected) : undefined}
      tabIndex={selecting ? 0 : undefined}
      onClick={selecting ? onSelect : undefined}
      onKeyDown={
        selecting
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      draggable={draggable && canEdit && !selecting}
      onDragStart={(e) => e.dataTransfer.setData('text/media-id', row.id)}
      onDragOver={(e) => {
        if (!onDropOn || selecting) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (selecting) return;
        e.preventDefault();
        setDragOver(false);
        const fromId = e.dataTransfer.getData('text/media-id');
        if (fromId && fromId !== row.id) onDropOn?.(fromId);
      }}
      className={`rounded-lg border bg-white p-2 shadow-sm transition-colors dark:bg-slate-900 ${
        selecting ? 'cursor-pointer select-none' : ''
      } ${
        dragOver
          ? 'border-pink-400'
          : selected
            ? 'border-pink-500 ring-2 ring-pink-300'
            : selecting
              ? 'border-slate-200 hover:border-pink-300 dark:border-slate-800'
              : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="relative">
        <MediaPreviewThumb
          row={row}
          onClick={selecting ? undefined : onPreview}
          hoverPreview={!selecting}
        />
        <span className="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium leading-tight text-white backdrop-blur-sm">
          {SECTION_LABELS[section]}
        </span>
        {isHeroMedia(row) && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-pink-600 px-1 py-0.5 text-[9px] font-bold uppercase text-white">
            Hero
          </span>
        )}
        {selecting && (
          <span
            className={`absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded border shadow ${
              selected
                ? 'border-pink-600 bg-pink-600 text-white'
                : 'border-slate-300 bg-white/90 dark:border-slate-600 dark:bg-slate-800/90'
            }`}
            aria-hidden="true"
          >
            {selected && <Icon name="check" className="!text-[14px]" />}
          </span>
        )}
        <div className="absolute right-1.5 top-1.5 flex gap-1">
          {row.adult && <Badge tone="red">18+</Badge>}
          {row.mediaType === 'video' && <Badge tone="blue">video</Badge>}
        </div>
      </div>
      <p className="mt-1.5 truncate text-xs text-slate-400">{placementLabel(row)}</p>
      <p className="truncate text-xs text-slate-500" title={displayAltText(row.altText)}>
        {isMissingAltText(row.altText) ? (
          <span className="text-amber-600">No alt text</span>
        ) : (
          displayAltText(row.altText)
        )}
      </p>
      {canEdit && !selecting && (
        <div className="mt-1 flex items-center gap-1">
          <button type="button" aria-label="Edit media" className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={onEdit}>
            <Icon name="edit" className="!text-[16px]" />
          </button>
          <button type="button" aria-label="Remove media" className="cursor-pointer text-slate-400 hover:text-red-600" onClick={onRemove}>
            <Icon name="delete" className="!text-[16px]" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload panel — uploads files then hands the created ids to the edit flow
// ---------------------------------------------------------------------------

function UploadPanel({
  role,
  label,
  onUploaded,
}: {
  role: string;
  label: string;
  onUploaded: (mediaIds: string[]) => void;
}) {
  const ws = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { setError } = useAsyncToast();

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    setProgress({ done: 0, total: list.length });
    const ids: string[] = [];
    try {
      for (const [i, file] of list.entries()) {
        const form = new FormData();
        form.set('file', file);
        form.set('adult', '0');
        form.set('role', role);
        form.set('productId', ws.productId);
        const created = await api.upload<{ id: string }>('/api/admin/media/upload', form);
        ids.push(created.id);
        setProgress({ done: i + 1, total: list.length });
      }
      await ws.refreshRelated();
      if (ids.length > 0) onUploaded(ids);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      // Still open the editor for whatever did upload.
      if (ids.length > 0) {
        await ws.refreshRelated().catch(() => {});
        onUploaded(ids);
      }
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
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
          <p className="text-xs text-slate-400">
            {progress
              ? `Uploading ${progress.done} of ${progress.total}…`
              : 'Images or video · Max 50MB · the editor opens right after upload'}
          </p>
        </div>
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
// Bulk category change for selected items
// ---------------------------------------------------------------------------

// Bulk edit for selected items (category, alt text, caption).

function BulkEditModal({
  count,
  onClose,
  onApply,
}: {
  count: number;
  onClose: () => void;
  onApply: (patch: { altText?: string; caption?: string }) => Promise<void>;
}) {
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal title={`Bulk edit — ${count} item${count === 1 ? '' : 's'}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Fill in only the fields you want to change. Empty alt text and caption fields are skipped.
          Character, chat, and proof tags are set per item or automatically from evidence uploads.
        </p>
        <Field label="Alt text" help="Applied to all selected items when filled in.">
          <TextInput
            value={altText}
            placeholder="Leave blank to keep existing alt text"
            onChange={(e) => setAltText(e.target.value)}
          />
        </Field>
        <Field label="Caption" help="Applied to all selected items when filled in.">
          <TextInput
            value={caption}
            placeholder="Leave blank to keep existing captions"
            onChange={(e) => setCaption(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void onApply({
                altText,
                caption,
              }).finally(() => setBusy(false));
            }}
          >
            {busy ? 'Applying…' : `Apply to ${count} item${count === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Edit flow: steps through one or many media items ("2 of 20")
// ---------------------------------------------------------------------------

function MediaEditFlow({
  rows,
  categories,
  evidenceResults,
  heroCount,
  onClose,
  onDone,
}: {
  rows: EntityRow[];
  categories: EntityRow[];
  evidenceResults: EntityRow[];
  heroCount: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const total = rows.length;
  const row = rows[Math.min(index, total - 1)];

  function next() {
    if (index + 1 < total) setIndex(index + 1);
    else onDone();
  }

  return (
    <Modal
      title={total > 1 ? `Edit image ${index + 1} of ${total}` : 'Edit media'}
      onClose={onClose}
    >
      <MediaEditForm
        key={row.id}
        row={row}
        categories={categories}
        evidenceResults={evidenceResults}
        heroCount={heroCount}
        isLast={index + 1 >= total}
        multi={total > 1}
        onSaved={next}
        onSkip={next}
        onClose={onClose}
      />
    </Modal>
  );
}

function MediaEditForm({
  row,
  categories,
  evidenceResults,
  heroCount,
  isLast,
  multi,
  onSaved,
  onSkip,
  onClose,
}: {
  row: EntityRow;
  categories: EntityRow[];
  evidenceResults: EntityRow[];
  heroCount: number;
  isLast: boolean;
  multi: boolean;
  onSaved: () => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  const ws = useWorkspace();
  const [altText, setAltText] = useState(() => displayAltText(row.altText));
  const [adult, setAdult] = useState(Boolean(row.adult));
  const [roleState, setRoleState] = useState<MediaRoleState>(() => readMediaRoleState(row));
  const [testCategory, setTestCategory] = useState(String(row.testCategory ?? ''));
  const [evidenceResultId, setEvidenceResultId] = useState(String(row.evidenceResult?.id ?? ''));
  const [caption, setCaption] = useState(String(row.caption ?? ''));
  const [credit, setCredit] = useState(String(row.credit ?? ''));
  const [showExtras, setShowExtras] = useState(Boolean(row.credit || row.caption));
  const [aiBusy, setAiBusy] = useState(false);
  const toast = useToast();
  const { busy, run } = useAsyncToast();

  const isProof = getMediaPlacement(row) === 'proof';

  async function aiAltText() {
    setAiBusy(true);
    try {
      const { altTexts } = await api.post<{ altTexts: Array<{ mediaId: string; altText: string }> }>(
        '/api/admin/ai-alt-text/generate',
        { productId: ws.productId, mediaIds: [row.id] },
      );
      const suggestion = altTexts[0]?.altText;
      if (suggestion && isUsableAltSuggestion(suggestion)) setAltText(suggestion);
      else toast.error('No usable suggestion returned — try again.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI alt text failed');
    } finally {
      setAiBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const nextRoleState = roleState;
    const { role, mediaTags } = writeMediaRoleState(nextRoleState, {
      placement: isProof ? 'proof' : 'gallery',
    });
    const wasHero = isHeroMedia(row);
    const becomingHero = nextRoleState.hero && !wasHero;
    const heroSortOrder =
      nextRoleState.hero && becomingHero
        ? 0
        : nextRoleState.hero
          ? row.heroSortOrder ?? heroCount
          : undefined;
    const done = await run(async () => {
      await dataApi.update(
        'media',
        row.id,
        {
          altText: altTextForUpdate(altText),
          caption: caption.trim() || undefined,
          credit: credit.trim() || undefined,
          adult,
          ageGated: adult,
          role,
          mediaTags,
          heroSortOrder: nextRoleState.hero ? heroSortOrder : wasHero ? null : undefined,
          testCategory: isProof ? testCategory || undefined : undefined,
          approved: true,
        },
        { evidenceResult: isProof && evidenceResultId ? evidenceResultId : null },
      );
      if (nextRoleState.hero && heroSortOrder === 0) {
        const updates = heroSortOrderUpdates(ws.related.media, row.id).filter((u) => u.id !== row.id);
        if (updates.length > 0) {
          await Promise.all(
            updates.map((u) => dataApi.update('media', u.id, { heroSortOrder: u.heroSortOrder })),
          );
        }
      }
      return true;
    });
    if (done) onSaved();
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="flex justify-center">
        <MediaThumb row={row} className="h-44 w-44" />
      </div>

      <Field label="Alt text" help="Describes the image for screen readers and SEO.">
        <div className="flex items-center gap-2">
          <TextInput value={altText} onChange={(e) => setAltText(e.target.value)} autoFocus className="flex-1" />
          {row.mediaType !== 'video' && (
            <button
              type="button"
              disabled={aiBusy}
              title="Write alt text with AI"
              aria-label="Write alt text with AI"
              onClick={() => void aiAltText()}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-pink-200 bg-pink-50 px-2 py-1.5 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-100 disabled:opacity-60 dark:border-pink-900/50 dark:bg-pink-950/30 dark:text-pink-300 dark:hover:bg-pink-950/60"
            >
              <Icon
                name={aiBusy ? 'progress_activity' : 'auto_awesome'}
                className={`!text-[14px] ${aiBusy ? 'animate-spin' : ''}`}
              />
              AI
            </button>
          )}
        </div>
      </Field>

      <MediaRoleFields value={roleState} onChange={setRoleState} />

      {isProof && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
          <Field label="Test category">
            <Select value={testCategory} onChange={(e) => setTestCategory(e.target.value)}>
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.slug ?? '')}>
                  {String(c.name ?? c.slug)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Evidence result (optional)">
            <Select value={evidenceResultId} onChange={(e) => setEvidenceResultId(e.target.value)}>
              <option value="">— not linked —</option>
              {evidenceResults.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.evidenceDefinition?.name ?? r.id} · {r.testRun?.name ?? ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Toggle checked={adult} onChange={setAdult} label="18+ content" />
        {adult && <span className="text-xs text-slate-400">Automatically age-gated on the public site.</span>}
      </div>

      {showExtras ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Credit (optional)">
            <TextInput value={credit} onChange={(e) => setCredit(e.target.value)} />
          </Field>
          <Field label="Caption / internal note (optional)">
            <TextInput value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
        </div>
      ) : (
        <button
          type="button"
          className="text-xs font-medium text-pink-600 hover:underline"
          onClick={() => setShowExtras(true)}
        >
          + Add credit or internal note (optional)
        </button>
      )}

      <p className="text-xs text-slate-400">
        Uploaded {fmtDate(row.createdAt)} by {row.uploadedBy ?? 'unknown'}.
      </p>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {multi && (
            <Button variant="ghost" onClick={onSkip} disabled={busy}>
              Skip
            </Button>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : isLast ? 'Save & done' : 'Save & next'}
          </Button>
        </div>
      </div>
    </form>
  );
}
