// Segmented session progress navigator with accessible tooltips.

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui';
import {
  sessionStatusLabel,
  type SessionProgressSnapshot,
  type SessionStatus,
} from './progress';
import './testing-ui.css';

function segmentAriaLabel(s: SessionProgressSnapshot): string {
  const parts = [
    `Session ${s.sessionIndex + 1}`,
    s.sessionTitle,
    sessionStatusLabel(s.status),
  ];
  if (s.requiredTotal > 0) {
    parts.push(`${s.requiredComplete} of ${s.requiredTotal} required attempts complete`);
  }
  return parts.join('. ');
}

function SegmentIcon({ status }: { status: SessionStatus }) {
  switch (status) {
    case 'complete':
      return <Icon name="check" className="!text-[11px] text-green-600" aria-hidden />;
    case 'blocked':
      return <Icon name="warning" className="!text-[11px] text-amber-600" aria-hidden />;
    case 'needs_review':
      return <Icon name="rate_review" className="!text-[11px] text-amber-700" aria-hidden />;
    case 'skipped':
      return <span className="text-[10px] font-bold text-slate-400" aria-hidden>—</span>;
    case 'in_progress':
      return <span className="sr-only">In progress</span>;
    default:
      return null;
  }
}

function SegmentTooltip({
  snapshot,
  isCurrent,
  below,
}: {
  snapshot: SessionProgressSnapshot;
  isCurrent: boolean;
  below: boolean;
}) {
  return (
    <div
      className={`testing-segment-tooltip ${below ? 'testing-segment-tooltip--below' : ''} relative w-52 rounded-lg border border-slate-200 bg-white p-2.5 text-left shadow-lg dark:border-slate-600 dark:bg-slate-800`}
      role="tooltip"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Session {snapshot.sessionIndex + 1}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {snapshot.sessionTitle}
      </p>
      <p className="text-xs text-slate-500">{snapshot.categoryName}</p>
      <p className="mt-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
        {sessionStatusLabel(snapshot.status)}
        {isCurrent ? ' · Current' : ''}
      </p>
      {snapshot.requiredTotal > 0 ? (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {snapshot.requiredComplete} of {snapshot.requiredTotal} attempts complete
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">No required inputs</p>
      )}
      {snapshot.missingRequiredLabels.length > 0 && snapshot.status !== 'complete' && (
        <div className="mt-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-700">
          <p className="text-[10px] font-medium uppercase text-slate-400">Missing</p>
          <ul className="mt-0.5 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            {snapshot.missingRequiredLabels.map((label) => (
              <li key={label} className="truncate">
                • {label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SessionProgressNavigator({
  sessions,
  currentIndex,
  onSelect,
  compact = false,
  checkpointAfterIndices = [],
}: {
  sessions: SessionProgressSnapshot[];
  currentIndex: number;
  onSelect: (index: number) => void;
  compact?: boolean;
  /** Session indices after which a category checkpoint divider is shown. */
  checkpointAfterIndices?: number[];
}) {
  const listId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number; below: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tooltip is portaled to <body> (fixed position) so it can't be clipped by
  // the modal's overflow-hidden panel or end up behind the overlay.
  const positionTip = useCallback((index: number) => {
    const btn = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-segment-index="${index}"]`,
    );
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const below = r.top < 250; // not enough room above → open downward
    const half = 104 + 8; // half tooltip width (w-52) + viewport padding
    const left = Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half);
    setTipPos({ top: below ? r.bottom + 8 : r.top - 8, left, below });
  }, []);

  const openTip = useCallback(
    (index: number) => {
      positionTip(index);
      setOpenIndex(index);
    },
    [positionTip],
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Element;
      if (containerRef.current?.contains(target)) return;
      if (target.closest?.('.testing-segment-tooltip')) return;
      setOpenIndex(null);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    const reposition = () => positionTip(openIndex);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [openIndex, positionTip]);

  function segmentClass(status: SessionStatus, isCurrent: boolean): string {
    const base =
      'testing-segment relative flex shrink-0 items-center justify-center rounded-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1';
    const size = compact ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-[11px]';

    if (isCurrent) {
      return `${base} ${size} border-pink-500 bg-pink-600 text-white testing-segment--current`;
    }
    switch (status) {
      case 'complete':
        return `${base} ${size} border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40`;
      case 'blocked':
        return `${base} ${size} border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40`;
      case 'needs_review':
        return `${base} ${size} border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30`;
      case 'skipped':
        return `${base} ${size} border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800`;
      case 'in_progress':
        return `${base} ${size} border-pink-200 bg-pink-50 dark:border-pink-900/50 dark:bg-pink-950/30`;
      default:
        return `${base} ${size} border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80`;
    }
  }

  function onSegmentKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(idx);
      if (openIndex === idx) setOpenIndex(null);
      else openTip(idx);
      return;
    }
    let next = idx;
    if (e.key === 'ArrowRight') next = Math.min(sessions.length - 1, idx + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = sessions.length - 1;
    else return;
    e.preventDefault();
    const btn = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-segment-index="${next}"]`,
    );
    btn?.focus();
  }

  if (sessions.length === 0) return null;

  return (
    <div ref={containerRef} className="min-w-0">
      <div
        className="flex flex-wrap gap-1"
        role="tablist"
        aria-label="Test sessions"
        id={listId}
      >
        {sessions.map((s) => {
          const isCurrent = s.sessionIndex === currentIndex;
          const showBreak = checkpointAfterIndices.includes(s.sessionIndex);
          return (
            <div key={s.sessionKey} className="flex items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  role="tab"
                  data-segment-index={s.sessionIndex}
                  aria-selected={isCurrent}
                  aria-label={segmentAriaLabel(s)}
                  aria-describedby={openIndex === s.sessionIndex ? `${listId}-tip-${s.sessionIndex}` : undefined}
                  className={segmentClass(s.status, isCurrent)}
                  onClick={() => {
                    onSelect(s.sessionIndex);
                    if (openIndex === s.sessionIndex) setOpenIndex(null);
                    else openTip(s.sessionIndex);
                  }}
                  onMouseEnter={() => openTip(s.sessionIndex)}
                  onMouseLeave={() => setOpenIndex((prev) => (prev === s.sessionIndex ? null : prev))}
                  onFocus={() => openTip(s.sessionIndex)}
                  onBlur={(e) => {
                    const next = e.relatedTarget as Element | null;
                    if (
                      !e.currentTarget.parentElement?.contains(next) &&
                      !next?.closest?.('.testing-segment-tooltip')
                    ) {
                      setOpenIndex(null);
                    }
                  }}
                  onKeyDown={(e) => onSegmentKeyDown(e, s.sessionIndex)}
                >
                  {isCurrent ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                  ) : (
                    <SegmentIcon status={s.status} />
                  )}
                </button>
              </div>
              {showBreak && (
                <span
                  className="flex h-5 w-4 shrink-0 items-center justify-center text-slate-300 dark:text-slate-600"
                  title="Category checkpoint"
                  aria-hidden
                >
                  |
                </span>
              )}
            </div>
          );
        })}
      </div>

      {openIndex !== null &&
        tipPos &&
        (() => {
          const snapshot = sessions.find((s) => s.sessionIndex === openIndex);
          if (!snapshot) return null;
          return createPortal(
            <div
              id={`${listId}-tip-${openIndex}`}
              style={{
                position: 'fixed',
                top: tipPos.top,
                left: tipPos.left,
                transform: tipPos.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
                zIndex: 99999,
              }}
            >
              <SegmentTooltip
                snapshot={snapshot}
                isCurrent={snapshot.sessionIndex === currentIndex}
                below={tipPos.below}
              />
            </div>,
            document.body,
          );
        })()}
    </div>
  );
}
