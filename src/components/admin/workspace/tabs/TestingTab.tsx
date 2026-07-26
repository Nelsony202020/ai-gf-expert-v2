// Testing tab: guided testing workspace for the current product. Test runs,
// evidence, methodology versions, and score snapshots remain separate
// versioned records — this tab surfaces and edits them through the same APIs
// as the global Testing section.
//
// Layout: run summary → category overview (subscore breakdown + next test) →
// selected category with test sessions (groups of tests completed with the
// same work, all saved from one form). "Continue testing" opens guided mode
// (one session at a time).

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, dataApi, type EntityRow } from '../../api';
import { useCan, useMe } from '../../context';
import { TestingHint } from '../../testing/TestingHint';
import { GuidedTestingMode, type GuidedSession } from '../../testing/GuidedTestingMode';
import { computePricingSuggestions, type AutofillSuggestion } from '../../testing/pricingAutofill';
import { sessionComplete, sessionInputCount } from '../../testing/progress';
import { type SessionItem } from '../../testing/sessionUi';
import { sessionsForCategory } from '../../testing/sessions';
import { testerQuestion } from '../../testing/presentation';
import {
  Badge,
  Button,
  ErrorNote,
  Field,
  Icon,
  Modal,
  Select,
  Spinner,
  TextInput,
  fmtDate,
  statusTone,
  useAsync,
} from '../../ui';
import { useWorkspace } from '../context';

interface ScoreTreeDto {
  overall: number | null;
  categories: {
    slug: string;
    name: string;
    weight: number;
    score: number | null;
    subscores: {
      slug: string;
      name: string;
      weight: number;
      score: number | null;
      evidence: {
        definitionId: string;
        name: string;
        status: string;
        normalizedScore: number | null;
        detail: string;
        required: boolean;
        overridden: boolean;
      }[];
    }[];
  }[];
  blockingErrors: string[];
  warnings: string[];
}

/** Pick the run an editor is most likely working on. */
function pickCurrentRun(runs: EntityRow[]): EntityRow | null {
  const active = runs
    .filter((r) => ['in_progress', 'ready_for_review', 'approved', 'not_started'].includes(r.status))
    .sort((a, b) => (b.startedAt ?? b.createdAt ?? 0) - (a.startedAt ?? a.createdAt ?? 0));
  if (active.length > 0) return active[0];
  return runs.find((r) => r.isCurrentPublished) ?? null;
}

type ResultState = 'none' | 'complete' | 'unknown' | 'na';

function resultState(r: EntityRow | undefined): ResultState {
  if (!r) return 'none';
  if (r.notApplicable) return 'na';
  if (r.isUnknown) return 'unknown';
  if (r.rawValue) return 'complete';
  return 'none';
}

/** One obvious next step — secondary actions live in a small link row. */
function runPrimaryAction(opts: {
  isPublished: boolean;
  canEnterResults: boolean;
  canTest: boolean;
  canReview: boolean;
  canPublish: boolean;
  status: string;
  sessionsComplete: boolean;
  enteredCount: number;
  onContinue: () => void;
  onSubmitReview: () => void;
  onApprove: () => void;
  onPublish: () => void;
}): { label: string; onClick: () => void } | null {
  const {
    isPublished,
    canEnterResults,
    canTest,
    canReview,
    canPublish,
    status,
    sessionsComplete,
    enteredCount,
    onContinue,
    onSubmitReview,
    onApprove,
    onPublish,
  } = opts;
  if (isPublished) return null;
  if (canEnterResults && !sessionsComplete) {
    return {
      label: enteredCount > 0 ? 'Continue testing' : 'Start testing',
      onClick: onContinue,
    };
  }
  if (canTest && status === 'in_progress' && sessionsComplete) {
    return { label: 'Submit for review', onClick: onSubmitReview };
  }
  if (status === 'ready_for_review' && canReview) {
    return { label: 'Approve test run', onClick: onApprove };
  }
  if (canPublish && (status === 'approved' || status === 'ready_for_review')) {
    return { label: 'Publish score to site', onClick: onPublish };
  }
  if (canEnterResults && sessionsComplete) {
    return { label: 'Review answers', onClick: onContinue };
  }
  return null;
}

export function TestingTab() {
  const ws = useWorkspace();
  const can = useCan();
  const me = useMe();
  const showRunEditor = me.role === 'owner' || me.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const runs = ws.related.testRuns;
  const currentRun = useMemo(() => pickCurrentRun(runs), [runs]);

  const [subscores, setSubscores] = useState<EntityRow[]>([]);
  const [definitions, setDefinitions] = useState<EntityRow[]>([]);
  const [results, setResults] = useState<EntityRow[]>([]);
  const [structureLoading, setStructureLoading] = useState(true);
  const [tree, setTree] = useState<ScoreTreeDto | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [guidedStart, setGuidedStart] = useState<number | null>(null);
  const [showNewRun, setShowNewRun] = useState(false);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const { busy, error, setError, run: exec } = useAsync();

  const canTest = can('testing.edit');

  async function loadStructure() {
    setStructureLoading(true);
    try {
      const [subs, defs, allResults] = await Promise.all([
        dataApi.list('subscores'),
        dataApi.list('evidenceDefinitions'),
        dataApi.list('evidenceResults'),
      ]);
      setSubscores(subs.rows.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      setDefinitions(defs.rows.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      setResults(allResults.rows.filter((r) => r.testRun?.id === currentRun?.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStructureLoading(false);
    }
  }

  /** Reload results only (used after each save; keeps guided mode open). */
  async function reloadResults() {
    const allResults = await dataApi.list('evidenceResults');
    setResults(allResults.rows.filter((r) => r.testRun?.id === currentRun?.id));
  }

  useEffect(() => {
    if (currentRun) void loadStructure();
    else setStructureLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRun?.id]);

  async function calculate() {
    if (!currentRun) return;
    const res = await exec(() =>
      api.get<{ tree: ScoreTreeDto }>(`/api/admin/test-runs/${currentRun.id}/calculate`),
    );
    if (res) setTree(res.tree);
  }

  // Auto-calculate a preview when a run with results is opened.
  useEffect(() => {
    if (currentRun && !structureLoading && results.length > 0 && !tree) void calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRun?.id, structureLoading]);

  async function publishRun() {
    if (!currentRun) return;
    if (
      !confirm(
        'Publish this test run? It becomes the live score source and supersedes the previous published run. Published snapshots are immutable.',
      )
    )
      return;
    const res = await exec(() =>
      api.post<{ tree: ScoreTreeDto; affectedRoundups: string[] }>(
        `/api/admin/test-runs/${currentRun.id}/publish`,
      ),
    );
    if (res) {
      setTree(res.tree);
      setPublishNote(
        res.affectedRoundups.length > 0
          ? `Published. Affected roundups (recalculate rankings): ${res.affectedRoundups.join(', ')}`
          : 'Published — this run is now the live score source.',
      );
      await ws.refreshRelated();
    }
  }

  async function setRunStatus(status: string) {
    if (!currentRun) return;
    await exec(async () => {
      await dataApi.update('testRuns', currentRun.id, { status });
      return true;
    });
    await ws.refreshRelated();
  }

  function selectCategory(slug: string | null) {
    setSelectedCategory(slug);
    if (slug) searchParams.set('category', slug);
    else searchParams.delete('category');
    setSearchParams(searchParams, { replace: true });
  }

  const resultByDef = useMemo(() => {
    const map = new Map<string, EntityRow>();
    for (const r of results) if (r.evidenceDefinition?.id) map.set(r.evidenceDefinition.id, r);
    return map;
  }, [results]);

  /** A test only counts as done when it has a value / unable-to-verify / N.A. —
   * not when a draft record exists just to hold uploads. */
  const hasValue = (defId: string) => resultState(resultByDef.get(defId)) !== 'none';

  // categoryId -> { sub, defs }[] (active only, in display order)
  const structureByCategory = useMemo(() => {
    const map = new Map<string, { sub: EntityRow; defs: EntityRow[] }[]>();
    for (const cat of ws.related.categories) {
      const subs = subscores.filter((s) => s.active && s.category?.id === cat.id);
      map.set(
        cat.id,
        subs.map((sub) => ({
          sub,
          defs: definitions.filter((d) => d.active && d.subscore?.id === sub.id),
        })),
      );
    }
    return map;
  }, [ws.related.categories, subscores, definitions]);

  // Sessions: groups of tests completed with the same work. Built per
  // category from the session config; the guided-mode sequence is the flat
  // ordered list of all sessions.
  const sessionsByCategory = useMemo(() => {
    const map = new Map<string, GuidedSession[]>();
    for (const cat of ws.related.categories) {
      const groups = structureByCategory.get(cat.id) ?? [];
      const subByDefId = new Map<string, EntityRow>();
      const defs: EntityRow[] = [];
      for (const { sub, defs: subDefs } of groups) {
        for (const def of subDefs) {
          subByDefId.set(def.id, sub);
          defs.push(def);
        }
      }
      map.set(
        cat.id,
        sessionsForCategory(String(cat.slug), defs).map(({ session, defs: sessionDefs }) => ({
          cat,
          session,
          items: sessionDefs.map((def): SessionItem => ({ def, sub: subByDefId.get(def.id)! })),
        })),
      );
    }
    return map;
  }, [ws.related.categories, structureByCategory]);

  // Suggested answers computed from the Pricing tab data (plan prices, credit
  // packages, feature costs), keyed by evidence-definition id.
  const suggestionByDef = useMemo(() => {
    const bySlugKey = computePricingSuggestions({
      plans: ws.related.plans,
      packages: ws.related.packages,
      featureCosts: ws.related.featureCosts,
    });
    const map = new Map<string, AutofillSuggestion>();
    if (bySlugKey.size === 0) return map;
    for (const cat of ws.related.categories) {
      const groups = structureByCategory.get(cat.id) ?? [];
      for (const { defs } of groups) {
        for (const def of defs) {
          const s = bySlugKey.get(`${cat.slug}/${def.slug}`);
          if (s) map.set(def.id, s);
        }
      }
    }
    return map;
  }, [
    ws.related.plans,
    ws.related.packages,
    ws.related.featureCosts,
    ws.related.categories,
    structureByCategory,
  ]);

  const orderedSessions: GuidedSession[] = useMemo(() => {
    const list: GuidedSession[] = [];
    for (const cat of ws.related.categories) list.push(...(sessionsByCategory.get(cat.id) ?? []));
    return list;
  }, [ws.related.categories, sessionsByCategory]);

  /** Resume point: first session with an incomplete required test, else first
   * session with any incomplete test. */
  const resumeIndex = useMemo(() => {
    const required = orderedSessions.findIndex((s) =>
      s.items.some(({ def }) => def.required && resultState(resultByDef.get(def.id)) === 'none'),
    );
    if (required >= 0) return required;
    const any = orderedSessions.findIndex((s) =>
      s.items.some(({ def }) => resultState(resultByDef.get(def.id)) === 'none'),
    );
    return any >= 0 ? any : 0;
  }, [orderedSessions, resultByDef]);

  const publishedScores = useMemo(() => {
    const live = ws.related.scoreHistory.find((h) => h.isCurrentPublished);
    if (!live) return null;
    return {
      overall: live.overall,
      byCategory: new Map(live.categories.map((c) => [c.slug, c.value])),
    };
  }, [ws.related.scoreHistory]);

  // ---- No run yet: empty state -------------------------------------------
  if (!currentRun) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Icon name="science" className="!text-[36px] text-slate-300" />
          <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-200">
            No test run exists for this product.
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Scores come exclusively from versioned test runs with recorded evidence. Start the
            first run to begin scoring {ws.fields.name}.
          </p>
          {canTest && (
            <Button className="mt-4" onClick={() => setShowNewRun(true)}>
              <Icon name="play_arrow" /> Start first test run
            </Button>
          )}
        </div>
        {showNewRun && (
          <NewRunModal
            productId={ws.productId}
            onClose={() => setShowNewRun(false)}
            onDone={() => {
              setShowNewRun(false);
              void ws.refreshRelated();
            }}
          />
        )}
      </div>
    );
  }

  const enteredCount = definitions.filter((d) => d.active && hasValue(d.id)).length;
  const totalSessions = orderedSessions.length;
  const completedSessions = orderedSessions.filter((s) =>
    sessionComplete(s.items, hasValue),
  ).length;
  const completionPct =
    totalSessions === 0 ? 0 : Math.round((completedSessions / totalSessions) * 100);
  const missingRequired = definitions.filter(
    (d) => d.active && d.required && !hasValue(d.id),
  );
  const isPublished = currentRun.status === 'published';
  const canEnterResults = canTest && !isPublished;
  const sessionsComplete = totalSessions > 0 && completedSessions >= totalSessions;
  const showPublishBlockers = sessionsComplete && missingRequired.length > 0;
  const primary = runPrimaryAction({
    isPublished,
    canEnterResults: canEnterResults && orderedSessions.length > 0,
    canTest,
    canReview: can('testing.review'),
    canPublish: can('content.publish'),
    status: String(currentRun.status),
    sessionsComplete,
    enteredCount,
    onContinue: () => startGuidedAt(),
    onSubmitReview: () => void setRunStatus('ready_for_review'),
    onApprove: () => void setRunStatus('approved'),
    onPublish: () => void publishRun(),
  });

  const selectedCat = selectedCategory
    ? ws.related.categories.find((c) => c.slug === selectedCategory) ?? null
    : null;
  const selectedSessions = selectedCat ? sessionsByCategory.get(selectedCat.id) ?? [] : [];
  const nextIncompleteSession = orderedSessions[resumeIndex];

  function startGuidedAt(defId?: string) {
    if (defId) {
      const idx = orderedSessions.findIndex((s) => s.items.some(({ def }) => def.id === defId));
      setGuidedStart(idx >= 0 ? idx : resumeIndex);
    } else {
      setGuidedStart(resumeIndex);
    }
  }

  function startGuidedAtSession(sessionId: string, categorySlug: string) {
    const idx = orderedSessions.findIndex(
      (s) => s.session.id === sessionId && String(s.cat.slug) === categorySlug,
    );
    setGuidedStart(idx >= 0 ? idx : resumeIndex);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {error && <ErrorNote message={error} />}
      {publishNote && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          {publishNote}
        </div>
      )}

      {/* Test run — one card, one progress story */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {currentRun.name}
              </h3>
              <Badge tone={statusTone(String(currentRun.status))}>
                {String(currentRun.status).replace(/_/g, ' ')}
              </Badge>
              {currentRun.isCurrentPublished && <Badge tone="green">live on site</Badge>}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Methodology {currentRun.methodologyVersion?.version ?? '—'}
              {currentRun.testerEmail ? ` · tested by ${currentRun.testerEmail}` : ''}
            </p>
          </div>
          {primary && (
            <Button onClick={primary.onClick} disabled={busy} className="shrink-0">
              <Icon name="play_arrow" />
              {primary.label}
            </Button>
          )}
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">This test run</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {completedSessions} of {totalSessions} sessions complete
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-pink-600 transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              {!sessionsComplete && nextIncompleteSession && (
                <p className="mt-2 text-xs text-slate-500">
                  Up next:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {nextIncompleteSession.cat.name} → {nextIncompleteSession.session.title}
                  </span>
                </p>
              )}
            </div>
            {(tree?.overall != null || publishedScores?.overall != null) && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Preview score</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {tree?.overall ?? publishedScores?.overall ?? '—'}
                </p>
              </div>
            )}
          </div>
        </div>

        {showPublishBlockers && (
          <details className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/30">
            <summary className="cursor-pointer text-xs font-medium text-amber-800 dark:text-amber-300">
              {missingRequired.length} required question{missingRequired.length === 1 ? '' : 's'} still
              unanswered before you can publish
            </summary>
            <ul className="mt-2 space-y-0.5 text-xs text-amber-900/80 dark:text-amber-200/80">
              {missingRequired.slice(0, 10).map((d) => (
                <li key={d.id} className="truncate">
                  • {testerQuestion(d)}
                </li>
              ))}
              {missingRequired.length > 10 && (
                <li>… and {missingRequired.length - 10} more (use guided testing to fill them)</li>
              )}
            </ul>
          </details>
        )}

        {tree && tree.blockingErrors.length > 0 && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-xs font-medium text-red-700 dark:text-red-300">Can&apos;t publish yet</p>
            <ul className="mt-1 space-y-0.5 text-xs text-red-600/90 dark:text-red-400">
              {tree.blockingErrors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <button
            type="button"
            className="font-medium text-slate-500 hover:text-pink-600 dark:text-slate-400"
            onClick={() => void calculate()}
            disabled={busy}
          >
            Refresh preview score
          </button>
          {canTest && currentRun.status === 'in_progress' && sessionsComplete && (
            <button
              type="button"
              className="font-medium text-slate-500 hover:text-pink-600 dark:text-slate-400"
              onClick={() => void setRunStatus('ready_for_review')}
              disabled={busy}
            >
              Submit for review
            </button>
          )}
          {currentRun.status === 'ready_for_review' && can('testing.review') && (
            <button
              type="button"
              className="font-medium text-slate-500 hover:text-pink-600 dark:text-slate-400"
              onClick={() => void setRunStatus('approved')}
              disabled={busy}
            >
              Approve
            </button>
          )}
          {can('content.publish') && !isPublished && (
            <button
              type="button"
              className="font-medium text-slate-500 hover:text-pink-600 dark:text-slate-400"
              onClick={() => void publishRun()}
              disabled={busy}
            >
              Publish score
            </button>
          )}
          {canTest && (
            <button
              type="button"
              className="font-medium text-slate-500 hover:text-pink-600 dark:text-slate-400"
              onClick={() => setShowNewRun(true)}
              disabled={busy}
            >
              Start new test run
            </button>
          )}
          {showRunEditor && (
            <Link
              to={`/testing/runs/${currentRun.id}`}
              className="font-medium text-slate-400 hover:text-pink-600"
            >
              Advanced editor
            </Link>
          )}
        </div>
      </div>

      {isPublished && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          This run is live on the site — answers can&apos;t be changed. Start a new test run to
          retest.
        </p>
      )}

      {tree && tree.categories.some((c) => c.score != null) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500">Score by category</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {tree.categories.map((c) => (
              <li key={c.slug} className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="truncate text-slate-700 hover:text-pink-600 dark:text-slate-300"
                  onClick={() => selectCategory(c.slug)}
                >
                  {c.name}
                </button>
                <span className="ml-2 shrink-0 font-semibold tabular-nums">{c.score ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Categories → sessions */}
        {structureLoading ? (
          <Spinner />
        ) : selectedCat ? (
          <div className="grid gap-3 md:grid-cols-[210px_1fr]">
            {/* Compact category navigation */}
            <nav aria-label="Rating categories" className="space-y-1 md:sticky md:top-40 md:self-start">
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-pink-600"
              >
                <Icon name="arrow_back" className="!text-[14px]" /> All categories
              </button>
              {ws.related.categories.map((cat) => {
                const catSessions = sessionsByCategory.get(cat.id) ?? [];
                const sessionsDone = catSessions.filter((s) =>
                  sessionComplete(s.items, hasValue),
                ).length;
                const isActive = cat.id === selectedCat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-pink-50 font-medium text-pink-700 dark:bg-pink-950/30 dark:text-pink-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span
                      className={`ml-2 shrink-0 text-xs ${
                        sessionsDone === catSessions.length && catSessions.length > 0
                          ? 'text-green-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {sessionsDone}/{catSessions.length}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Selected category: sessions */}
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selectedCat.name}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Work through one session at a time — each session covers a batch of related
                  questions.
                </p>
              </div>

              <div className="space-y-2">
                {selectedSessions.map(({ session, items }) => {
                  const entered = items.filter(({ def }) => hasValue(def.id)).length;
                  const inputCount = sessionInputCount(session.id, items.length);
                  const complete = sessionComplete(items, hasValue);
                  return (
                    <div
                      key={session.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700"
                    >
                      <Icon name={session.icon} className="!text-[20px] shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="inline-flex items-center gap-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                          {session.title}
                          {session.intro ? <TestingHint text={session.intro} /> : null}
                        </p>
                        <p className="text-xs text-slate-500">
                          {complete
                            ? `Done · ${inputCount} input${inputCount === 1 ? '' : 's'}`
                            : `${entered}/${items.length} answered`}
                        </p>
                      </div>
                      {complete && <Badge tone="green">done</Badge>}
                      {canEnterResults && (
                        <Button
                          variant={complete ? 'secondary' : 'primary'}
                          className="!py-1.5 text-xs"
                          onClick={() => startGuidedAtSession(session.id, String(selectedCat.slug))}
                        >
                          {complete ? 'Open' : entered > 0 ? 'Continue' : 'Start'}
                        </Button>
                      )}
                    </div>
                  );
                })}
                {selectedSessions.length === 0 && (
                  <p className="text-sm text-slate-400">No active evidence in this category.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Categories
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {ws.related.categories.map((cat) => {
                const catSessions = sessionsByCategory.get(cat.id) ?? [];
                const sessionsDone = catSessions.filter((s) =>
                  sessionComplete(s.items, hasValue),
                ).length;
                const treeCat = tree?.categories.find((c) => c.slug === cat.slug);
                const score = treeCat?.score ?? publishedScores?.byCategory.get(cat.slug) ?? null;
                const allDone = catSessions.length > 0 && sessionsDone === catSessions.length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-pink-200 hover:bg-pink-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-pink-900/50 dark:hover:bg-pink-950/20"
                  >
                    <span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {allDone
                          ? 'All sessions done'
                          : `${sessionsDone} of ${catSessions.length} sessions`}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {allDone && (
                        <Icon name="check_circle" className="!text-[18px] text-green-600" />
                      )}
                      <span className="text-base font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {score ?? '—'}
                      </span>
                      <Icon name="chevron_right" className="!text-[18px] text-slate-300" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      <ScoreHistorySection />

      {guidedStart !== null && (
        <GuidedTestingMode
          productName={String(ws.fields.name ?? '')}
          runName={String(currentRun.name ?? '')}
          runId={currentRun.id}
          productId={ws.productId}
          sessions={orderedSessions}
          results={resultByDef}
          startIndex={guidedStart}
          suggestions={suggestionByDef}
          onClose={async () => {
            setGuidedStart(null);
            await calculate();
          }}
          onResultSaved={reloadResults}
        />
      )}
      {showNewRun && (
        <NewRunModal
          productId={ws.productId}
          onClose={() => setShowNewRun(false)}
          onDone={() => {
            setShowNewRun(false);
            setTree(null);
            void ws.refreshRelated();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New test run (product pre-selected)
// ---------------------------------------------------------------------------

function NewRunModal({
  productId,
  onClose,
  onDone,
}: {
  productId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [versions, setVersions] = useState<EntityRow[]>([]);
  const [versionId, setVersionId] = useState('');
  const [name, setName] = useState('');
  const { busy, error, run } = useAsync();

  useEffect(() => {
    dataApi
      .list('methodologyVersions')
      .then((r) => {
        setVersions(r.rows);
        const active = r.rows.find((v) => v.status === 'active');
        if (active) setVersionId(active.id);
      })
      .catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(async () => {
      await dataApi.create(
        'testRuns',
        {
          name: name || `Test run ${new Date().toLocaleDateString()}`,
          status: 'in_progress',
          startedAt: Date.now(),
        },
        { product: productId, methodologyVersion: versionId },
      );
      return true;
    });
    if (done) onDone();
  }

  return (
    <Modal title="New test run" onClose={onClose}>
      <form onSubmit={create} className="space-y-3">
        {error && <ErrorNote message={error} />}
        <Field label="Methodology version" required>
          <Select value={versionId} onChange={(e) => setVersionId(e.target.value)} required>
            <option value="">— select —</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.version} {v.status === 'active' ? '(active)' : `(${v.status})`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Run name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 2026 retest" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !versionId}>
            {busy ? 'Creating…' : 'Create run'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Immutable published score history
// ---------------------------------------------------------------------------

export function ScoreHistorySection() {
  const ws = useWorkspace();
  const history = ws.related.scoreHistory;

  if (history.length === 0) return null;

  return (
    <details className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        Past published scores ({history.length})
      </summary>
      <div className="border-t border-slate-100 px-4 pb-4 dark:border-slate-800">
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-700">
              <th className="px-2 py-2">Run</th>
              <th className="px-2 py-2">Methodology</th>
              <th className="px-2 py-2">Published</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2 text-right">Overall</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.runId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-2 py-2">
                  <Link to={`/testing/runs/${h.runId}`} className="font-medium hover:text-pink-600">
                    {h.runName}
                  </Link>
                </td>
                <td className="px-2 py-2 text-xs">{h.methodologyVersion ?? '—'}</td>
                <td className="px-2 py-2 text-xs">{fmtDate(h.publishedAt ?? undefined)}</td>
                <td className="px-2 py-2">
                  {h.isCurrentPublished ? <Badge tone="green">live</Badge> : <Badge tone="gray">{h.status}</Badge>}
                </td>
                <td className="px-2 py-2 text-right font-bold">{h.overall ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
