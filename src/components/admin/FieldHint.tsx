import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, Toggle } from './ui';

export function FieldHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const placeAbove = rect.top > 120;
    setCoords({
      top: placeAbove ? rect.top - 8 : rect.bottom + 8,
      left: rect.left + rect.width / 2,
      placeAbove,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function reposition() {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const placeAbove = rect.top > 120;
      setCoords({
        top: placeAbove ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
        placeAbove,
      });
    }
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  const tooltip =
    open && coords
      ? createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className={`pointer-events-none fixed z-[200] w-56 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-normal normal-case leading-snug text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${
              coords.placeAbove ? '-translate-y-full' : ''
            }`}
          >
            {text}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label="More information"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-1 inline-flex rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <Icon name="info" className="!text-[14px]" />
      </button>
      {tooltip}
    </>
  );
}

export function ToggleWithHint({
  checked,
  onChange,
  label,
  hint,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean | undefined;
  onChange: (value: boolean) => void;
  label?: string;
  hint?: string;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div className={`inline-flex items-center ${className ?? ''}`}>
      <Toggle checked={checked} onChange={onChange} label={label} aria-label={ariaLabel} />
      {hint ? <FieldHint text={hint} /> : null}
    </div>
  );
}

export function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span className={`text-xs tabular-nums ${over ? 'text-red-600' : 'text-slate-400'}`}>
      {len} / {max}
    </span>
  );
}

export function PreviewViewToggle({
  view,
  onChange,
}: {
  view: 'desktop' | 'mobile';
  onChange: (view: 'desktop' | 'mobile') => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 p-0.5 text-xs dark:border-slate-700">
      <button
        type="button"
        onClick={() => onChange('desktop')}
        className={`rounded px-2 py-0.5 font-medium transition-colors ${
          view === 'desktop'
            ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Desktop
      </button>
      <button
        type="button"
        onClick={() => onChange('mobile')}
        className={`rounded px-2 py-0.5 font-medium transition-colors ${
          view === 'mobile'
            ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Mobile
      </button>
    </div>
  );
}
