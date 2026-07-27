import type { CategoryEvidenceEntry } from './useCategoryEvidence';

export function deriveCategoryKeyFindings(opts: {
  categoryName: string;
  score: number | null;
  evidence: CategoryEvidenceEntry[];
  max?: number;
}): { findings: string[]; hasEvidence: boolean } {
  const max = opts.max ?? 5;
  const withResults = opts.evidence.filter((e) => e.publicResult?.trim() || e.publicExplanation?.trim());

  if (withResults.length === 0 && opts.score == null) {
    return { findings: [], hasEvidence: false };
  }

  const findings: string[] = [];
  const push = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || findings.includes(trimmed) || findings.length >= max) return;
    findings.push(trimmed);
  };

  if (opts.score != null) {
    const label = opts.categoryName.toLowerCase();
    if (opts.score >= 8.5) push(`Strong overall ${label} performance (${opts.score.toFixed(1)}/10)`);
    else if (opts.score >= 7) push(`Solid ${label} performance (${opts.score.toFixed(1)}/10)`);
    else if (opts.score < 6) push(`Below-average ${label} score (${opts.score.toFixed(1)}/10)`);
  }

  const scored = withResults
    .filter((e) => e.normalizedScore != null)
    .sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0));

  for (const e of scored.slice(0, 2)) {
    if ((e.normalizedScore ?? 0) >= 7) {
      push(e.publicResult ? `${e.name} — ${e.publicResult}` : e.name);
    }
  }

  const weak = [...scored].sort((a, b) => (a.normalizedScore ?? 0) - (b.normalizedScore ?? 0));
  for (const e of weak.slice(0, 2)) {
    if ((e.normalizedScore ?? 10) < 6) {
      push(
        e.publicExplanation?.trim() ||
          (e.publicResult ? `${e.name} — ${e.publicResult}` : `${e.name} underperformed in testing`),
      );
    }
  }

  for (const e of withResults) {
    if (findings.length >= max) break;
    if (findings.some((f) => f.startsWith(e.name))) continue;
    push(e.publicResult ? `${e.name} — ${e.publicResult}` : e.name);
  }

  return {
    findings: findings.slice(0, max),
    hasEvidence: withResults.length > 0 || opts.score != null,
  };
}
