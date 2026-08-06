// Upload / paste privacy policy documents, then run AI analysis before policy-review.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { api, ApiError } from '../api';
import { Button, ErrorNote, Icon, TextArea } from '../ui';
import { inferDocumentLabelFromUrl, parsePolicyUrls } from '../../../lib/ai-privacy/classifyUrl';
import { privacyStructuredOutputSchema } from '../../../lib/ai-privacy/types';
import type { PrivacyDocument } from '../../../lib/ai-privacy/types';
import { aiPrivacySummaryFromResults } from '../../../lib/ai-privacy/clientHelpers';

function newDocId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function docsToUrlBulk(docs: PrivacyDocument[]): string {
  return docs
    .map((d) => (d.sourceUrl ?? '').trim())
    .filter(Boolean)
    .join('\n');
}

function urlsToDocuments(urls: string[], existing: PrivacyDocument[]): PrivacyDocument[] {
  const byUrl = new Map(existing.map((d) => [(d.sourceUrl ?? '').trim(), d]));
  return urls.map((url) => {
    const prev = byUrl.get(url);
    if (prev) {
      return { ...prev, label: inferDocumentLabelFromUrl(url), sourceUrl: url };
    }
    return {
      id: newDocId(),
      label: inferDocumentLabelFromUrl(url),
      sourceUrl: url,
      scrapeStatus: 'pending' as const,
    };
  });
}

type AnalysisSummary = {
  filled: number;
  needsReview: number;
  notFound: number;
  conflicting: number;
  total: number;
  high: number;
  medium: number;
  low: number;
};

type AnalysisRow = {
  id: string;
  status: string;
  documents: PrivacyDocument[];
  error?: string;
  model?: string;
  structuredOutput?: unknown;
};

export type PolicyDocsSessionHandle = {
  /** Persist URL list (and any pasted text) without scraping. Returns false on error. */
  saveDraft: () => Promise<boolean>;
};

function PolicyUrlLink({ url, className }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`truncate font-mono text-[11px] text-slate-500 underline decoration-slate-300/60 underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:decoration-slate-600/60 dark:hover:text-slate-300 ${className ?? ''}`}
    >
      {url}
    </a>
  );
}

export const PolicyDocsSession = forwardRef<
  PolicyDocsSessionHandle,
  {
    productId: string;
    runId: string;
    onAnalyzed?: () => void | Promise<void>;
  }
>(function PolicyDocsSession({ productId, runId, onAnalyzed }, ref) {
  const [urlBulk, setUrlBulk] = useState('');
  const [docs, setDocs] = useState<PrivacyDocument[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisRow | null>(null);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ analysis: AnalysisRow | null; summary: AnalysisSummary | null }>(
        `/api/admin/ai-privacy/${runId}`,
      );
      if (res.analysis) {
        setAnalysis(res.analysis);
        const loaded = res.analysis.documents.length > 0
          ? res.analysis.documents.map((d) => ({
              ...d,
              label: inferDocumentLabelFromUrl(d.sourceUrl ?? '') || d.label,
            }))
          : [];
        setDocs(loaded);
        if (loaded.length > 0) setUrlBulk(docsToUrlBulk(loaded));
        setSummary(res.summary);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load saved documents');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  const parsedUrls = useMemo(() => parsePolicyUrls(urlBulk), [urlBulk]);

  const displayDocs = useMemo(() => {
    if (docs.length > 0 && parsedUrls.length === 0) return docs;
    if (parsedUrls.length === 0) return [];
    return urlsToDocuments(parsedUrls, docs);
  }, [docs, parsedUrls]);

  function buildDocumentsForSave(): PrivacyDocument[] {
    const urls = parsePolicyUrls(urlBulk);
    return urlsToDocuments(urls, docs).map((d) => ({
      ...d,
      label: inferDocumentLabelFromUrl(d.sourceUrl ?? ''),
      pastedText: (d.pastedText ?? '').trim() || undefined,
    }));
  }

  const saveDraft = useCallback(async (): Promise<boolean> => {
    const urls = parsePolicyUrls(urlBulk);
    if (urls.length === 0) return true;

    setSavingDraft(true);
    setError(null);
    try {
      const documents = buildDocumentsForSave();
      const res = await api.post<{ analysis: AnalysisRow }>('/api/admin/ai-privacy/documents', {
        productId,
        testRunId: runId,
        documents,
      });
      setAnalysis(res.analysis);
      setDocs(res.analysis.documents);
      setUrlBulk(docsToUrlBulk(res.analysis.documents));
      setDraftSavedAt(Date.now());
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save policy links');
      return false;
    } finally {
      setSavingDraft(false);
    }
  }, [urlBulk, docs, productId, runId]);

  useImperativeHandle(ref, () => ({ saveDraft }), [saveDraft]);

  function patchDoc(docId: string, patch: Partial<PrivacyDocument>) {
    setDocs((prev) => {
      const base = parsedUrls.length > 0 ? urlsToDocuments(parsedUrls, prev) : prev;
      return base.map((d) => (d.id === docId ? { ...d, ...patch } : d));
    });
  }

  async function analyze() {
    const urls = parsePolicyUrls(urlBulk);
    if (urls.length === 0) {
      setError('Paste at least one policy URL.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const documents = buildDocumentsForSave();

      const saved = await api.post<{ analysis: AnalysisRow }>('/api/admin/ai-privacy/documents', {
        productId,
        testRunId: runId,
        documents,
      });

      const res = await api.post<{
        analysis: AnalysisRow;
        summary: AnalysisSummary;
      }>('/api/admin/ai-privacy/analyze', {
        productId,
        testRunId: runId,
        analysisId: saved.analysis.id,
      });

      setAnalysis(res.analysis);
      setSummary(res.summary);
      if (res.analysis.documents?.length) {
        setDocs(res.analysis.documents);
        setUrlBulk(docsToUrlBulk(res.analysis.documents));
      }
      setDraftSavedAt(Date.now());
      await onAnalyzed?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Analysis failed');
      void load();
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading privacy documents…</p>;
  }

  const applied = analysis?.status === 'applied';
  const parsedOutput = analysis?.structuredOutput
    ? privacyStructuredOutputSchema.safeParse(analysis.structuredOutput)
    : null;
  const scanSummary = parsedOutput?.success
    ? aiPrivacySummaryFromResults(
        parsedOutput.data.answers.map((a) => ({
          calculationDetails: {
            aiPrivacy: {
              slug: a.slug,
              reviewStatus: 'pending_review',
              fillStatus: a.status,
              confidence: a.confidence,
              evidence: a.evidence,
              analysisId: analysis?.id ?? '',
            },
          },
          evidenceDefinition: { slug: a.slug },
        })),
      )
    : null;
  const showDocList =
    displayDocs.length > 0 &&
    (analyzing || applied || displayDocs.some((d) => d.scrapeStatus && d.scrapeStatus !== 'pending'));

  return (
    <div className="space-y-4">
      {error && <ErrorNote message={error} />}

      <label className="block text-xs">
        <span className="mb-1 block font-medium text-slate-700 dark:text-slate-200">Policy page URLs</span>
        <span className="mb-1.5 block text-[11px] text-slate-500">
          Paste every policy link (one per line). We detect the document type from the URL, scrape the
          pages, and propose answers. Links are saved when you click Save and continue.
        </span>
        <TextArea
          rows={5}
          value={urlBulk}
          placeholder={'https://example.com/privacy\nhttps://example.com/terms\nhttps://example.com/refunds'}
          className="font-mono text-[13px]"
          onChange={(e) => setUrlBulk(e.target.value)}
          disabled={analyzing || savingDraft}
        />
      </label>

      {draftSavedAt && !analyzing && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Policy links saved.</p>
      )}

      {parsedUrls.length > 0 && !showDocList && (
        <ul className="space-y-1 text-xs">
          {urlsToDocuments(parsedUrls, docs).map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{doc.label}</span>
              {doc.sourceUrl ? <PolicyUrlLink url={doc.sourceUrl} className="min-w-0 max-w-full" /> : null}
            </li>
          ))}
        </ul>
      )}

      {showDocList && (
        <ul className="space-y-1.5">
          {displayDocs.map((doc) => (
            <li key={doc.id} className="text-xs">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{doc.label}</span>
                {doc.sourceUrl ? <PolicyUrlLink url={doc.sourceUrl} className="min-w-0 max-w-full" /> : null}
                {doc.scrapeStatus === 'ok' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Scraped</span>
                )}
                {doc.scrapeStatus === 'skipped' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Using pasted text</span>
                )}
                {doc.scrapeStatus === 'failed' && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">Scrape failed</span>
                )}
                {analyzing && doc.scrapeStatus === 'pending' && (
                  <span className="text-[10px] text-slate-400">Scraping…</span>
                )}
              </div>
              {doc.scrapeStatus === 'failed' && (
                <label className="mt-2 block text-xs">
                  <span className="mb-0.5 block font-medium text-amber-700 dark:text-amber-300">
                    Paste policy text (required — scrape failed).{' '}
                    {doc.sourceUrl && (
                      <>
                        Open{' '}
                        <a
                          href={doc.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          the policy page
                        </a>{' '}
                        to copy it.
                      </>
                    )}
                  </span>
                  <TextArea
                    rows={4}
                    value={doc.pastedText ?? ''}
                    placeholder="Paste the full policy text here…"
                    onChange={(e) => patchDoc(doc.id, { pastedText: e.target.value })}
                    disabled={analyzing}
                  />
                  {doc.scrapeError && (
                    <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">{doc.scrapeError}</p>
                  )}
                </label>
              )}
            </li>
          ))}
        </ul>
      )}

      <Button type="button" onClick={() => void analyze()} disabled={analyzing || savingDraft || parsedUrls.length === 0}>
        <Icon name="auto_awesome" className="!text-[16px]" />
        {analyzing ? 'Scraping & analyzing…' : applied ? 'Re-analyze policies' : 'Scrape & analyze'}
      </Button>

      {(summary || scanSummary) && applied && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex items-start gap-2">
            <Icon name="auto_awesome" className="mt-0.5 !text-[15px] shrink-0 text-pink-500" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">AI policy scan complete</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Continue to the privacy questions to review AI-filled answers and evidence.
              </p>
              {scanSummary && (
                <ul className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {scanSummary.filledAutomatically > 0 && (
                    <li>
                      {scanSummary.filledAutomatically} answer
                      {scanSummary.filledAutomatically === 1 ? '' : 's'} filled automatically
                    </li>
                  )}
                  {scanSummary.needsReview > 0 && (
                    <li>
                      {scanSummary.needsReview} answer{scanSummary.needsReview === 1 ? '' : 's'} need
                      your review
                    </li>
                  )}
                  {scanSummary.notFound > 0 && (
                    <li>
                      {scanSummary.notFound} answer{scanSummary.notFound === 1 ? '' : 's'} not found
                    </li>
                  )}
                  {scanSummary.conflicting > 0 && (
                    <li>
                      {scanSummary.conflicting} answer{scanSummary.conflicting === 1 ? '' : 's'} with
                      conflicting policies
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {analysis?.error && analysis.status === 'failed' && <ErrorNote message={analysis.error} />}
    </div>
  );
});
