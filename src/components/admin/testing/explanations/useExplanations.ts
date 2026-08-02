import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api';
import type {
  ExplanationApprovePatch,
  ExplanationListRowDto,
  ExplanationRowDto,
  ExplanationStatus,
  ExplanationSummaryDto,
} from '../../../../lib/ai-explanations/types';
import { explanationApiPath } from './explanationNav';

export interface BatchError {
  groupKey: string;
  error: string;
}

function mergeListRow(
  list: ExplanationListRowDto,
  patch: Partial<ExplanationListRowDto>,
): ExplanationListRowDto {
  return { ...list, ...patch };
}

function mergeFullRow(list: ExplanationListRowDto, detail?: ExplanationRowDto): ExplanationRowDto {
  if (detail) return { ...detail, ...list };
  return {
    ...list,
    methodology: { whatThisMeasures: '' },
    results: [],
  };
}

export function useExplanations(productId: string) {
  const [summary, setSummary] = useState<ExplanationSummaryDto | null>(null);
  const [rows, setRows] = useState<ExplanationListRowDto[]>([]);
  const [detailByKey, setDetailByKey] = useState<Record<string, ExplanationRowDto>>({});
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingGroupKey, setGeneratingGroupKey] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<{ groupKey: string; message: string } | null>(
    null,
  );
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [batchErrors, setBatchErrors] = useState<BatchError[]>([]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ summary: ExplanationSummaryDto; rows: ExplanationListRowDto[] }>(
        `/api/admin/products/${productId}/evidence-explanations`,
      );
      setSummary(data.summary);
      setRows(data.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const detailCacheRef = useRef(detailByKey);
  detailCacheRef.current = detailByKey;

  const loadDetail = useCallback(
    async (groupKey: string): Promise<ExplanationRowDto> => {
      const cached = detailCacheRef.current[groupKey];
      const listRow = rowsRef.current.find((r) => r.groupKey === groupKey);
      if (cached && listRow && cached.explanationStatus === listRow.explanationStatus) {
        return mergeFullRow(listRow, cached);
      }
      setDetailLoading(groupKey);
      try {
        const { row } = await api.get<{ row: ExplanationRowDto }>(
          explanationApiPath(productId, groupKey),
        );
        setDetailByKey((prev) => ({ ...prev, [groupKey]: row }));
        setRows((prev) =>
          prev.map((r) =>
            r.groupKey === groupKey
              ? mergeListRow(r, {
                  whatThisMeans: row.whatThisMeans,
                  explanationStatus: row.explanationStatus,
                  approvedAt: row.approvedAt,
                  approvedBy: row.approvedBy,
                  resultsChanged: row.resultsChanged,
                  score: row.score,
                })
              : r,
          ),
        );
        return row;
      } finally {
        setDetailLoading(null);
      }
    },
    [productId],
  );

  function bumpSummary(from: ExplanationStatus, to: ExplanationStatus) {
    setSummary((s) => {
      if (!s) return s;
      const next = { ...s };
      const dec = (k: keyof ExplanationSummaryDto) => {
        if (typeof next[k] === 'number') (next as any)[k] = Math.max(0, (next as any)[k] - 1);
      };
      const inc = (k: keyof ExplanationSummaryDto) => {
        if (typeof next[k] === 'number') (next as any)[k] = (next as any)[k] + 1;
      };
      if (from === 'needs_review') dec('needsReview');
      if (from === 'draft') dec('draft');
      if (from === 'outdated') dec('outdated');
      if (from === 'not_generated') dec('notGenerated');
      if (from === 'error') dec('error');
      if (to === 'approved') inc('approved');
      if (to === 'needs_review') inc('needsReview');
      if (to === 'not_generated') inc('notGenerated');
      return next;
    });
  }

  function applyApproveOptimistic(groupKey: string, text: string, prevStatus: ExplanationStatus) {
    const now = Date.now();
    setRows((prev) =>
      prev.map((r) =>
        r.groupKey === groupKey
          ? {
              ...r,
              whatThisMeans: text,
              explanationStatus: 'approved',
              approvedAt: now,
            }
          : r,
      ),
    );
    setDetailByKey((prev) => {
      const d = prev[groupKey];
      if (!d) return prev;
      return {
        ...prev,
        [groupKey]: {
          ...d,
          whatThisMeans: text,
          explanationStatus: 'approved',
          approvedAt: now,
        },
      };
    });
    if (prevStatus !== 'approved') bumpSummary(prevStatus, 'approved');
  }

  async function approve(groupKey: string, body?: { whatThisMeans?: string; reviewerNote?: string }) {
    const prev = rowsRef.current.find((r) => r.groupKey === groupKey);
    const prevStatus = prev?.explanationStatus ?? 'needs_review';
    const text = body?.whatThisMeans?.trim() ?? prev?.whatThisMeans ?? '';
    if (!text) throw new Error('Nothing to approve');

    applyApproveOptimistic(groupKey, text, prevStatus);

    try {
      const result = await api.post<{ patch: ExplanationApprovePatch; row?: ExplanationRowDto }>(
        `${explanationApiPath(productId, groupKey)}?action=approve`,
        body ?? {},
      );
      if (result.row) {
        setDetailByKey((p) => ({ ...p, [groupKey]: result.row! }));
      }
      return result;
    } catch (e) {
      await refresh();
      throw e;
    }
  }

  async function approveAndNext(
    groupKey: string,
    nextKey: string | null,
    body: { whatThisMeans: string; reviewerNote?: string },
    onSelectNext: (key: string) => void,
  ) {
    if (nextKey) onSelectNext(nextKey);
    await approve(groupKey, body);
  }

  async function approveAll() {
    setApproving(true);
    setError(null);
    try {
      const result = await api.post<{ approved: number; patches: ExplanationApprovePatch[] }>(
        `/api/admin/products/${productId}/evidence-explanations/approve-batch`,
        {},
      );
      if (result.approved === 0) {
        setError('Nothing to approve — no groups are waiting for review.');
        return result;
      }
      await refresh();
      setDetailByKey({});
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setApproving(false);
    }
  }

  async function discardReview(groupKey: string) {
    await api.post(`${explanationApiPath(productId, groupKey)}?action=discard`, {});
    setRows((prev) =>
      prev.map((r) =>
        r.groupKey === groupKey
          ? {
              ...r,
              whatThisMeans: undefined,
              explanationStatus: 'not_generated',
              approvedAt: undefined,
              approvedBy: undefined,
            }
          : r,
      ),
    );
    setDetailByKey((prev) => {
      const next = { ...prev };
      delete next[groupKey];
      return next;
    });
    setSummary((s) => {
      if (!s) return s;
      return {
        ...s,
        needsReview: Math.max(0, s.needsReview - 1),
        notGenerated: s.notGenerated + 1,
      };
    });
  }

  async function discardAll() {
    setDiscarding(true);
    setError(null);
    try {
      const result = await api.post<{ discarded: number }>(
        `/api/admin/products/${productId}/evidence-explanations/discard-batch`,
        {},
      );
      if (result.discarded === 0) {
        setError('Nothing to discard — no groups are waiting for review.');
        return result;
      }
      await refresh();
      setDetailByKey({});
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setDiscarding(false);
    }
  }

  async function generateOne(groupKey: string, opts?: { regenerate?: boolean; reviewerNote?: string }) {
    setGeneratingGroupKey(groupKey);
    setGenerateError(null);
    try {
      const { row } = await api.post<{ row: ExplanationRowDto }>(
        explanationApiPath(productId, groupKey),
        opts ?? {},
      );
      setRows((prev) =>
        prev.map((r) =>
          r.groupKey === groupKey
            ? mergeListRow(r, {
                whatThisMeans: row.whatThisMeans,
                explanationStatus: row.explanationStatus,
                resultsChanged: row.resultsChanged,
                score: row.score,
              })
            : r,
        ),
      );
      setDetailByKey((prev) => ({ ...prev, [groupKey]: row }));
      return row;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setGenerateError({ groupKey, message: msg });
      throw e;
    } finally {
      setGeneratingGroupKey(null);
    }
  }

  async function startBatch(scope: 'missing' | 'outdated' | 'category', categorySlug?: string) {
    setGenerating(true);
    setError(null);
    setBatchErrors([]);
    setBatchProgress(null);
    try {
      const { job } = await api.post<{ job: { id: string; total: number; done: number } }>(
        `/api/admin/products/${productId}/evidence-explanations/generate-batch`,
        { scope, categorySlug },
      );
      if (job.total === 0) {
        setError(
          scope === 'missing'
            ? 'Nothing to generate — all groups already have explanations or lack test results.'
            : 'Nothing to regenerate — no outdated groups.',
        );
        return;
      }
      setBatchJobId(job.id);
      setBatchProgress({ done: job.done, total: job.total });
      const errors = await pollBatch(job.id);
      if (errors.length > 0) {
        setBatchErrors(errors);
        setError(`${errors.length} group${errors.length === 1 ? '' : 's'} failed — see details below.`);
      }
      await refresh();
      setDetailByKey({});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
      setBatchJobId(null);
      setBatchProgress(null);
    }
  }

  async function pollBatch(jobId: string): Promise<BatchError[]> {
    for (;;) {
      const { job } = await api.get<{
        job: {
          done: number;
          total: number;
          finished: boolean;
          errors: BatchError[];
          current?: string;
        };
      }>(`/api/admin/products/${productId}/evidence-explanations/generate-batch/${jobId}`);
      setBatchProgress({ done: job.done, total: job.total });
      if (job.finished) return job.errors ?? [];
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const needsReviewCount = summary?.needsReview ?? 0;

  function getRowDetail(groupKey: string): ExplanationRowDto | null {
    const list = rows.find((r) => r.groupKey === groupKey);
    if (!list) return null;
    return mergeFullRow(list, detailByKey[groupKey]);
  }

  return {
    summary,
    rows,
    detailByKey,
    loading,
    detailLoading,
    generating,
    generatingGroupKey,
    approving,
    discarding,
    error,
    generateError,
    batchJobId,
    batchProgress,
    batchErrors,
    needsReviewCount,
    refresh,
    loadDetail,
    getRowDetail,
    approve,
    approveAndNext,
    approveAll,
    discardReview,
    discardAll,
    generateOne,
    startBatch,
  };
}

export type StatusFilter = ExplanationStatus | 'all';
