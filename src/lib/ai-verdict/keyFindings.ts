import type { AssembledEvidenceItem, AssembledPayload } from './assembleEvidence';
import type { KeyFinding } from './suggestionSchema';

export function deriveKeyFindings(payload: AssembledPayload): KeyFinding[] {
  const findings: KeyFinding[] = [];

  if (payload.overallScore != null) {
    const bench = payload.benchmarks.find((b) => b.kind === 'overall');
    let text = `Overall score: ${payload.overallScore}/10`;
    if (bench?.siteAverage != null) text += ` (site average ${bench.siteAverage})`;
    if (bench?.percentile != null) text += ` — ${bench.percentile}th percentile`;
    findings.push({ text, evidence_ids: [], finding_type: 'score' });
  }

  for (const bench of payload.benchmarks.filter((b) => b.kind === 'category')) {
    if (bench.productScore == null) continue;
    let text = `${bench.refSlug} category score: ${bench.productScore}/10`;
    if (bench.siteAverage != null) text += ` vs site average ${bench.siteAverage}`;
    findings.push({ text, evidence_ids: [], finding_type: 'score' });
  }

  const ranked = [...payload.evidence]
    .filter((e) => e.normalizedScore != null && !e.notApplicable)
    .sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0));

  for (const item of ranked.slice(0, 5)) {
    if ((item.normalizedScore ?? 0) >= 7.5) {
      findings.push({
        text: formatEvidenceFinding(item, 'strong'),
        evidence_ids: [item.id],
        finding_type: 'strength',
      });
    }
  }

  for (const item of ranked.slice(-5).reverse()) {
    if ((item.normalizedScore ?? 0) <= 5 && !item.isUnknown) {
      findings.push({
        text: formatEvidenceFinding(item, 'weak'),
        evidence_ids: [item.id],
        finding_type: 'weakness',
      });
    }
  }

  for (const item of payload.evidence.filter((e) => e.isUnknown)) {
    findings.push({
      text: `Unable to verify: ${item.name}${item.publicResult ? ` (${item.publicResult})` : ''}`,
      evidence_ids: [item.id],
      finding_type: 'neutral',
    });
  }

  if (payload.pricing?.verified && payload.pricing.summary) {
    findings.push({
      text: `Verified pricing: ${payload.pricing.summary}`,
      evidence_ids: [],
      finding_type: 'pricing',
    });
  }

  if (payload.previousRun?.overall != null && payload.overallScore != null) {
    const delta = payload.overallScore - payload.previousRun.overall;
    const dir = delta > 0 ? 'improved' : delta < 0 ? 'declined' : 'unchanged';
    findings.push({
      text: `Overall score ${dir} vs previous run "${payload.previousRun.runName}" (${payload.previousRun.overall} → ${payload.overallScore})`,
      evidence_ids: [],
      finding_type: 'score',
    });
  }

  return findings.slice(0, 12);
}

function formatEvidenceFinding(item: AssembledEvidenceItem, tone: 'strong' | 'weak'): string {
  const result = item.publicResult ? `: ${item.publicResult}` : '';
  const score = item.normalizedScore != null ? ` (${item.normalizedScore}/10)` : '';
  const prefix = tone === 'strong' ? 'Strong result' : 'Weak result';
  return `${prefix} — ${item.name}${result}${score}`;
}
