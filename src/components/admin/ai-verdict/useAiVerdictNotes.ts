import { useCallback, useState } from 'react';
import { api } from '../api';
import type { AiVerdictNotesDto } from '../../../lib/ai-verdict/notesSchema';

export function useAiVerdictNotes(productId: string, testRunId?: string) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<AiVerdictNotesDto | null>(null);
  const [sectionKey, setSectionKey] = useState<string | null>(null);

  const load = useCallback(
    async (key: string) => {
      if (!testRunId) {
        setError('No test run available.');
        return null;
      }
      setSectionKey(key);
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ notes: AiVerdictNotesDto | null; currentInputHash: string }>(
          `/api/admin/ai-verdict/notes?productId=${encodeURIComponent(productId)}&testRunId=${encodeURIComponent(testRunId)}&sectionKey=${encodeURIComponent(key)}`,
        );
        setNotes(res.notes);
        return res.notes;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load AI notes';
        setError(msg);
        setNotes(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [productId, testRunId],
  );

  const generate = useCallback(
    async (key: string, regenerate = false) => {
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
          { productId, testRunId, sectionKey: key, regenerate },
        );
        setNotes(res.notes);
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
    setSectionKey(null);
    setError(null);
  }, []);

  return {
    notes,
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
