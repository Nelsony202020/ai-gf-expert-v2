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
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, dataApi, type EntityRow } from '../../api';
import { useCan, useMe } from '../../context';
import { useAsyncToast, useToast } from '../../Toast';
import { reviewPageUrl } from '../../../../lib/slugs';
import { GuidedTestingMode, type GuidedSession } from '../../testing/GuidedTestingMode';
import { filterApplicableItems, isSessionApplicable } from '../../testing/capabilityGating';
import { computePricingSuggestions, type AutofillSuggestion } from '../../testing/pricingAutofill';
import {
  isEvidenceAnswerComplete,
  repairChatModesRaw,
  supplementalRequiredMissing,
} from '../../../../lib/testing/evidenceComplete';
import {
  computeRunProgress,
  lastEditedFromResults,
  sessionRequiredComplete,
  sessionRequiredProgress,
  type ProgressContext,
} from '../../testing/progress';
import { TestingRunProgressSummary } from '../../testing/TestingProgressHeader';
import type { MissingRequiredRow } from '../../testing/TestingMissingRequiredPanel';
import { readSkippedSessions } from '../../testing/sessionProgressStorage';
import { type SessionItem } from '../../testing/sessionUi';
import { sessionsForCategory } from '../../testing/sessions';
import {
  Badge,
  Button,
  Field,
  Icon,
  Modal,
  Select,
  Spinner,
  TextInput,
  fmtDate,
  statusTone,
} from '../../ui';
import { useWorkspace } from '../context';
import { workspaceTabPath } from '../completion';

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

/** One obvious primary action — secondary actions live in the ⋮ menu. */
function runPrimaryAction(opts: {
  isPublished: boolean;
  isLiveRun: boolean;
  hasCalculationError: boolean;
  remainingRequired: number;
  canEnterResults: boolean;
  canPublish: boolean;
  onResume: () => void;
  onPublish: () => void;
  onRetryCalculation: () => void;
  onViewLive: () => void;
  onTestingCompleteNoPermission: () => void;
}): { label: string; icon: string; onClick: () => void } {
  if (opts.hasCalculationError) {
    return { label: 'Retry calculation', icon: 'refresh', onClick: opts.onRetryCalculation };
  }
  if (opts.isPublished && opts.canEnterResults) {
    return { label: 'Edit results', icon: 'edit', onClick: opts.onResume };
  }
  if (opts.isPublished) {
    return { label: 'View live score', icon: 'open_in_new', onClick: opts.onViewLive };
  }
  const testingComplete = opts.remainingRequired === 0;
  if (testingComplete && opts.canPublish) {
    return {
      label: opts.isLiveRun ? 'Republish changes' : 'Review and publish',
      icon: 'publish',
      onClick: opts.onPublish,
    };
  }
  if (testingComplete) {
    return {
      label: 'Testing complete',
      icon: 'check_circle',
      onClick: opts.onTestingCompleteNoPermission,
    };
  }
  const suffix =
    opts.remainingRequired > 0 ? ` (${opts.remainingRequired} required left)` : '';
  return {
    label: `Resume testing${suffix}`,
    icon: 'play_arrow',
    onClick: opts.canEnterResults ? opts.onResume : opts.onTestingCompleteNoPermission,
  };
}

export function TestingTab() {
  const ws = useWorkspace();
  const navigate = useNavigate();
  const can = useCan();
  const me = useMe();
  const toast = useToast();
  const showRunEditor = me.role === 'owner' || me.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const runs = ws.related.testRuns;
  const currentRun = useMemo(() => pickCurrentRun(runs), [runs]);

  const [subscores, setSubscores] = useState<EntityRow[]>([]);
  const [definitions, setDefinitions] = useState<EntityRow[]>([]);
  const [mvCategories, setMvCategories] = useState<EntityRow[]>([]);
  const [results, setResults] = useState<EntityRow[]>([]);
  const [structureLoading, setStructureLoading] = useState(true);
  const [tree, setTree] = useState<ScoreTreeDto | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [guidedStart, setGuidedStart] = useState<number | null>(null);
  const [guidedFocusDefId, setGuidedFocusDefId] = useState<string | null>(null);
  const [guidedFocusNonce, setGuidedFocusNonce] = useState(0);
  const [showNewRun, setShowNewRun] = useState(false);
  const [showDeleteRun, setShowDeleteRun] = useState(false);
  const [calcError, setCalcError] = useState(false);
  const { busy, setError, run: exec } = useAsyncToast();

  const canTest = can('testing.edit');
  const canExportEvidence = can('content.view') || can('testing.edit');

  async function loadStructure() {
    if (!currentRun) return;
    setStructureLoading(true);
    try {
      const [structure, allResults] = await Promise.all([
        api.get<{
          categories: EntityRow[];
          subscores: EntityRow[];
          definitions: EntityRow[];
        }>(`/api/admin/test-runs/${currentRun.id}/structure`),
        dataApi.list('evidenceResults'),
      ]);
      setMvCategories(structure.categories);
      setSubscores(structure.subscores);
      setDefinitions(structure.definitions);
      setResults(allResults.rows.filter((r) => r.testRun?.id === currentRun.id));
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
    else {
      setStructureLoading(false);
      setMvCategories([]);
      setSubscores([]);
      setDefinitions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRun?.id, currentRun?.methodologyVersion?.id]);

  async function calculate(notifyOnError = false): Promise<ScoreTreeDto | null> {
    if (!currentRun) return null;
    setCalcError(false);
    try {
      const res = await api.get<{ tree: ScoreTreeDto }>(`/api/admin/test-runs/${currentRun.id}/calculate`);
      setTree(res.tree);
      await reloadResults();
      return res.tree;
    } catch (e) {
      setCalcError(true);
      if (notifyOnError) {
        toast.error('Score calculation failed', {
          message: e instanceof Error ? e.message : String(e),
        });
      }
      return null;
    }
  }

  // Keep preview score up to date whenever answers change (no toast on failure).
  useEffect(() => {
    if (currentRun && !structureLoading) void calculate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRun?.id, structureLoading, results]);

  async function publishRun() {
    if (!currentRun) return;
    const republish = Boolean(currentRun.isCurrentPublished);
    if (
      !confirm(
        republish
          ? 'Republish this test run? Live scores on the site will update to match your latest answers.'
          : 'Publish this test run? It becomes the live score source and supersedes the previous published run.',
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
      toast.success('Test run published — scores are now live.', {
        message: 'Next: publish the product on the Publish tab.',
        durationMs: 8000,
      });
      await ws.refreshRelated();
      navigate(workspaceTabPath(ws.productId, 'publish'));
    }
  }

  async function deleteRun() {
    if (!currentRun) return;
    await exec(async () => {
      await dataApi.remove('testRuns', currentRun.id);
      return true;
    });
    setShowDeleteRun(false);
    toast.success('Test run deleted');
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

  const attachmentCountByDef = useMemo(() => {
    const resultIdToDef = new Map<string, string>();
    for (const [defId, row] of resultByDef) resultIdToDef.set(row.id, defId);
    const map = new Map<string, number>();
    for (const m of ws.related.media) {
      if (m.deletedAt) continue;
      const erId = m.evidenceResult?.id;
      if (!erId) continue;
      const defId = resultIdToDef.get(erId);
      if (defId) map.set(defId, (map.get(defId) ?? 0) + 1);
    }
    return map;
  }, [resultByDef, ws.related.media]);

  const skippedSessions = useMemo(
    () => (currentRun ? readSkippedSessions(currentRun.id) : new Set<string>()),
    [currentRun?.id],
  );

  // categoryId -> { sub, defs }[] (active only, in display order)
  const structureByCategory = useMemo(() => {
    const map = new Map<string, { sub: EntityRow; defs: EntityRow[] }[]>();
    for (const cat of mvCategories) {
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
  }, [mvCategories, subscores, definitions]);

  // Sessions: groups of tests completed with the same work. Built per
  // category from the session config; the guided-mode sequence is the flat
  // ordered list of all sessions.
  const sessionsByCategory = useMemo(() => {
    const map = new Map<string, GuidedSession[]>();
    for (const cat of mvCategories) {
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
        sessionsForCategory(String(cat.slug), defs)
          .map(({ session, defs: sessionDefs }) => ({
            cat,
            session,
            items: filterApplicableItems(
              String(cat.slug),
              sessionDefs.map((def): SessionItem => ({ def, sub: subByDefId.get(def.id)! })),
              ws.fields,
            ),
          }))
          .filter(
            (s) =>
              s.items.length > 0 &&
              isSessionApplicable(String(s.cat.slug), s.session.id, resultByDef, defs),
          ),
      );
    }
    return map;
  }, [mvCategories, structureByCategory, resultByDef, ws.fields]);

  // Suggested answers computed from the Pricing tab data (plan prices, credit
  // packages, feature costs), keyed by evidence-definition id.
  const suggestionByDef = useMemo(() => {
    const bySlugKey = computePricingSuggestions({
      plans: ws.related.plans,
      packages: ws.related.packages,
      featureCosts: ws.related.featureCosts,
      paymentProfile: ws.related.paymentProfile,
    });
    const map = new Map<string, AutofillSuggestion>();
    if (bySlugKey.size === 0) return map;
    for (const cat of mvCategories) {
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
    ws.related.paymentProfile,
    mvCategories,
    structureByCategory,
    ws.fields,
  ]);

  const defById = useMemo(() => new Map(definitions.map((d) => [d.id, d])), [definitions]);

  const relatedAnswersBySlug = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const [defId, row] of resultByDef) {
      const slug = defById.get(defId)?.slug;
      if (slug && row.rawValue) out[String(slug)] = row.rawValue;
    }
    if (out['chat-modes'] != null || out['mode-types'] != null) {
      out['chat-modes'] = repairChatModesRaw(out['chat-modes'], out['mode-types']);
    }
    return out;
  }, [resultByDef, defById]);

  const progressCtx: ProgressContext = useMemo(
    () => ({
      hasValue: (defId: string) => {
        const row = resultByDef.get(defId);
        const def = defById.get(defId);
        if (!def) return false;
        return isEvidenceAnswerComplete({
          slug: String(def.slug),
          rawValue: row?.rawValue,
          notApplicable: row?.notApplicable,
          isUnknown: row?.isUnknown,
          relatedAnswers: relatedAnswersBySlug,
          hasAutofillSuggestion: suggestionByDef.has(defId),
        });
      },
      getResult: (defId) => resultByDef.get(defId),
      attachmentCount: (defId) => attachmentCountByDef.get(defId) ?? 0,
      isSkipped: (key) => skippedSessions.has(key),
    }),
    [
      resultByDef,
      defById,
      relatedAnswersBySlug,
      suggestionByDef,
      attachmentCountByDef,
      skippedSessions,
    ],
  );

  const orderedSessions: GuidedSession[] = useMemo(() => {
    const list: GuidedSession[] = [];
    for (const cat of mvCategories) list.push(...(sessionsByCategory.get(cat.id) ?? []));
    return list;
  }, [mvCategories, sessionsByCategory]);

  const runProgress = useMemo(
    () =>
      computeRunProgress(
        orderedSessions,
        progressCtx,
        lastEditedFromResults(results, currentRun?.updatedAt),
      ),
    [orderedSessions, progressCtx, results, currentRun?.updatedAt],
  );

  const sessionDefIds = useMemo(
    () => new Set(orderedSessions.flatMap((s) => s.items.map(({ def }) => def.id))),
    [orderedSessions],
  );

  const supplementalMissing = useMemo(
    () => supplementalRequiredMissing(definitions, sessionDefIds, progressCtx.hasValue),
    [definitions, sessionDefIds, progressCtx],
  );

  const effectiveRunProgress = useMemo(() => {
    const totalRequired = runProgress.totalRequired + supplementalMissing.count;
    const remainingRequired = runProgress.remainingRequired + supplementalMissing.count;
    const completedRequired = totalRequired - remainingRequired;
    return {
      ...runProgress,
      totalRequired,
      remainingRequired,
      completedRequired,
      completionPct:
        totalRequired === 0 ? 0 : Math.round((completedRequired / totalRequired) * 100),
    };
  }, [runProgress, supplementalMissing]);

  const resumeIndex = effectiveRunProgress.resumeIndex;

  const missingRequiredRows = useMemo((): MissingRequiredRow[] => {
    const rows: MissingRequiredRow[] = [];
    for (const s of effectiveRunProgress.sessions) {
      for (const item of s.missingRequiredItems) {
        rows.push({
          defId: item.defId,
          label: item.label,
          sessionIndex: s.sessionIndex,
          sessionTitle: s.sessionTitle,
          categoryName: s.categoryName,
          source: 'session',
        });
      }
    }
    for (const item of supplementalMissing.items) {
      rows.push({
        defId: item.defId,
        label: item.label,
        source: 'pricing',
      });
    }
    return rows;
  }, [effectiveRunProgress.sessions, supplementalMissing.items]);

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

  const isPublished = currentRun.status === 'published';
  const isSuperseded = currentRun.status === 'superseded';
  const isLiveRun = Boolean(currentRun.isCurrentPublished);
  const canEnterResults = canTest && !isSuperseded;
  const testingComplete = effectiveRunProgress.remainingRequired === 0;

  const productStatus = String(ws.fields.status ?? 'draft');
  const productPublished = productStatus === 'published';

  async function attemptPublish() {
    if (effectiveRunProgress.remainingRequired > 0) {
      const labels = [
        ...effectiveRunProgress.sessions.flatMap((s) => s.missingRequiredLabels),
        ...supplementalMissing.labels,
      ];
      const preview = labels.slice(0, 6).join(', ');
      const needsPricingTab = supplementalMissing.labels.some((label) =>
        ['Monthly Price', 'Annual Price', 'Included Credits', 'Voice Cost', 'Top-Ups', 'Image Cost', 'Video Cost'].includes(
          label,
        ),
      );
      toast.warning("Can't publish yet", {
        message:
          labels.length > 0
            ? `${effectiveRunProgress.remainingRequired} required question${effectiveRunProgress.remainingRequired === 1 ? '' : 's'} still unanswered (${preview}${labels.length > 6 ? '…' : ''}).${needsPricingTab ? ' Fill in plan prices, packages, and feature costs on the Pricing tab.' : ''}`
            : `${effectiveRunProgress.remainingRequired} required question${effectiveRunProgress.remainingRequired === 1 ? '' : 's'} still unanswered`,
      });
      const firstSessionMissing = missingRequiredRows.find(
        (r) => r.source === 'session' && r.sessionIndex != null && r.defId,
      );
      if (firstSessionMissing?.sessionIndex != null && firstSessionMissing.defId) {
        jumpToMissingItem(firstSessionMissing.sessionIndex, firstSessionMissing.defId);
      }
      return;
    }
    const freshTree = await calculate(false);
    if (freshTree && freshTree.blockingErrors.length > 0) {
      toast.error("Can't publish yet", {
        message: freshTree.blockingErrors.slice(0, 3).join(' · '),
      });
      return;
    }
    await publishRun();
  }

  const primary = runPrimaryAction({
    isPublished,
    isLiveRun,
    hasCalculationError: calcError,
    remainingRequired: effectiveRunProgress.remainingRequired,
    canEnterResults: canEnterResults && orderedSessions.length > 0,
    canPublish: can('content.publish') && !isSuperseded,
    onResume: () => startGuidedAt(),
    onPublish: () => void attemptPublish(),
    onRetryCalculation: () => void calculate(true),
    onViewLive: () => {
      const slug = String(ws.fields.slug ?? '');
      if (slug) window.open(reviewPageUrl(slug), '_blank', 'noopener,noreferrer');
    },
    onTestingCompleteNoPermission: () => {
      toast.info('Testing is complete', {
        message: can('content.publish')
          ? 'Use Review and publish to make this run live.'
          : 'Ask an admin with publish permission to publish this test run, then publish the product on the Publish tab.',
      });
    },
  });

  const selectedCat = selectedCategory
    ? mvCategories.find((c) => c.slug === selectedCategory) ?? null
    : null;
  const selectedSessions = selectedCat ? sessionsByCategory.get(selectedCat.id) ?? [] : [];
  const resumeSessionSnapshot =
    effectiveRunProgress.sessions[resumeIndex] ?? effectiveRunProgress.sessions[0] ?? null;

  function jumpToMissingItem(sessionIndex: number, defId: string) {
    setGuidedFocusDefId(defId);
    setGuidedFocusNonce((n) => n + 1);
    setGuidedStart(sessionIndex);
  }

  async function ensureRunEditable() {
    if (!currentRun || currentRun.status !== 'published') return;
    await dataApi.update('testRuns', currentRun.id, { status: 'in_progress' });
    await ws.refreshRelated();
  }

  function startGuidedAt(defId?: string) {
    void ensureRunEditable().then(() => {
      if (defId) {
        const idx = orderedSessions.findIndex((s) => s.items.some(({ def }) => def.id === defId));
        jumpToMissingItem(idx >= 0 ? idx : resumeIndex, defId);
        return;
      }
      const firstSessionMissing = missingRequiredRows.find(
        (r) => r.source === 'session' && r.sessionIndex != null && r.defId,
      );
      if (firstSessionMissing?.sessionIndex != null && firstSessionMissing.defId) {
        jumpToMissingItem(firstSessionMissing.sessionIndex, firstSessionMissing.defId);
        return;
      }
      setGuidedFocusDefId(null);
      setGuidedStart(resumeIndex);
    });
  }

  function startGuidedAtIndex(idx: number) {
    void ensureRunEditable().then(() => {
      setGuidedStart(Math.min(Math.max(idx, 0), orderedSessions.length - 1));
    });
  }

  function startGuidedAtSession(sessionId: string, categorySlug: string) {
    void ensureRunEditable().then(() => {
      const idx = orderedSessions.findIndex(
        (s) => s.session.id === sessionId && String(s.cat.slug) === categorySlug,
      );
      setGuidedStart(idx >= 0 ? idx : resumeIndex);
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Test run — one card, one progress story */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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

        <div className="mt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <TestingRunProgressSummary
                runProgress={effectiveRunProgress}
                currentSession={resumeSessionSnapshot}
                onResume={() => startGuidedAt()}
                onSelectSession={startGuidedAtIndex}
                missingRows={missingRequiredRows}
                onJumpToMissing={jumpToMissingItem}
                pricingTabHref={workspaceTabPath(ws.productId, 'pricing')}
              />
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

        {testingComplete && !isPublished && (
          <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            All required testing is complete. Click <strong>Review and publish</strong> to make this
            run the live score, then open the <strong>Publish</strong> tab to publish the product.
          </p>
        )}

        {!isPublished && supplementalMissing.count > 0 && suggestionByDef.size === 0 && missingRequiredRows.length === 0 && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-medium">
              {supplementalMissing.count} pricing test answer
              {supplementalMissing.count === 1 ? '' : 's'} still need data from the Pricing tab
            </p>
            <p className="mt-1 text-amber-800 dark:text-amber-300">
              Monthly/annual prices, included credits, credit packages, and voice costs are
              auto-filled from <strong>Pricing</strong> — they are not entered in the testing
              sessions. Add plan tiers, packages, and feature costs there first.
            </p>
            <Link
              to={workspaceTabPath(ws.productId, 'pricing')}
              className="mt-2 inline-flex items-center gap-1 font-medium text-pink-700 hover:underline dark:text-pink-400"
            >
              Open Pricing tab
            </Link>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button onClick={primary.onClick} disabled={busy} className="shrink-0">
            <Icon name={primary.icon} />
            {primary.label}
          </Button>
          <RunActionsMenu
            canTest={canTest}
            showRunEditor={showRunEditor}
            runId={currentRun.id}
            isPublished={isPublished}
            canExportEvidence={canExportEvidence}
            exportDisabled={busy}
            onNewRun={() => setShowNewRun(true)}
            onDelete={() => setShowDeleteRun(true)}
          />
        </div>
      </div>

      {isPublished && !productPublished && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
          <p className="text-sm font-medium text-green-900 dark:text-green-200">
            Test run is live — ready for product publish
          </p>
          <p className="mt-1 text-xs text-green-800 dark:text-green-300">
            Scores are on the site. Open the Publish tab to run final checks and publish the review
            page.
          </p>
          <Link
            to={workspaceTabPath(ws.productId, 'publish')}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
          >
            <Icon name="rocket_launch" className="!text-[16px]" />
            Go to Publish tab
          </Link>
        </div>
      )}

      {isLiveRun && !isPublished && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
          Editing the live run — the site keeps the current scores until you republish.
        </p>
      )}

      {isPublished && productPublished && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          This run is live on the site. Click <strong>Edit results</strong> to change answers, then
          republish when done.
        </p>
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
                className="mb-1 flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-pink-600"
              >
                <Icon name="arrow_back" className="!text-[14px]" /> All categories
              </button>
              {mvCategories.map((cat) => {
                const catSessions = sessionsByCategory.get(cat.id) ?? [];
                const sessionsDone = catSessions.filter((s) =>
                  sessionRequiredComplete(s.session.id, s.items, progressCtx),
                ).length;
                const isActive = cat.id === selectedCat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-1.5 text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-pink-50 font-medium text-pink-700 dark:bg-pink-950/30 dark:text-pink-300'
                        : 'text-slate-600 hover:translate-x-0.5 hover:bg-pink-50/70 hover:text-pink-700 dark:text-slate-300 dark:hover:bg-pink-950/30 dark:hover:text-pink-300'
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
                {selectedSessions.map(({ session, items, cat }) => {
                  const prog = sessionRequiredProgress(session.id, items, progressCtx);
                  const complete = sessionRequiredComplete(session.id, items, progressCtx);
                  return (
                    <div
                      key={session.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700"
                    >
                      <Icon name={session.icon} className="!text-[20px] shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="inline-flex items-center gap-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                          {session.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {complete
                            ? `Done · ${prog.total} required attempt${prog.total === 1 ? '' : 's'}`
                            : prog.total > 0
                              ? `${prog.complete} of ${prog.total} attempts complete`
                              : 'No required inputs'}
                        </p>
                      </div>
                      {complete && <Badge tone="green">done</Badge>}
                      {canEnterResults && (
                        <Button
                          variant={complete ? 'secondary' : 'primary'}
                          className="!py-1.5 text-xs"
                          onClick={() => startGuidedAtSession(session.id, String(cat.slug))}
                        >
                          {complete ? 'Open' : prog.complete > 0 ? 'Continue' : 'Start'}
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
              {mvCategories.map((cat) => {
                const catSessions = sessionsByCategory.get(cat.id) ?? [];
                const sessionsDone = catSessions.filter((s) =>
                  sessionRequiredComplete(s.session.id, s.items, progressCtx),
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
          productFields={ws.fields}
          productSlug={String(ws.fields.slug ?? '')}
          sessions={orderedSessions}
          results={resultByDef}
          resultRows={results}
          media={ws.related.media}
          runUpdatedAt={currentRun.updatedAt}
          startIndex={guidedStart}
          focusDefId={guidedFocusDefId}
          focusNonce={guidedFocusNonce}
          suggestions={suggestionByDef}
          evidenceDefs={definitions}
          onClose={async () => {
            setGuidedStart(null);
            setGuidedFocusDefId(null);
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
      {showDeleteRun && currentRun && (
        <DeleteRunModal
          runName={String(currentRun.name ?? 'this test run')}
          isPublished={isPublished}
          busy={busy}
          onClose={() => setShowDeleteRun(false)}
          onConfirm={() => void deleteRun()}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Run actions ⋮ menu
// ---------------------------------------------------------------------------

function RunActionsMenu({
  canTest,
  showRunEditor,
  runId,
  isPublished,
  canExportEvidence,
  exportDisabled,
  onNewRun,
  onDelete,
}: {
  canTest: boolean;
  showRunEditor: boolean;
  runId: string;
  isPublished: boolean;
  canExportEvidence?: boolean;
  exportDisabled?: boolean;
  onNewRun: () => void;
  onDelete: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState<'csv' | 'pdf-reader' | 'pdf-full' | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!(e.target as Element).closest?.('[data-run-actions-menu]')) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  async function downloadExport(format: 'csv' | 'pdf', type: 'reader' | 'full' = 'reader') {
    const key = format === 'csv' ? 'csv' : type === 'full' ? 'pdf-full' : 'pdf-reader';
    setExportBusy(key);
    try {
      const qs = format === 'pdf' ? `?format=pdf&type=${type}` : '?format=csv';
      await api.download(`/api/admin/test-runs/${runId}/export${qs}`);
      toast.success(
        format === 'csv' ? 'Evidence exported as CSV' : `Report exported (${type})`,
      );
      setOpen(false);
    } catch (e) {
      toast.error('Export failed', {
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setExportBusy(null);
    }
  }

  const busy = exportDisabled || exportBusy !== null;

  return (
    <div className="relative" data-run-actions-menu>
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <Icon name="more_vert" className="!text-[20px]" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {canTest && (
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => {
                setOpen(false);
                onNewRun();
              }}
            >
              <Icon name="add" className="!text-[16px] text-slate-400" />
              Start new test run
            </button>
          )}
          {showRunEditor && (
            <Link
              to={`/testing/runs/${runId}`}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              <Icon name="tune" className="!text-[16px] text-slate-400" />
              Advanced editor
            </Link>
          )}
          {canExportEvidence && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={busy}
                onClick={() => void downloadExport('pdf', 'reader')}
              >
                <Icon name="picture_as_pdf" className="!text-[16px] text-slate-400" />
                {exportBusy === 'pdf-reader' ? 'Exporting…' : 'Download test report (PDF)'}
              </button>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={busy}
                onClick={() => void downloadExport('pdf', 'full')}
              >
                <Icon name="description" className="!text-[16px] text-slate-400" />
                {exportBusy === 'pdf-full' ? 'Exporting…' : 'Full evidence report (PDF)'}
              </button>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={busy}
                onClick={() => void downloadExport('csv')}
              >
                <Icon name="table" className="!text-[16px] text-slate-400" />
                {exportBusy === 'csv' ? 'Exporting…' : 'Export spreadsheet (CSV)'}
              </button>
            </>
          )}
          {canTest && (
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Icon name="delete" className="!text-[16px]" />
              Delete test run
              {isPublished && <span className="text-[10px] text-red-400">(live)</span>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DeleteRunModal({
  runName,
  isPublished,
  busy,
  onClose,
  onConfirm,
}: {
  runName: string;
  isPublished: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Delete test run?" onClose={onClose} wide>
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <Icon name="warning" className="!text-[28px] shrink-0 text-red-500" />
          <div>
            <p className="text-base font-semibold text-red-900 dark:text-red-200">
              Are you sure you want to delete &ldquo;{runName}&rdquo;?
            </p>
            <p className="mt-2 text-sm text-red-800/90 dark:text-red-300/90">
              This permanently removes the test run and all recorded answers. This action cannot be
              undone.
            </p>
            {isPublished && (
              <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
                This run is currently live on the site — deleting it will remove the published score
                source.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : 'Yes, delete test run'}
          </Button>
        </div>
      </div>
    </Modal>
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
  const { busy, run } = useAsyncToast();

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
