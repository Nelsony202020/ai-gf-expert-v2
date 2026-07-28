// Right-side drawer for internal tester notes on an evidence row.

import { useEffect, useState } from 'react';
import type { EntityRow } from '../api';
import { Button, Icon, TextArea } from '../ui';
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
  onSave: (notes: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(notes);

  useEffect(() => {
    const t = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    setDraft(notes);
  }, [notes, def.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleClose() {
    setOpen(false);
    window.setTimeout(onClose, 220);
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20 transition-opacity"
        style={{ opacity: open ? 1 : 0 }}
        aria-label="Close note drawer"
        onClick={handleClose}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl transition-transform dark:border-slate-700 dark:bg-slate-900 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Internal note</p>
            <QuestionLabel def={def} categorySlug={categorySlug} />
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            onClick={handleClose}
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <TextArea
            rows={8}
            value={draft}
            placeholder="Tester notes (internal only — not shown on public pages)"
            onChange={(e) => setDraft(e.target.value)}
          />
          <p className="text-xs text-slate-400">Saved with “Save all results” on this session.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(draft.trim());
              handleClose();
            }}
          >
            Done
          </Button>
        </div>
      </aside>
    </>
  );
}
