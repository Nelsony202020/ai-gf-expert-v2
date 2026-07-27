import { useState } from 'react';
import { Button, Icon } from '../../ui';
import type { CategoryEvidenceEntry } from './useCategoryEvidence';

function formatEvidenceLabel(entry: CategoryEvidenceEntry): string {
  if (entry.publicResult?.trim()) return `${entry.name} — ${entry.publicResult.trim()}`;
  return entry.name;
}

export function CategoryEvidencePicker({
  entries,
  selectedSlugs,
  onChange,
  disabled,
}: {
  entries: CategoryEvidenceEntry[];
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const completed = entries.filter((e) => e.complete);

  function toggle(slug: string) {
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter((s) => s !== slug));
    } else {
      onChange([...selectedSlugs, slug]);
    }
  }

  if (completed.length === 0) return null;

  return (
    <div className="space-y-2">
      {selectedSlugs.length > 0 && (
        <ul className="space-y-1">
          {selectedSlugs.map((slug) => {
            const entry = entries.find((e) => e.slug === slug);
            return (
              <li
                key={slug}
                className="flex items-center justify-between gap-2 border-b border-slate-100 py-1 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                <span className="min-w-0 truncate">{entry ? formatEvidenceLabel(entry) : slug}</span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label="Remove linked evidence"
                  onClick={() => toggle(slug)}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:text-red-600"
                >
                  <Icon name="close" className="!text-[14px]" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        variant="secondary"
        className="!py-1 text-xs"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="link" className="!text-[14px]" />
        Link evidence
      </Button>
      {open && (
        <div
          className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          role="listbox"
          aria-label="Category evidence"
        >
          {completed.map((entry) => {
            const selected = selectedSlugs.includes(entry.slug);
            return (
              <button
                key={entry.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={disabled}
                onClick={() => toggle(entry.slug)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                  selected ? 'bg-pink-50/80 dark:bg-pink-950/20' : ''
                }`}
              >
                <Icon
                  name={selected ? 'check_box' : 'check_box_outline_blank'}
                  className="!text-[16px] shrink-0 text-slate-500"
                />
                <span className="min-w-0 text-slate-700 dark:text-slate-300">{formatEvidenceLabel(entry)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CategoryEvidenceList({
  entries,
  loading,
}: {
  entries: CategoryEvidenceEntry[];
  loading?: boolean;
}) {
  const completed = entries.filter((e) => e.complete);
  if (loading) return <p className="text-xs text-slate-400">Loading evidence…</p>;
  if (completed.length === 0) return null;

  return (
    <ul className="mt-2 space-y-0.5 border-t border-slate-100 pt-2 dark:border-slate-800">
      {completed.map((entry) => (
        <li key={entry.id} className="text-xs text-slate-600 dark:text-slate-400">
          {formatEvidenceLabel(entry)}
        </li>
      ))}
    </ul>
  );
}
