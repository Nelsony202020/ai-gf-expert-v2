// Guided testing mode: one session at a time with batch or step layout,
// proof in a side drawer, brand-aligned testing UI.

import { useEffect, useState } from 'react';
import type { EntityRow } from '../api';
import { Button, Icon } from '../ui';
import type { AutofillSuggestion } from './pricingAutofill';
import { SessionForm, type SessionItem, type SessionLayout } from './SessionForm';
import type { TestSessionDef } from './sessions';
import './testing-ui.css';
import { WORKSHEETS } from './worksheets';

export type { SessionItem };

export interface GuidedSession {
  cat: EntityRow;
  session: TestSessionDef;
  items: SessionItem[];
}

export function GuidedTestingMode({
  productName,
  runName,
  runId,
  productId,
  sessions,
  results,
  startIndex,
  suggestions,
  onClose,
  onResultSaved,
}: {
  productName: string;
  runName: string;
  runId: string;
  productId: string;
  sessions: GuidedSession[];
  results: Map<string, EntityRow>;
  startIndex: number;
  suggestions?: Map<string, AutofillSuggestion>;
  onClose: () => void;
  onResultSaved: () => Promise<void> | void;
}) {
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), sessions.length - 1));
  const [finished, setFinished] = useState(false);
  const [layout, setLayout] = useState<SessionLayout>('batch');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (sessions.length === 0) return null;
  const current = sessions[index];
  const done = (defId: string) => {
    const r = results.get(defId);
    return Boolean(r && (r.rawValue || r.notApplicable || r.isUnknown));
  };
  const allDefs = sessions.flatMap((s) => s.items);
  const completed = allDefs.filter(({ def }) => done(def.id)).length;
  const sessionDone = (s: GuidedSession) => s.items.every(({ def }) => done(def.id));
  const isLast = index === sessions.length - 1;
  const hasWorksheet = Boolean(WORKSHEETS[current.session.id]);

  function advance() {
    if (isLast) setFinished(true);
    else setIndex((i) => i + 1);
  }

  return (
    <div className="testing-workspace fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[min(920px,calc(100dvh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="shrink-0 border-b border-slate-200/80 px-5 py-3 dark:border-slate-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">
                {productName} · {runName}
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-slate-900 dark:text-slate-100">
                {current.cat.name} → {current.session.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Session {index + 1} of {sessions.length}
                <span className="mx-1.5 text-slate-300">·</span>
                {completed} of {allDefs.length} answered
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                <button
                  type="button"
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    layout === 'batch'
                      ? 'testing-toggle-active'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  onClick={() => setLayout('batch')}
                >
                  All at once
                </button>
                <button
                  type="button"
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    layout === 'step'
                      ? 'testing-toggle-active'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                  onClick={() => setLayout('step')}
                >
                  One by one
                </button>
              </div>
              <button
                type="button"
                aria-label="Close guided testing"
                onClick={onClose}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <Icon name="close" className="!text-[20px]" />
              </button>
            </div>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="testing-progress-bar h-full rounded-full transition-all"
              style={{
                width: `${Math.round((completed / Math.max(allDefs.length, 1)) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          {finished ? (
            <div className="py-8 text-center">
              <Icon name="check_circle" className="testing-icon-accent !text-[40px]" />
              <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                End of the session list
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {completed} of {allDefs.length} scores recorded.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {completed < allDefs.length && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const next = sessions.findIndex((s) => !sessionDone(s));
                      if (next >= 0) {
                        setIndex(next);
                        setFinished(false);
                      }
                    }}
                  >
                    Continue remaining sessions
                  </Button>
                )}
                <Button onClick={onClose}>Back to overview</Button>
              </div>
            </div>
          ) : (
            <SessionForm
              key={`${current.session.id}:${current.cat.id}:${layout}`}
              session={current.session}
              items={current.items}
              categorySlug={String(current.cat.slug)}
              resultByDef={results}
              runId={runId}
              productId={productId}
              suggestions={suggestions}
              layout={hasWorksheet ? 'batch' : layout}
              submitLabel={isLast ? 'Save and finish' : 'Save and continue →'}
              onSaved={async () => {
                await onResultSaved();
                advance();
              }}
              onRowSaved={onResultSaved}
              secondaryActions={
                <>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={index === 0}
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  >
                    ← Previous
                  </Button>
                  <Button variant="ghost" type="button" onClick={advance}>
                    Skip session
                  </Button>
                </>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
