import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api';
import type {
  TakeawayApprovePatch,
  TakeawayListRowDto,
  TakeawayRowDto,
  TakeawayStatus,
  TakeawaySummaryDto,
} from '../../../../lib/subscore-takeaways/types';
import { takeawayApiPath } from './takeawayNav';

function mergeListRow(
  list: TakeawayListRowDto,
  patch: Partial<TakeawayListRowDto>,
): TakeawayListRowDto {
  return { ...list, ...patch };
}

function mergeFullRow(list: TakeawayListRowDto, detail?: TakeawayRowDto): TakeawayRowDto {
  if (detail) return { ...detail, ...list };
  return { ...list, breakdown: [] };
}

export function useSubscoreTakeaways(productId: string) {
  const [summary, setSummary] = useState<TakeawaySummaryDto | null>(null);
  const [rows, setRows] = useState<TakeawayListRowDto[]>([]);
  const [detailByKey, setDetailByKey] = useState<Record<string, TakeawayRowDto>>({});
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<{ subscoreKey: string; message: string } | null>(
    null,
  );
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const discardedKeysRef = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ summary: TakeawaySummaryDto; rows: TakeawayListRowDto[] }>(
        `/api/admin/products/${productId}/subscore-takeaways`,
      );
      setSummary(data.summary);
      setRows(data.rows);
      discardedKeysRef.current.clear();
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
    async (subscoreKey: string): Promise<TakeawayRowDto> => {
      const listRow = rowsRef.current.find((r) => r.subscoreKey === subscoreKey);
      if (discardedKeysRef.current.has(subscoreKey) && listRow) {
        return mergeFullRow(listRow, {
          ...listRow,
          subscoreKey,
          keyTakeaway: undefined,
          takeawayStatus: 'not_generated',
          breakdown: [],
        } as TakeawayRowDto);
      }
      const cached = detailCacheRef.current[subscoreKey];
      if (cached && listRow && cached.takeawayStatus === listRow.takeawayStatus) {
        return mergeFullRow(listRow, cached);
      }
      setDetailLoading(subscoreKey);
      try {
        const { row } = await api.get<{ row: TakeawayRowDto }>(
          takeawayApiPath(productId, subscoreKey),
        );
        if (discardedKeysRef.current.has(subscoreKey)) {
          return mergeFullRow(listRow!, {
            ...listRow!,
            subscoreKey,
            keyTakeaway: undefined,
            takeawayStatus: 'not_generated',
            breakdown: [],
          } as TakeawayRowDto);
        }
        setDetailByKey((prev) => ({ ...prev, [subscoreKey]: row }));
        setRows((prev) =>
          prev.map((r) =>
            r.subscoreKey === subscoreKey
              ? mergeListRow(r, {
                  keyTakeaway: row.keyTakeaway,
                  takeawayStatus: row.takeawayStatus,
                  approvedAt: row.approvedAt,
                  approvedBy: row.approvedBy,
                  resultsChanged: row.resultsChanged,
                  finalScore: row.finalScore,
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

  function bumpSummary(from: TakeawayStatus, to: TakeawayStatus) {
    setSummary((s) => {
      if (!s) return s;
      const next = { ...s };
      const dec = (k: keyof TakeawaySummaryDto) => {
        if (typeof next[k] === 'number') (next as any)[k] = Math.max(0, (next as any)[k] - 1);
      };
      const inc = (k: keyof TakeawaySummaryDto) => {
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

  function applyApproveOptimistic(subscoreKey: string, text: string, prevStatus: TakeawayStatus) {
    const now = Date.now();
    setRows((prev) =>
      prev.map((r) =>
        r.subscoreKey === subscoreKey
          ? {
              ...r,
              keyTakeaway: text,
              takeawayStatus: 'approved',
              approvedAt: now,
            }
          : r,
      ),
    );
    setDetailByKey((prev) => {
      const d = prev[subscoreKey];
      if (!d) return prev;
      return {
        ...prev,
        [subscoreKey]: {
          ...d,
          keyTakeaway: text,
          takeawayStatus: 'approved',
          approvedAt: now,
        },
      };
    });
    if (prevStatus !== 'approved') bumpSummary(prevStatus, 'approved');
  }

  async function approve(subscoreKey: string, body?: { keyTakeaway?: string; reviewerNote?: string }) {
    const prev = rowsRef.current.find((r) => r.subscoreKey === subscoreKey);
    const prevStatus = prev?.takeawayStatus ?? 'needs_review';
    const text = body?.keyTakeaway?.trim() ?? prev?.keyTakeaway ?? '';
    if (!text) throw new Error('Nothing to approve');

    applyApproveOptimistic(subscoreKey, text, prevStatus);

    try {
      const result = await api.post<{ patch: TakeawayApprovePatch; row?: TakeawayRowDto }>(
        `${takeawayApiPath(productId, subscoreKey)}?action=approve`,
        body ?? {},
      );
      if (result.row) {
        setDetailByKey((p) => ({ ...p, [subscoreKey]: result.row! }));
      }
      return result;
    } catch (e) {
      await refresh();
      throw e;
    }
  }

  async function approveAndNext(
    subscoreKey: string,
    nextKey: string | null,
    body: { keyTakeaway: string; reviewerNote?: string },
    onSelectNext: (key: string) => void,
  ) {
    if (nextKey) onSelectNext(nextKey);
    await approve(subscoreKey, body);
  }

  async function approveAll() {
    setApproving(true);
    setError(null);
    try {
      const result = await api.post<{ approved: number }>(
        `/api/admin/products/${productId}/subscore-takeaways/approve-batch`,
        {},
      );
      if (result.approved === 0) {
        setError('Nothing to approve — no subscores are waiting for review.');
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

  async function discardReview(subscoreKey: string) {
    await api.post(`${takeawayApiPath(productId, subscoreKey)}?action=discard`, {});
    discardedKeysRef.current.add(subscoreKey);
    setRows((prev) =>
      prev.map((r) =>
        r.subscoreKey === subscoreKey
          ? {
              ...r,
              keyTakeaway: undefined,
              takeawayStatus: 'not_generated',
              approvedAt: undefined,
              approvedBy: undefined,
            }
          : r,
      ),
    );
    setDetailByKey((prev) => {
      const next = { ...prev };
      delete next[subscoreKey];
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
        `/api/admin/products/${productId}/subscore-takeaways/discard-batch`,
        {},
      );
      if (result.discarded === 0) {
        setError('Nothing to discard — no subscores are waiting for review.');
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

  async function generateOne(subscoreKey: string, opts?: { regenerate?: boolean; reviewerNote?: string }) {
    setGeneratingKey(subscoreKey);
    setGenerateError(null);
    try {
      const { row } = await api.post<{ row: TakeawayRowDto }>(
        takeawayApiPath(productId, subscoreKey),
        opts ?? {},
      );
      setRows((prev) =>
        prev.map((r) =>
          r.subscoreKey === subscoreKey
            ? mergeListRow(r, {
                keyTakeaway: row.keyTakeaway,
                takeawayStatus: row.takeawayStatus,
                resultsChanged: row.resultsChanged,
                finalScore: row.finalScore,
              })
            : r,
        ),
      );
      setDetailByKey((prev) => ({ ...prev, [subscoreKey]: row }));
      setSummary((s) => {
        if (!s) return s;
        const prev = rowsRef.current.find((r) => r.subscoreKey === subscoreKey);
        if (prev?.takeawayStatus === 'not_generated' || prev?.takeawayStatus === 'error') {
          return { ...s, notGenerated: Math.max(0, s.notGenerated - 1), needsReview: s.needsReview + 1 };
        }
        return { ...s, needsReview: s.needsReview + 1 };
      });
      return row;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setGenerateError({ subscoreKey, message: msg });
      throw e;
    } finally {
      setGeneratingKey(null);
    }
  }

  async function generateAllMissing() {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.post<{ generated: number; errors: Array<{ subscoreKey: string; error: string }> }>(
        `/api/admin/products/${productId}/subscore-takeaways/generate-batch`,
        {},
      );
      if (result.generated === 0 && result.errors.length === 0) {
        setError('Nothing to generate — all subscores already have takeaways or lack scores.');
        return result;
      }
      if (result.errors.length > 0) {
        setError(`${result.errors.length} subscore${result.errors.length === 1 ? '' : 's'} failed to generate.`);
      }
      await refresh();
      setDetailByKey({});
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setGenerating(false);
    }
  }

  const needsReviewCount = summary?.needsReview ?? 0;

  function getRowDetail(subscoreKey: string): TakeawayRowDto | null {
    const list = rows.find((r) => r.subscoreKey === subscoreKey);
    if (!list) return null;
    return mergeFullRow(list, detailByKey[subscoreKey]);
  }

  return {
    summary,
    rows,
    loading,
    detailLoading,
    generating,
    generatingKey,
    approving,
    discarding,
    error,
    generateError,
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
    generateAllMissing,
  };
}

export type TakeawayStatusFilter = TakeawayStatus | 'all';
