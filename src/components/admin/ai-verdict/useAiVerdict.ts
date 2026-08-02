import { useCallback, useState } from 'react';
import { api } from '../api';
import type { AiVerdictScope } from '../../../lib/ai-verdict/types';
import type { AiSuggestionOutput, KeyFinding } from '../../../lib/ai-verdict/suggestionSchema';

export interface AiSuggestionDto {
  id: string;
  scope: AiVerdictScope;
  categorySlug: string | null;
  targetField: string | null;
  status: string;
  structuredOutput: AiSuggestionOutput;
  keyFindings: KeyFinding[];
  inputHash: string;
  evidenceIds: string[];
  model: string;
  promptVersion: string;
  generatedAt: number;
  tokenUsage: { input: number; output: number } | null;
  testRunId: string | null;
}

export function useAiVerdict(productId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestionDto | null>(null);

  const generate = useCallback(
    async (opts: {
      scope: AiVerdictScope;
      testRunId?: string;
      categorySlug?: string;
      targetField?: string;
      includeTesterNotes?: boolean;
      regenerate?: boolean;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.post<{ suggestion: AiSuggestionDto }>(
          '/api/admin/ai-verdict/generate',
          { productId, ...opts },
        );
        setSuggestion(res.suggestion);
        return res.suggestion;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  const insert = useCallback(async (id: string) => {
    const res = await api.post<{ patch: Record<string, unknown> }>(
      `/api/admin/ai-verdict/suggestions/${id}/insert`,
      {},
    );
    return res.patch;
  }, []);

  const reject = useCallback(async (id: string) => {
    await api.post(`/api/admin/ai-verdict/suggestions/${id}/reject`, {});
    setSuggestion(null);
  }, []);

  const dismiss = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  return { loading, error, suggestion, generate, insert, reject, dismiss, setSuggestion };
}
