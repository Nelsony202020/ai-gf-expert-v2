// Shared admin UI primitives (Tailwind-based, no external UI library).

import { useEffect, useState, type ReactNode } from 'react';
import { FieldHint } from './FieldHint';

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/** Text close control shared across admin drawers (matches review calc drawer). */
export function DrawerCloseButton({
  onClick,
  className = '',
  ariaLabel = 'Close',
}: {
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`drawer-close-text shrink-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${className}`}
    >
      <span aria-hidden="true">✕</span> Close
    </button>
  );
}

export function YouTubeIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.7 15.5V8.5L15.8 12l-6.1 3.5z" />
    </svg>
  );
}

const inputInsetClass =
  'w-full border-0 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-0 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

/** Input with a separated gray prefix box (icons, currency symbols, etc.). */
export function InputWithPrefix({
  prefix,
  children,
  className = '',
  invalid = false,
}: {
  prefix: ReactNode;
  children: ReactNode;
  className?: string;
  invalid?: boolean;
}) {
  return (
    <div
      className={`flex overflow-hidden rounded-md border bg-white dark:bg-slate-900 ${
        invalid
          ? 'border-red-400 dark:border-red-500'
          : 'border-slate-300 dark:border-slate-600 focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500'
      } ${className}`}
    >
      <div className="flex shrink-0 items-center justify-center border-r border-slate-200 bg-slate-100 px-2.5 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        {prefix}
      </div>
      <div className="min-w-0 flex-1 [&_input]:rounded-none [&_input]:border-0 [&_input]:shadow-none [&_input]:ring-0">
        {children}
      </div>
    </div>
  );
}

export function InsetTextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputInsetClass} ${props.className ?? ''}`} />;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-pink-600 text-white hover:bg-pink-700 disabled:bg-pink-300 dark:bg-pink-600 dark:hover:bg-pink-500',
    secondary:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    ghost:
      'text-slate-600 hover:bg-slate-100 disabled:text-slate-300 dark:text-slate-400 dark:hover:bg-slate-800',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode;
  tone?: 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'pink';
}) {
  const tones: Record<string, string> = {
    gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'pink' {
  switch (status) {
    case 'published':
      return 'green';
    case 'in_review':
    case 'ready_for_review':
    case 'draft':
      return 'amber';
    case 'scheduled':
    case 'approved':
      return 'blue';
    case 'archived':
    case 'superseded':
      return 'red';
    default:
      return 'gray';
  }
}

export function Card({
  title,
  children,
  actions,
  className = '',
}: {
  title?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Field({
  label,
  help,
  hint,
  required,
  children,
}: {
  label: ReactNode;
  help?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center text-xs font-medium text-slate-600 dark:text-slate-400">
        <span>
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </span>
        {hint ? <FieldHint text={hint} /> : null}
      </span>
      {children}
      {help && !hint ? <span className="mt-1 block text-xs text-slate-400">{help}</span> : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

/**
 * Textarea bound to a string[] ("one item per line"). Keeps the raw text while
 * focused so Enter and trailing spaces aren't stripped mid-edit; the stored
 * array is normalized (trimmed, empty lines dropped) on every change.
 */
export function LinesTextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled,
}: {
  value: string[] | undefined;
  onChange: (lines: string[]) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const joined = Array.isArray(value) ? value.join('\n') : '';
  return (
    <TextArea
      rows={rows}
      value={draft ?? joined}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(
          e.target.value
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

/**
 * Repeatable structured list editor: one editable row per item with add,
 * delete, and keyboard-accessible move up/down. Use instead of newline
 * textareas for content the frontend renders as separate rows.
 */
export function StringListEditor({
  value,
  onChange,
  placeholder,
  addLabel = 'Add item',
  emptyHint,
  maxRecommended,
  maxItemLength,
  disabled,
}: {
  value: string[] | undefined;
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  emptyHint?: string;
  /** Soft warning when the list grows beyond this. */
  maxRecommended?: number;
  /** Soft warning when an item exceeds this length. */
  maxItemLength?: number;
  disabled?: boolean;
}) {
  const items = Array.isArray(value) ? value : [];

  function update(index: number, text: string) {
    const next = [...items];
    next[index] = text;
    onChange(next);
  }
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-1.5">
      {items.length === 0 && emptyHint && (
        <p className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400 dark:border-slate-700">
          {emptyHint}
        </p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1">
          <TextInput
            value={item}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => update(i, e.target.value)}
            aria-label={`Item ${i + 1}`}
          />
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              aria-label={`Move item ${i + 1} up`}
              disabled={disabled || i === 0}
              onClick={() => move(i, -1)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800"
            >
              <Icon name="arrow_upward" className="!text-[15px]" />
            </button>
            <button
              type="button"
              aria-label={`Move item ${i + 1} down`}
              disabled={disabled || i === items.length - 1}
              onClick={() => move(i, 1)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800"
            >
              <Icon name="arrow_downward" className="!text-[15px]" />
            </button>
            <button
              type="button"
              aria-label={`Remove item ${i + 1}`}
              disabled={disabled}
              onClick={() => remove(i)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
            >
              <Icon name="close" className="!text-[15px]" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...items, ''])}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500 hover:border-pink-400 hover:text-pink-600 dark:border-slate-600"
        >
          <Icon name="add" className="!text-[14px]" /> {addLabel}
        </button>
        {maxRecommended !== undefined && items.length > maxRecommended && (
          <span className="text-xs text-amber-700 dark:text-amber-400">
            Recommended maximum is {maxRecommended} items.
          </span>
        )}
        {maxItemLength !== undefined && items.some((i) => i.length > maxItemLength) && (
          <span className="text-xs text-amber-700 dark:text-amber-400">
            Keep items under ~{maxItemLength} characters.
          </span>
        )}
      </div>
    </div>
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  className = '',
  disabled,
  'aria-label': ariaLabel,
}: {
  checked: boolean | undefined;
  onChange: (value: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  const on = Boolean(checked);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`inline-flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
          on ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            on ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
      {label ? <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span> : null}
    </button>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-pink-600" />
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="p-8 text-center text-sm text-slate-400">{message}</div>;
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Sticky footer outside the scroll region (e.g. Cancel / Save). */
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`flex max-h-[min(900px,calc(100dvh-2rem))] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-slate-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon name="close" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function useAsync() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, setError, run };
}

export function fmtDate(ms?: number | string | null): string {
  if (!ms) return '—';
  const d = typeof ms === 'string' ? new Date(ms) : new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
