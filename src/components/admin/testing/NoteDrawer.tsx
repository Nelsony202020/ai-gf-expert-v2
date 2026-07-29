// Right-side drawer for internal tester notes on an evidence row.

import { useEffect, useRef, useState } from 'react';
import type { EntityRow } from '../api';
import { Button, DrawerCloseButton, TextArea } from '../ui';
import { DRAWER_UNMOUNT_MS } from '../../../lib/drawer/animate';
import { QuestionLabel } from './QuestionLabel';

export function NoteDrawer({
  def,
  categorySlug,
  notes,
  onClose,
  onSave,
}: {
  def: EntityRow;
  categorySlug?: string;
  notes: string;
  onClose: () => void;
  onSave: (notes: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(notes);
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
    setDraft(notes);
    savedRef.current = false;
  }, [notes, def.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') void persistAndClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function persistAndClose() {
    const trimmed = draftRef.current.trim();
    const original = notes.trim();
    const unchanged = trimmed === original;

    if (savedRef.current || unchanged) {
      setOpen(false);
      window.setTimeout(onClose, DRAWER_UNMOUNT_MS);
      return;
    }

    setSaving(true);
    try {
      await onSave(trimmed);
      savedRef.current = true;
    } finally {
      setSaving(false);
    }
    setOpen(false);
    window.setTimeout(onClose, DRAWER_UNMOUNT_MS);
  }

  function handleClose() {
    void persistAndClose();
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ease-out"
        style={{ opacity: open ? 1 : 0 }}
        aria-label="Close note drawer"
        onClick={handleClose}
      />
      <aside
        className={`testing-proof-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-slate-900 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Internal note</p>
            <QuestionLabel def={def} categorySlug={categorySlug} />
          </div>
          <DrawerCloseButton onClick={handleClose} />
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <TextArea
            rows={8}
            value={draft}
            placeholder="Tester notes (internal only — not shown on public pages)"
            onChange={(e) => setDraft(e.target.value)}
          />
          <p className="text-xs text-slate-400">Notes save automatically when you close this panel.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Close
          </Button>
          <Button onClick={handleClose} disabled={saving}>
            {saving ? 'Saving…' : 'Done'}
          </Button>
        </div>
      </aside>
    </>
  );
}
