// Review tab: continuous document-style rich-text editor (TipTap) for the
// review article. The persisted format is unchanged — an array of approved
// content blocks (see REVIEW_BLOCK_TYPES in src/lib/validation/schemas.ts).
// Blocks are converted to a TipTap document on load and serialized back to
// the same block array on save, so server-side validation, revisions, and
// public rendering keep working untouched.

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dataApi } from '../../api';
import { useCan, useMe } from '../../context';
import { useToastError } from '../../Toast';
import { Button, Icon, Spinner, fmtDate } from '../../ui';
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
import { CompletionSidebar } from '../CompletionSidebar';
import { makeBlock, type ReviewBlock } from '../reviewBlocks';

// TipTap and all its extensions load lazily so the admin bundle stays lean.
const ReviewEditor = lazy(() => import('../../review/ReviewEditor'));

const MAX_REVISIONS = 10;
const READING_WPM = 200;

const TEMPLATE_HEADINGS = [
  'Introduction',
  'First Impressions',
  'Character Selection',
  'Character Customization',
  'Chat Experience',
  'Chat Features',
  'Image Generation',
  'Video Generation',
  'Privacy',
  'Pricing',
  'Final Thoughts',
];

function templateDoc(): JSONDoc {
  return {
    type: 'doc',
    content: TEMPLATE_HEADINGS.flatMap((heading) => [
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInspector, setImageInspector] = useState<ImageInspectorTarget | null>(null);
  const editorUiRef = useRef<ReviewEditorUI | null>(null);
  useToastError(error, () => setError(null));
  const savedDocJson = useRef('');

  const canEdit = can('content.edit');

  const conversionCtx = useMemo<ConversionContext>(() => {
    const mediaById: NonNullable<ConversionContext['mediaById']> = {};
    for (const m of ws.related.mediaAll) {
      mediaById[m.id] = { url: m.url ? String(m.url) : undefined, altText: m.altText ? String(m.altText) : undefined };
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
        initial = review.blocks as ReviewBlock[];
      } else if (Array.isArray(review.sections) && review.sections.length > 0) {
        // Legacy sections -> blocks (heading + paragraph), one-time client migration.
        initial = (review.sections as { heading: string; body: string; level?: number }[]).flatMap(
          (s) => [
            makeBlock(s.level === 3 ? 'h3' : 'h2', { text: s.heading }),
            makeBlock('paragraph', { text: s.body }),
          ],
        );
      } else if (review.intro) {
        initial = [makeBlock('h2', { text: 'Introduction' }), makeBlock('paragraph', { text: review.intro })];
      }
    }
    devRoundTripCheck(initial, conversionCtx);
    const nextDoc = blocksToDoc(initial, conversionCtx);
    setDoc(nextDoc);
    setContentKey((k) => k + 1);
    savedDocJson.current = JSON.stringify(nextDoc);
    setLoadedFromId(review?.id ?? null);
    setTemplateDismissed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id, ws.relatedLoading]);

  const isDirty = useMemo(() => JSON.stringify(doc) !== savedDocJson.current, [doc]);
  const analysis = useMemo(() => analyzeDoc(doc), [doc]);

  // Unsaved-change protection for the document.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const handleChange = useCallback((next: JSONDoc) => setDoc(next), []);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const blocks = docToBlocks(doc);
      const now = Date.now();
      const fields: Record<string, unknown> = {
        blocks,
        lastEditedBy: me.email,
        lastEditedAt: now,
      };
      if (review) {
        // Keep a bounded revision history of the previously saved document.
        const prevBlocks = Array.isArray(review.blocks) ? review.blocks : null;
        if (prevBlocks && prevBlocks.length > 0) {
          const revisions = Array.isArray(review.revisions) ? [...review.revisions] : [];
          revisions.unshift({
            savedAt: review.lastEditedAt ?? review.updatedAt ?? now,
            savedBy: review.lastEditedBy,
            blocks: prevBlocks,
          });
          fields.revisions = revisions.slice(0, MAX_REVISIONS);
        }
        await dataApi.update('reviews', review.id, fields);
      } else {
        const created = await dataApi.create('reviews', fields, {
          product: ws.productId,
          author: ws.links.author ?? null,
          factChecker: ws.links.factChecker ?? null,
        });
        // Prevent the load effect from resetting the editor once the newly
        // created review arrives from refreshRelated.
        setLoadedFromId(created.id);
      }
      savedDocJson.current = JSON.stringify(doc);
      setSavedAt(Date.now());
      await ws.refreshRelated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function restoreRevision(rev: { savedAt: number; blocks: ReviewBlock[] }) {
    if (
      !confirm(
        `Restore the revision from ${fmtDate(rev.savedAt)}? Unsaved changes will be replaced (nothing is stored until you save).`,
      )
    )
      return;
    const nextDoc = blocksToDoc(rev.blocks, conversionCtx);
    setDoc(nextDoc);
    setContentKey((k) => k + 1);
    setShowRevisions(false);
  }

  function applyTemplate() {
    const nextDoc = templateDoc();
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
      {isDirty ? (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved
        </span>
      ) : savedAt ? (
        <span className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
          <Icon name="check" className="!text-[13px]" /> Saved
        </span>
      ) : null}
      <Button className="text-xs" onClick={() => void save()} disabled={busy || !isDirty}>
        {busy ? 'Saving…' : 'Save review'}
      </Button>
    </>
  ) : undefined;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-4">
        {/* Document meta row (the editor renders its own sticky toolbar) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Icon name="article" className="!text-[16px] text-slate-400" />
            <span>
              {analysis.words.toLocaleString()} word{analysis.words === 1 ? '' : 's'}
            </span>
            {review?.lastEditedAt && (
              <span>
                · last edited {fmtDate(review.lastEditedAt)}
                {review.lastEditedBy ? ` by ${review.lastEditedBy}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {revisions.length > 0 && (
              <Button variant="ghost" className="text-xs" onClick={() => setShowRevisions((v) => !v)}>
                <Icon name="history" className="!text-[15px]" /> Revisions ({revisions.length})
              </Button>
            )}
          </div>
        </div>

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
              Start from the standard section outline (Introduction through Final Thoughts — plain
              editable headings), or start blank and type <code>/</code> to insert blocks.
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

        <Suspense fallback={<Spinner />}>
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

      <div className="space-y-3">
        {/* Article stats + validation warnings */}
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Article</h3>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Words</dt>
              <dd className="text-slate-800 dark:text-slate-200">{analysis.words.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Reading time</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                {analysis.empty ? '—' : `~${readingMinutes} min`}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Review status</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                {review ? 'Saved draft' : 'Not created yet'}
                {isDirty ? ' · unsaved changes' : ''}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Last saved</dt>
              <dd className="text-slate-800 dark:text-slate-200">{lastSaved ? fmtDate(lastSaved) : '—'}</dd>
            </div>
          </dl>
          {warnings.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Warnings</p>
              <ul className="space-y-1.5">
                {warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <Icon name="warning" className="mt-px !text-[14px] shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <CompletionSidebar />

        {imageInspector && canEdit && editorUiRef.current && (
          <ImageInspectorPanel
            target={imageInspector}
            onClose={() => setImageInspector(null)}
            openImagePicker={editorUiRef.current.openImagePicker}
          />
        )}
      </div>
    </div>
  );
}
