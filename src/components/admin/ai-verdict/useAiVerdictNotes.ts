import { useCallback, useState } from 'react';
import { api } from '../api';
import type { AiVerdictNotesDto, LoadNotesResponse } from '../../../lib/ai-verdict/notesSchema';
import type { CategoryPerformanceDto } from '../../../lib/ai-verdict/categoryPerformance';

export function useAiVerdictNotes(productId: string, testRunId?: string) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<AiVerdictNotesDto | null>(null);
  const [performance, setPerformance] = useState<CategoryPerformanceDto | null>(null);
  const [sectionKey, setSectionKey] = useState<string | null>(null);

  const load = useCallback(
    async (key: string, opts?: { categoryName?: string }) => {
      if (!testRunId) {
        setError('No test run available.');
        return null;
      }
      setSectionKey(key);
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          productId,
          testRunId,
          sectionKey: key,
        });
        if (opts?.categoryName) params.set('categoryName', opts.categoryName);
        const res = await api.get<LoadNotesResponse>(
          `/api/admin/ai-verdict/notes?${params.toString()}`,
        );
        setNotes(res.notes);
        setPerformance(res.performance ?? res.notes?.performance ?? null);
        return res.notes;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load AI notes';
        setError(msg);
        setNotes(null);
        setPerformance(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [productId, testRunId],
  );

  const generate = useCallback(
    async (key: string, regenerate = false, opts?: { categoryName?: string }) => {
      if (!testRunId) {
        setError('No test run available.');
        return null;
      }
      setSectionKey(key);
      setGenerating(true);
      setError(null);
      try {
        const res = await api.post<{ notes: AiVerdictNotesDto }>(
          '/api/admin/ai-verdict/notes',
          { productId, testRunId, sectionKey: key, regenerate, categoryName: opts?.categoryName },
        );
        setNotes(res.notes);
        setPerformance(res.notes.performance ?? null);
        return res.notes;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'AI notes generation failed';
        setError(msg);
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [productId, testRunId],
  );

  const dismiss = useCallback(() => {
    setNotes(null);
    setPerformance(null);
    setSectionKey(null);
    setError(null);
    setLoading(false);
    setGenerating(false);
  }, []);

  return {
    notes,
    performance,
    sectionKey,
    loading,
    generating,
    error,
    load,
    generate,
    dismiss,
    setError,
  };
}
