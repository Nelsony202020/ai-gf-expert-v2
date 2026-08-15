// Review tab: continuous document-style rich-text editor (TipTap) for the
// review article. The persisted format is unchanged — an array of approved
// content blocks (see REVIEW_BLOCK_TYPES in src/lib/validation/schemas.ts).
// Blocks are converted to a TipTap document on load and serialized back to
// the same block array on save, so server-side validation, revisions, and
// public rendering keep working untouched.

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { dataApi, linkedEntityId } from '../../api';
import { useCan, useMe } from '../../context';
import { useToastError } from '../../Toast';
import { Button, Icon, fmtDate } from '../../ui';
import { lazyImport } from '../../lazyImport';
import { resolveMediaUrl } from '../../../../lib/media/url';
import {
  analyzeDoc,
  blocksToDoc,
  devRoundTripCheck,
  docToBlocks,
  type ConversionContext,
  type JSONDoc,
} from '../../review/blockConversion';
import { ImageInspectorPanel } from '../../review/ImageInspectorPanel';
import type { ImageInspectorTarget, ReviewEditorUI } from '../../review/reviewEditorContext';
import { useWorkspace } from '../context';
import { makeBlock, normalizeReviewHeadingLevels, reviewTemplateHeadings, type ReviewBlock } from '../reviewBlocks';
import {
  clearReviewDraft,
  draftIsNewerThanSaved,
  readReviewDraft,
  writeReviewDraft,
} from '../../../../lib/review/reviewDraftStorage';
import { flushLiveRebuild, scheduleLiveRebuild } from '../../../../lib/admin/scheduleLiveRebuild';

const ReviewEditor = lazyImport(() => import('../../review/ReviewEditor'), 'ReviewEditor');

const MAX_REVISIONS = 10;
const READING_WPM = 200;
/** Wait this long after the last keystroke before writing to InstantDB. */
const SERVER_AUTOSAVE_MS = 1000;
/** Local draft writes sooner so a hard crash still has something. */
const LOCAL_DRAFT_MS = 400;
/** Don't spam revision history on every autosave — snapshot at most this often. */
const REVISION_SNAPSHOT_MS = 5 * 60 * 1000;

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

function templateDoc(productName: string): JSONDoc {
  return {
    type: 'doc',
    content: reviewTemplateHeadings(productName).flatMap((heading) => [
      {
        type: 'heading',
        attrs: { level: 2, blockId: null },
        content: [{ type: 'text', text: heading }],
      },
      { type: 'paragraph', attrs: { blockId: null } },
    ]),
  };
}

export function ReviewTab() {
  const ws = useWorkspace();
  const me = useMe();
  const can = useCan();
  const review = ws.related.review;

  const [doc, setDoc] = useState<JSONDoc>({ type: 'doc', content: [] });
  const [contentKey, setContentKey] = useState(0);
  const [loadedFromId, setLoadedFromId] = useState<string | null | undefined>(undefined);
  const [showRevisions, setShowRevisions] = useState(false);
  const [templateDismissed, setTemplateDismissed] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInspector, setImageInspector] = useState<ImageInspectorTarget | null>(null);
  const [draftOffer, setDraftOffer] = useState<{ savedAt: number; doc: JSONDoc } | null>(null);
  const editorUiRef = useRef<ReviewEditorUI | null>(null);
  useToastError(error, () => setError(null));
  const savedDocJson = useRef('');
  const reviewIdRef = useRef<string | null>(review?.id ?? null);
  const lastRevisionPushAtRef = useRef<number>(0);
  const saveSeqRef = useRef(0);
  const inFlightRef = useRef(false);
  const pendingAfterFlightRef = useRef(false);
  const docRef = useRef(doc);
  docRef.current = doc;
  const autosaveTimerRef = useRef<number | null>(null);
  const localDraftTimerRef = useRef<number | null>(null);
  const persistRef = useRef<(doc: JSONDoc, opts?: { forceRevision?: boolean }) => Promise<boolean>>(
    async () => false,
  );

  const canEdit = can('content.edit');

  useEffect(() => {
    if (review?.id) reviewIdRef.current = review.id;
  }, [review?.id]);

  const conversionCtx = useMemo<ConversionContext>(() => {
    const mediaById: NonNullable<ConversionContext['mediaById']> = {};
    for (const m of ws.related.mediaAll) {
      const url = resolveMediaUrl(m);
      mediaById[m.id] = {
        url: url || undefined,
        altText: m.altText ? String(m.altText) : undefined,
      };
    }
    return { mediaById };
  }, [ws.related.mediaAll]);

  // Load blocks from the review record (migrating legacy sections once).
  useEffect(() => {
    if (ws.relatedLoading) return;
    if (loadedFromId !== undefined && (review?.id ?? null) === loadedFromId) return;
    let initial: ReviewBlock[] = [];
    if (review) {
      if (Array.isArray(review.blocks) && review.blocks.length > 0) {
        initial = normalizeReviewHeadingLevels(review.blocks as ReviewBlock[]);
      } else if (Array.isArray(review.sections) && review.sections.length > 0) {
        // Legacy sections -> blocks (heading + paragraph), one-time client migration.
        initial = (review.sections as { heading: string; body: string; level?: number }[]).flatMap(
          (s) => [
            makeBlock('h3', { text: s.heading }),
            makeBlock('paragraph', { text: s.body }),
          ],
        );
      } else if (review.intro) {
        initial = [makeBlock('h3', { text: 'Introduction' }), makeBlock('paragraph', { text: review.intro })];
      }
    }
    devRoundTripCheck(initial, conversionCtx);
    const nextDoc = blocksToDoc(initial, conversionCtx);
    setDoc(nextDoc);
    setContentKey((k) => k + 1);
    savedDocJson.current = JSON.stringify(nextDoc);
    setLoadedFromId(review?.id ?? null);
    setTemplateDismissed(false);

    const draft = readReviewDraft(ws.productId);
    if (
      draftIsNewerThanSaved(
        draft,
        JSON.stringify(nextDoc),
        typeof review?.lastEditedAt === 'number' ? review.lastEditedAt : null,
      )
    ) {
      setDraftOffer({ savedAt: draft!.savedAt, doc: draft!.doc });
    } else {
      setDraftOffer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id, ws.relatedLoading, ws.productId]);

  const isDirty = useMemo(() => JSON.stringify(doc) !== savedDocJson.current, [doc]);
  const analysis = useMemo(() => analyzeDoc(doc), [doc]);

  const persistToServer = useCallback(
    async (docToSave: JSONDoc, opts?: { forceRevision?: boolean }): Promise<boolean> => {
      if (!canEdit || !ws.productId || ws.relatedLoading) return false;
      const json = JSON.stringify(docToSave);
      if (json === savedDocJson.current && reviewIdRef.current) return true;

      // Serialize writes — overlapping creates hit the unique product link.
      if (inFlightRef.current) {
        pendingAfterFlightRef.current = true;
        setSaveStatus((s) => (s === 'saving' ? s : 'pending'));
        return false;
      }

      const seq = ++saveSeqRef.current;
      inFlightRef.current = true;
      setBusy(true);
      setSaveStatus('saving');
      setError(null);

      try {
        const blocks = normalizeReviewHeadingLevels(docToBlocks(docToSave));
        const now = Date.now();
        const fields: Record<string, unknown> = {
          blocks,
          lastEditedBy: me.email,
          lastEditedAt: now,
        };

        // Prefer live workspace review id, then cached ref, then list lookup.
        let existingId = review?.id ?? reviewIdRef.current;
        if (!existingId) {
          try {
            const { rows } = await dataApi.list('reviews');
            const hit = rows.find((r) => linkedEntityId(r.product) === ws.productId);
            if (hit?.id) existingId = hit.id;
          } catch {
            /* fall through to create */
          }
        }
        if (existingId) reviewIdRef.current = existingId;

        if (existingId) {
          const shouldPushRevision =
            Boolean(opts?.forceRevision) ||
            lastRevisionPushAtRef.current === 0 ||
            now - lastRevisionPushAtRef.current >= REVISION_SNAPSHOT_MS;
          const snapshotBlocks =
            Array.isArray(review?.blocks) && (review.blocks as ReviewBlock[]).length > 0
              ? (review.blocks as ReviewBlock[])
              : null;
          if (shouldPushRevision && snapshotBlocks) {
            const revisions = Array.isArray(review?.revisions) ? [...(review.revisions as object[])] : [];
            revisions.unshift({
              savedAt: review?.lastEditedAt ?? review?.updatedAt ?? now,
              savedBy: review?.lastEditedBy,
              blocks: snapshotBlocks,
            });
            fields.revisions = revisions.slice(0, MAX_REVISIONS);
            lastRevisionPushAtRef.current = now;
          }
          await dataApi.update('reviews', existingId, fields);
        } else {
          try {
            const created = await dataApi.create('reviews', fields, {
              product: ws.productId,
              author: ws.links.author ?? null,
              factChecker: ws.links.factChecker ?? null,
            });
            reviewIdRef.current = created.id;
            setLoadedFromId(created.id);
            lastRevisionPushAtRef.current = now;
            void ws.refreshRelated();
          } catch (createErr) {
            // Race / stale UI: review already linked to this product → update it.
            const msg = createErr instanceof Error ? createErr.message : String(createErr);
            if (!/unique|already exists/i.test(msg)) throw createErr;
            const { rows } = await dataApi.list('reviews');
            const hit = rows.find((r) => linkedEntityId(r.product) === ws.productId);
            if (!hit?.id) throw createErr;
            reviewIdRef.current = hit.id;
            setLoadedFromId(hit.id);
            await dataApi.update('reviews', hit.id, fields);
            void ws.refreshRelated();
          }
        }

        // Ignore stale responses if a newer edit started another save.
        if (seq !== saveSeqRef.current) return false;

        savedDocJson.current = json;
        setSavedAt(now);
        setSaveStatus('saved');
        clearReviewDraft(ws.productId);
        setDraftOffer(null);

        // Published product pages are static — schedule a live-site rebuild.
        if (ws.fields.status === 'published' || ws.original?.status === 'published') {
          scheduleLiveRebuild(`review article saved for ${ws.fields.slug ?? ws.productId}`);
        }
        return true;
      } catch (e) {
        if (seq === saveSeqRef.current) {
          setError(e instanceof Error ? e.message : String(e));
          setSaveStatus('error');
        }
        return false;
      } finally {
        if (seq === saveSeqRef.current) {
          inFlightRef.current = false;
          setBusy(false);
          if (pendingAfterFlightRef.current) {
            pendingAfterFlightRef.current = false;
            window.setTimeout(() => {
              void persistRef.current(docRef.current);
            }, 50);
          } else if (JSON.stringify(docRef.current) !== savedDocJson.current) {
            window.setTimeout(() => {
              void persistRef.current(docRef.current);
            }, SERVER_AUTOSAVE_MS);
          }
        }
      }
    },
    [canEdit, me.email, review, ws],
  );
  persistRef.current = persistToServer;

  const scheduleServerAutosave = useCallback(() => {
    if (!canEdit) return;
    setSaveStatus((s) => (s === 'saving' ? s : 'pending'));
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      void persistToServer(docRef.current);
    }, SERVER_AUTOSAVE_MS);
  }, [canEdit, persistToServer]);

  const flushSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    writeReviewDraft(ws.productId, docRef.current);
    if (JSON.stringify(docRef.current) === savedDocJson.current) return;
    await persistToServer(docRef.current);
  }, [persistToServer, ws.productId]);

  // Local draft + debounced server autosave while typing / editing.
  useEffect(() => {
    if (!canEdit || !ws.productId || !isDirty || ws.relatedLoading) return;

    if (localDraftTimerRef.current) window.clearTimeout(localDraftTimerRef.current);
    localDraftTimerRef.current = window.setTimeout(() => {
      writeReviewDraft(ws.productId, doc);
    }, LOCAL_DRAFT_MS);

    scheduleServerAutosave();

    return () => {
      if (localDraftTimerRef.current) window.clearTimeout(localDraftTimerRef.current);
    };
  }, [canEdit, ws.productId, ws.relatedLoading, doc, isDirty, scheduleServerAutosave]);

  // Flush when the tab hides / unloads so closing the window still persists.
  useEffect(() => {
    if (!canEdit) return;
    const onHide = () => {
      if (JSON.stringify(docRef.current) === savedDocJson.current) {
        if (ws.fields.status === 'published' || ws.original?.status === 'published') {
          flushLiveRebuild(`review flush for ${ws.fields.slug ?? ws.productId}`);
        }
        return;
      }
      writeReviewDraft(ws.productId, docRef.current);
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      void persistToServer(docRef.current).then(() => {
        if (ws.fields.status === 'published' || ws.original?.status === 'published') {
          flushLiveRebuild(`review flush for ${ws.fields.slug ?? ws.productId}`);
        }
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onHide();
    };
    const onBeforeUnload = () => {
      if (JSON.stringify(docRef.current) === savedDocJson.current) return;
      writeReviewDraft(ws.productId, docRef.current);
      void persistToServer(docRef.current);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [canEdit, persistToServer, ws.productId]);

  const handleChange = useCallback((next: JSONDoc) => setDoc(next), []);

  async function saveNow() {
    await flushSave();
  }

  function restoreRevision(rev: { savedAt: number; blocks: ReviewBlock[] }) {
    if (
      !confirm(
        `Restore the revision from ${fmtDate(rev.savedAt)}? Current editor content will be replaced (autosave will write the restored version).`,
      )
    )
      return;
    const nextDoc = blocksToDoc(rev.blocks, conversionCtx);
    setDoc(nextDoc);
    setContentKey((k) => k + 1);
    setShowRevisions(false);
  }

  function applyTemplate() {
    const nextDoc = templateDoc(String(ws.fields.name ?? ''));
    setDoc(nextDoc);
    setContentKey((k) => k + 1);
    setTemplateDismissed(true);
  }

  const revisions = (review?.revisions ?? []) as { savedAt: number; savedBy?: string; blocks: ReviewBlock[] }[];
  const lastSaved = savedAt ?? review?.lastEditedAt ?? null;
  const readingMinutes = Math.max(1, Math.ceil(analysis.words / READING_WPM));

  const warnings: string[] = [];
  if (analysis.empty) warnings.push('The review body is empty.');
  if (!analysis.empty && analysis.headingLevels.length === 0) warnings.push('No section headings yet — add H2 headings to structure the article.');
  if (analysis.imagesMissingAlt > 0)
    warnings.push(`${analysis.imagesMissingAlt} image${analysis.imagesMissingAlt === 1 ? '' : 's'} missing alt text.`);
  if (analysis.headingSkips > 0)
    warnings.push(`Heading level skipped (e.g. H2 → H4) in ${analysis.headingSkips} place${analysis.headingSkips === 1 ? '' : 's'}.`);

  const showTemplateOffer = canEdit && analysis.empty && !isDirty && !templateDismissed && !ws.relatedLoading;

  const saveControls = canEdit ? (
    <>
      {saveStatus === 'saving' || saveStatus === 'pending' ? (
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" /> Saving…
        </span>
      ) : saveStatus === 'error' ? (
        <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Couldn&apos;t save
        </span>
      ) : saveStatus === 'saved' || (!isDirty && lastSaved) ? (
        <span className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400" title="Database saved. Live public page rebuilds shortly after.">
          <Icon name="cloud_done" className="!text-[14px]" /> Saved
        </span>
      ) : null}
      {saveStatus === 'error' ? (
        <Button className="text-xs" onClick={() => void saveNow()} disabled={busy}>
          Retry
        </Button>
      ) : null}
    </>
  ) : undefined;

  return (
    <div className="flex gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-end gap-1.5 px-1">
          {revisions.length > 0 && (
            <Button variant="ghost" className="text-xs" onClick={() => setShowRevisions((v) => !v)}>
              <Icon name="history" className="!text-[15px]" /> Revisions ({revisions.length})
            </Button>
          )}
        </div>

        {draftOffer && canEdit && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <span>
              Local draft found from {fmtDate(draftOffer.savedAt)} — recover it before it&apos;s lost?
            </span>
            <span className="flex gap-2">
              <Button
                className="text-xs"
                onClick={() => {
                  setDoc(draftOffer.doc);
                  setContentKey((k) => k + 1);
                  setDraftOffer(null);
                  setTemplateDismissed(true);
                }}
              >
                Restore draft
              </Button>
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => {
                  clearReviewDraft(ws.productId);
                  setDraftOffer(null);
                }}
              >
                Discard
              </Button>
            </span>
          </div>
        )}

        {showRevisions && revisions.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="mb-2 text-sm font-semibold">Revision history</h4>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {revisions.map((rev, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    {fmtDate(rev.savedAt)}
                    {rev.savedBy ? ` · ${rev.savedBy}` : ''} · {rev.blocks.length} blocks
                  </span>
                  {canEdit && (
                    <Button variant="ghost" className="text-xs" onClick={() => restoreRevision(rev)}>
                      Restore
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state: offer the standard template */}
        {showTemplateOffer && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <Icon name="post_add" className="!text-[32px] text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">No review article yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Start from the hands-on review outline (First Impressions through My Final Take — headings
              include the product name where needed), or start blank and type <code>/</code> to insert blocks.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={applyTemplate}>
                <Icon name="auto_awesome" /> Start from template
              </Button>
              <Button variant="secondary" onClick={() => setTemplateDismissed(true)}>
                <Icon name="edit" /> Start blank
              </Button>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="flex min-h-[240px] items-center justify-center py-12 text-sm text-slate-500">Loading editor…</div>}>
          <ReviewEditor
            content={doc}
            contentKey={contentKey}
            editable={canEdit}
            productId={ws.productId}
            onChange={handleChange}
            toolbarExtra={saveControls}
            onImageInspectorChange={setImageInspector}
            onRegisterUi={(ui) => {
              editorUiRef.current = ui;
            }}
          />
        </Suspense>
      </div>

      <div className="hidden w-52 shrink-0 xl:block">
        <div className="sticky top-[var(--workspace-sticky-top,6.5rem)] z-10 max-h-[calc(100vh-var(--workspace-sticky-top,6.5rem)-1rem)] space-y-3 overflow-y-auto overscroll-contain">
          <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Article</h3>
            <dl className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Words</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{analysis.words.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Read time</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">
                  {analysis.empty ? '—' : `~${readingMinutes} min`}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">
                  {review ? 'Draft' : 'New'}
                  {isDirty ? ' · unsaved' : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Saved</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{lastSaved ? fmtDate(lastSaved) : '—'}</dd>
              </div>
            </dl>
            {warnings.length > 0 && (
              <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Warnings</p>
                <ul className="space-y-1">
                  {warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-1 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
                      <Icon name="warning" className="mt-px !text-[12px] shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {imageInspector && canEdit && editorUiRef.current && (
            <ImageInspectorPanel
              key={`${imageInspector.kind}-${imageInspector.itemIndex ?? 0}-${String(imageInspector.attrs.src ?? '')}`}
              target={imageInspector}
              onClose={() => setImageInspector(null)}
              openImagePicker={editorUiRef.current.openImagePicker}
            />
          )}
        </div>
      </div>
    </div>
  );
}
