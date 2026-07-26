// Tooltip that renders in a portal with fixed positioning so it never clips
// behind table headers, overflow containers, or modal chrome.

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui';

export function TestingHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  function reposition() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const above = r.top < 120;
    setCoords({
      top: above ? r.bottom + 8 : r.top - 8,
      left: r.left + r.width / 2,
      above,
    });
  }

  useEffect(() => {
    if (!open) return;
    reposition();
    function onScroll() {
      reposition();
    }
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label="More information"
        onMouseEnter={() => {
          reposition();
          setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          reposition();
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        className="ml-0.5 inline-flex shrink-0 rounded text-pink-400 hover:text-pink-600 dark:hover:text-pink-300"
      >
        <Icon name="info" className="!text-[14px]" />
      </button>
      {open &&
        coords &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: coords.above ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
              zIndex: 99999,
              maxWidth: '16rem',
            }}
            className="pointer-events-none rounded-md border border-pink-200 bg-white px-2.5 py-2 text-xs font-normal normal-case leading-snug text-slate-600 shadow-lg dark:border-pink-900/50 dark:bg-slate-900 dark:text-slate-300"
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  );
}
