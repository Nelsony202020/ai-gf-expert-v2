// Privacy note drawer: read-only AI finding + editable reviewer note.

import { useEffect, useRef, useState } from 'react';
import type { EntityRow } from '../api';
import { Button, DrawerCloseButton, TextArea } from '../ui';
import { DRAWER_UNMOUNT_MS } from '../../../lib/drawer/animate';
import {
  aiPrivacyConfidenceLabel,
  aiPrivacyStatusLabel,
  getAiPrivacyDisplayStatus,
  readAiPrivacyDetails,
  resolveAiPrivacyRationale,
} from '../../../lib/ai-privacy/clientHelpers';
import { isAiPrivacySlug } from '../../../lib/ai-privacy/types';
import { QuestionLabel } from './QuestionLabel';

function AiFindingSection({
  def,
  result,
  onViewFullProof,
}: {
  def: EntityRow;
  result: EntityRow | null;
  onViewFullProof?: () => void;
}) {
  const slug = String(def.slug ?? '');
  if (!isAiPrivacySlug(slug)) return null;

  const ai = readAiPrivacyDetails(result);
  if (!ai) return null;

  const displayStatus = getAiPrivacyDisplayStatus(ai, Boolean(result?.rawValue));
  const rationale = resolveAiPrivacyRationale(ai, result);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copyPhrase(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <div>
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">AI finding</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">Read-only · generated from uploaded policies</p>
      </div>

      {displayStatus && (
        <dl className="grid gap-1 text-xs">
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-slate-500">Status</dt>
            <dd className="text-slate-800 dark:text-slate-100">{aiPrivacyStatusLabel(displayStatus)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-slate-500">Confidence</dt>
            <dd className="text-slate-800 dark:text-slate-100">{aiPrivacyConfidenceLabel(ai.confidence)}</dd>
          </div>
        </dl>
      )}

      {rationale && (
        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{rationale}</p>
      )}

      {ai.evidence.slice(0, 2).map((ev, i) => (
        <article
          key={`${ev.sourceDocumentId}-${i}`}
          className="space-y-1.5 rounded-md border border-slate-200/90 bg-white/80 p-2.5 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Source</p>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-100">{ev.sourceLabel}</p>
          <p className="text-[11px] text-slate-500">Section: {ev.section || 'Section not identified'}</p>
          <blockquote className="border-l-2 border-slate-300 pl-2 text-xs leading-relaxed text-slate-700 dark:border-slate-600 dark:text-slate-200">
            “{ev.excerpt}”
          </blockquote>
          {ev.findText && (
            <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
              Control+F: {ev.findText}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {ev.sourceUrl && (
              <a
                href={ev.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
              >
                Open source
              </a>
            )}
            {ev.findText && (
              <button
                type="button"
                className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
                onClick={() => void copyPhrase(ev.findText, `find-${i}`)}
              >
                {copiedKey === `find-${i}` ? 'Copied' : 'Copy phrase'}
              </button>
            )}
          </div>
        </article>
      ))}

      {ai.evidence.length > 0 && onViewFullProof && (
        <button
          type="button"
          className="text-[11px] font-medium text-pink-600 underline underline-offset-2 hover:text-pink-700 dark:text-pink-400"
          onClick={onViewFullProof}
        >
          {ai.evidence.length > 2
            ? `View all ${ai.evidence.length} sources in proof panel`
            : 'View full proof panel'}
        </button>
      )}
    </section>
  );
}

export function PrivacyNoteDrawer({
  def,
  categorySlug,
  result,
  reviewerNotes,
  onClose,
  onSaveNote,
  onViewFullProof,
}: {
  def: EntityRow;
  categorySlug?: string;
  result: EntityRow | null;
  reviewerNotes: string;
  onClose: () => void;
  onSaveNote: (notes: string) => void | Promise<void>;
  onViewFullProof?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(reviewerNotes);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    setDraft(reviewerNotes);
    savedRef.current = false;
  }, [reviewerNotes, def.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') void persistAndClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function persistAndClose() {
    const trimmed = draftRef.current.trim();
    const original = reviewerNotes.trim();
    if (savedRef.current || trimmed === original) {
      setOpen(false);
      window.setTimeout(onClose, DRAWER_UNMOUNT_MS);
      return;
    }

    setSaving(true);
    try {
      await onSaveNote(trimmed);
      savedRef.current = true;
    } finally {
      setSaving(false);
    }
    setOpen(false);
    window.setTimeout(onClose, DRAWER_UNMOUNT_MS);
  }

  async function saveNoteOnly() {
    setSaving(true);
    try {
      await onSaveNote(draftRef.current.trim());
      savedRef.current = true;
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ease-out"
        style={{ opacity: open ? 1 : 0 }}
        aria-label="Close note drawer"
        onClick={() => void persistAndClose()}
      />
      <aside
        className={`testing-proof-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes &amp; AI finding</p>
            <QuestionLabel def={def} categorySlug={categorySlug} />
          </div>
          <DrawerCloseButton onClick={() => void persistAndClose()} />
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <AiFindingSection def={def} result={result} onViewFullProof={onViewFullProof} />
          <section className="space-y-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Reviewer note</h3>
              <p className="text-[11px] text-slate-500">Optional · written by you · never overwritten by AI</p>
            </div>
            <TextArea
              rows={5}
              value={draft}
              placeholder="Your own testing notes (internal only — not shown on public pages)"
              onChange={(e) => setDraft(e.target.value)}
            />
          </section>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <Button variant="secondary" onClick={() => void persistAndClose()} disabled={saving}>
            Close
          </Button>
          <Button onClick={() => void saveNoteOnly()} disabled={saving}>
            {saving ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      </aside>
    </>
  );
}
