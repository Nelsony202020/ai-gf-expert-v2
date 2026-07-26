import { useEffect, useRef, useState } from 'react';
import type { EntityRow } from './api';
import { Icon } from './ui';

interface AuthorSelectProps {
  authors: EntityRow[];
  value: string | null;
  onChange: (id: string | null) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  invalid?: boolean;
}

function AuthorAvatar({ author, size = 'sm' }: { author?: EntityRow | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const avatarUrl = author?.avatarUrl ? String(author.avatarUrl) : null;
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className={`${dim} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300`}
    >
      {author?.name ? String(author.name).charAt(0).toUpperCase() : '?'}
    </span>
  );
}

export function AuthorSelect({
  authors,
  value,
  onChange,
  allowEmpty = true,
  emptyLabel = '— none —',
  invalid = false,
}: AuthorSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = value ? authors.find((a) => a.id === value) : null;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center gap-2 rounded-md border bg-white px-2.5 py-1.5 text-left text-sm transition-colors dark:bg-slate-900 ${
          invalid
            ? 'border-red-400 dark:border-red-500'
            : 'border-slate-300 hover:border-slate-400 dark:border-slate-600'
        }`}
      >
        {selected ? (
          <>
            <AuthorAvatar author={selected} />
            <span className="min-w-0 flex-1 truncate text-slate-900 dark:text-slate-100">
              {String(selected.name)}
            </span>
          </>
        ) : (
          <span className="flex-1 text-slate-400">{emptyLabel}</span>
        )}
        <Icon name="expand_more" className="!text-[18px] shrink-0 text-slate-400" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {allowEmpty && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  !value ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300' : 'text-slate-500'
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Icon name="person_off" className="!text-[16px] text-slate-400" />
                </span>
                {emptyLabel}
              </button>
            </li>
          )}
          {authors.map((author) => (
            <li key={author.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === author.id}
                onClick={() => {
                  onChange(author.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  value === author.id
                    ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                <AuthorAvatar author={author} />
                <span className="min-w-0 flex-1 truncate">{String(author.name)}</span>
                {author.role ? (
                  <span className="shrink-0 text-xs text-slate-400">{String(author.role)}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
