// Testing progress header: position, overall completion, session navigator.

import { useState } from 'react';
import { Button, Icon } from '../ui';
import type { RunProgressSnapshot, SessionProgressSnapshot } from './progress';
import { SessionProgressNavigator } from './SessionProgressNavigator';
import {
  TestingMissingRequiredPanel,
  type MissingRequiredRow,
} from './TestingMissingRequiredPanel';

export function TestingProgressHeader({
  productName,
  runName,
  currentCategoryName,
  currentSessionTitle,
  runProgress,
  currentSessionProgress,
  showResumeBanner,
  onResumeNext,
  onViewAllSessions,
  onSelectSession,
  onJumpToMissing,
  currentSessionIndex,
  checkpointAfterIndices,
  trailing,
}: {
  productName: string;
  runName: string;
  currentCategoryName: string;
  currentSessionTitle: string;
  sessionNumber: number;
  totalSessions: number;
  runProgress: RunProgressSnapshot;
  currentSessionProgress: SessionProgressSnapshot | null;
  showResumeBanner?: boolean;
  onResumeNext?: () => void;
  onViewAllSessions?: () => void;
  onSelectSession: (index: number) => void;
  onJumpToMissing?: (sessionIndex: number, defId: string) => void;
  currentSessionIndex: number;
  checkpointAfterIndices?: number[];
  trailing?: React.ReactNode;
}) {
  const [allOpen, setAllOpen] = useState(false);

  return (
    <div className="shrink-0 border-b border-slate-200/80 px-4 py-2 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-500">
            {productName} · {runName}
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
            {currentCategoryName}
          </p>
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {currentSessionTitle}
          </h2>
          <p className="text-[11px] text-slate-400">
            {runProgress.completedRequired}/{runProgress.totalRequired} required · {runProgress.completionPct}%
          </p>
        </div>
        {trailing}
      </div>

      <div className="mt-2">
        <SessionProgressNavigator
          sessions={runProgress.sessions}
          currentIndex={currentSessionIndex}
          onSelect={onSelectSession}
          onJumpToMissing={onJumpToMissing}
          checkpointAfterIndices={checkpointAfterIndices}
        />
      </div>

      {runProgress.totalRequired > 0 && (
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="testing-progress-bar h-full rounded-full transition-all"
            style={{ width: `${runProgress.completionPct}%` }}
            role="progressbar"
            aria-valuenow={runProgress.completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      {onViewAllSessions && (
        <div className="mt-1.5">
          <button
            type="button"
            className="text-[11px] font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400"
            onClick={() => setAllOpen((o) => !o)}
            aria-expanded={allOpen}
          >
            {allOpen ? 'Hide sessions' : 'All sessions'}
          </button>
          {allOpen && (
            <ul className="mt-1 max-h-36 space-y-0.5 overflow-y-auto rounded border border-slate-200 p-1.5 dark:border-slate-700">
              {runProgress.sessions.map((s) => (
                <li key={s.sessionKey}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      s.sessionIndex === currentSessionIndex
                        ? 'bg-pink-50 font-medium text-pink-800 dark:bg-pink-950/30 dark:text-pink-200'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => {
                      onSelectSession(s.sessionIndex);
                      setAllOpen(false);
                    }}
                  >
                    <span className="min-w-0 truncate">
                      {s.sessionIndex + 1}. {s.sessionTitle}
                    </span>
                    <span className="ml-2 shrink-0 tabular-nums text-slate-400">
                      {s.requiredComplete}/{s.requiredTotal}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Compact resume row — sits below layout toggle. */
export function TestingResumeRow({
  onResume,
}: {
  onResume: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-1.5 dark:border-slate-800">
      <Button variant="secondary" className="!px-2 !py-0.5 text-[11px]" onClick={onResume}>
        Resume testing
      </Button>
      <span className="text-[11px] text-slate-500">Continue where you left off</span>
    </div>
  );
}

/** Compact run-card variant for TestingTab overview. */
export function TestingRunProgressSummary({
  runProgress,
  currentSession,
  onResume,
  onSelectSession,
  onViewAll,
  missingRows,
  onJumpToMissing,
  pricingTabHref,
}: {
  runProgress: RunProgressSnapshot;
  currentSession: SessionProgressSnapshot | null;
  onResume: () => void;
  onSelectSession?: (index: number) => void;
  onViewAll?: () => void;
  missingRows?: MissingRequiredRow[];
  onJumpToMissing?: (sessionIndex: number, defId: string) => void;
  pricingTabHref?: string;
}) {
  const [allOpen, setAllOpen] = useState(false);
  const hasIncomplete = runProgress.remainingRequired > 0;

  return (
    <div className="space-y-2">
      {missingRows && missingRows.length > 0 && onJumpToMissing && (
        <TestingMissingRequiredPanel
          items={missingRows}
          onJumpToSession={onJumpToMissing}
          pricingTabHref={pricingTabHref}
        />
      )}

      <div>
        {currentSession && hasIncomplete && (
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {currentSession.categoryName} → {currentSession.sessionTitle}
          </p>
        )}
        <p className="text-[11px] text-slate-400">
          {runProgress.completedRequired}/{runProgress.totalRequired} required · {runProgress.completionPct}%
        </p>
      </div>

      {runProgress.totalRequired > 0 && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-pink-600 transition-all duration-300"
            style={{ width: `${runProgress.completionPct}%` }}
            role="progressbar"
            aria-valuenow={runProgress.completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      <SessionProgressNavigator
        sessions={runProgress.sessions}
        currentIndex={currentSession?.sessionIndex ?? runProgress.resumeIndex}
        onSelect={(idx) => (onSelectSession ? onSelectSession(idx) : onResume())}
        onJumpToMissing={onJumpToMissing}
        compact
      />

      {onViewAll && (
        <button
          type="button"
          className="text-[11px] font-medium text-pink-600 hover:text-pink-700"
          onClick={() => setAllOpen((o) => !o)}
          aria-expanded={allOpen}
        >
          {allOpen ? 'Hide sessions' : 'All sessions'}
        </button>
      )}
      {allOpen && onViewAll && (
        <ul className="max-h-32 space-y-0.5 overflow-y-auto text-[11px]">
          {runProgress.sessions.map((s) => (
            <li key={s.sessionKey} className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="truncate">
                {s.sessionIndex + 1}. {s.sessionTitle}
              </span>
              <span className="ml-2 shrink-0 tabular-nums">
                {s.requiredComplete}/{s.requiredTotal}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
