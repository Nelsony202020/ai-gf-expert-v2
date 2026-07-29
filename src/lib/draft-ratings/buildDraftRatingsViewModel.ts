import type { Product, VerdictItem } from '../../data/products';
import { SAMPLE } from '../../components/admin/testing/sampleSizes';
import { TEST_SESSIONS } from '../../components/admin/testing/sessions';
import { mappedTestGroupsForCategory, DRAFT_CATEGORY_ORDER } from './testGroupMapping';
import {
  buildCalculationSummary,
  buildEvidenceCalculation,
  buildHeadlineConclusion,
  buildPublicHowWeTested,
  buildTrustBadges,
  buildWhatThisMeans,
  enhancedScopeDescription,
  enrichMeasurements,
  methodologyLinkForEvidence,
} from './evidenceDrawerContent';
import { mediaMatchesProofTag, bonusExtraCaption, LIVE_CAM_PROOF_TAG } from '../../components/admin/testing/proofTags';
import { formatBonusFeaturesSummaryLine } from './resolveEvidenceDisplay';
import { evidenceGroupsForSubscore, scopeForContributor } from '../ratings/evidenceCategoryMapping';
import { deferPayAsYouGoScores } from '../ratings/evidenceIcons';
import { toSlug } from '../slugs';
import type {
  DraftCategory,
  DraftCoverageItem,
  DraftEvidenceCategory,
  DraftKeyFinding,
  DraftMeasurement,
  DraftProofItem,
  DraftRatingsDbContext,
  DraftRatingsViewModel,
  DraftSubscore,
  DraftTestGroup,
  DraftTestGroupDrawerSections,
  DraftTestingOverview,
  PublicEvidenceStatus,
} from './types';

function formatSubscoreName(slug: string, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function anchor(...parts: string[]): string {
  return parts.filter(Boolean).join('-').replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-');
}

function mapStatus(row: DraftRatingsDbContext['evidenceResults'][0]): PublicEvidenceStatus {
  if (row.notApplicable) return 'not-applicable';
  if (row.unableToVerify) return 'could-not-verify';
  if (row.isUnknown) return 'not-tested';
  if (row.verificationStatus === 'not_offered') return 'not-offered';
  if (row.verificationStatus === 'failed') return 'test-failed';
  if (!row.publicResult?.trim()) return 'missing';
  return 'verified';
}

function evidenceBySlug(ctx: DraftRatingsDbContext): Map<string, DraftRatingsDbContext['evidenceResults'][0]> {
  return new Map(ctx.evidenceResults.map((e) => [e.slug, e]));
}

function firstSentence(text?: string): string | undefined {
  if (!text?.trim()) return undefined;
  const match = text.trim().match(/^[^.!?]+[.!?]?/);
  return match?.[0]?.trim() || text.trim();
}

function buildResultSummary(measurements: DraftMeasurement[]): string | undefined {
  const parts = measurements
    .filter((m) => m.status === 'verified' && m.value && m.value !== '—')
    .slice(0, 6)
    .map((m) => `${m.value} ${m.label.toLowerCase()}`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function buildMainResult(measurements: DraftMeasurement[]): string | undefined {
  const verified = measurements.filter((m) => m.status === 'verified' && m.value && m.value !== '—');
  if (verified.length === 0) return undefined;
  const top = verified[0];
  return `${top.value} ${top.label.toLowerCase()}`;
}

function buildWhatWeFoundFromMeasurements(measurements: DraftMeasurement[] = []): string | undefined {
  const verified = measurements.filter((m) => m.status === 'verified' && m.value && m.value !== '—');
  if (verified.length === 0) return undefined;
  if (verified.length === 1) {
    return `We recorded ${verified[0].value.toLowerCase()} for ${verified[0].label.toLowerCase()}.`;
  }
  const highlights = verified.slice(0, 4).map((m) => `${m.label.toLowerCase()}: ${m.value}`);
  return `Key results — ${highlights.join('; ')}.`;
}

function buildWhyItMatters(subscoreName: string, categoryName: string): string {
  return `This test helps us score ${subscoreName.toLowerCase()} within ${categoryName.toLowerCase()} — a factor that affects your day-to-day experience.`;
}

function buildScoreCalculation(measurements: DraftMeasurement[]): string | undefined {
  const scored = measurements.filter((m) => m.normalizedScore != null);
  if (scored.length === 0) return undefined;
  const lines = scored.map(
    (m) => `${m.label}: normalized score ${m.normalizedScore!.toFixed(2)} (from "${m.value}")`,
  );
  return lines.join('\n');
}

function buildTechnicalDetails(groupId: string, measurements: DraftMeasurement[]): string {
  const lines = [`Test ID: ${groupId}`];
  for (const m of measurements) {
    lines.push(`${m.slug} · ${m.status} · ${m.value}`);
  }
  return lines.join('\n');
}

function buildDrawerSections(
  group: {
    id: string;
    intro?: string;
    title: string;
    subscoreName: string;
    categoryName: string;
  },
  measurements: DraftMeasurement[],
): DraftTestGroupDrawerSections {
  const mainResult = buildMainResult(measurements);
  const whatWeTested = group.intro;
  const howWeTested = group.intro;
  const whatWeFound = buildWhatWeFoundFromMeasurements(measurements);
  const whyItMatters = buildWhyItMatters(group.subscoreName, group.categoryName);
  const scoreCalculation = buildScoreCalculation(measurements);
  const technicalDetails = buildTechnicalDetails(group.id, measurements);

  return {
    mainResult,
    whatWeTested,
    whyItMatters,
    howWeTested,
    whatWeFound,
    scoreCalculation,
    technicalDetails,
  };
}

function sessionSampleSize(categorySlug: string, sessionId: string): number | undefined {
  const session = (TEST_SESSIONS[categorySlug] ?? []).find((s) => s.id === sessionId);
  return session?.sampleSizeField?.default;
}

function decisionRelevanceScore(m: DraftMeasurement): number {
  if (m.normalizedScore != null) {
    return Math.abs(m.normalizedScore - 5);
  }
  const numeric = parseFloat(m.value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? Math.abs(numeric - 5) : 0;
}

function selectKeyFindings(allMeasurements: DraftMeasurement[]): DraftKeyFinding[] {
  const seen = new Set<string>();
  const candidates = allMeasurements
    .filter((m) => m.status === 'verified' && m.value && m.value !== '—')
    .sort((a, b) => decisionRelevanceScore(b) - decisionRelevanceScore(a));

  const findings: DraftKeyFinding[] = [];
  for (const m of candidates) {
    const key = m.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push({
      slug: m.slug,
      ...humanizeFindingLabel(m.label, m.value),
      status: m.status,
    });
    if (findings.length >= 6) break;
  }

  return findings;
}

function buildTestGroupWhatThisMeans(measurements: DraftMeasurement[]): string | undefined {
  const verified = measurements.filter(
    (m) => m.status === 'verified' && m.value && m.value !== '—',
  );
  if (verified.length === 0) return undefined;

  const scored = verified.filter((m) => m.normalizedScore != null);
  if (scored.length >= 2) {
    const sorted = [...scored].sort(
      (a, b) => (a.normalizedScore ?? 0) - (b.normalizedScore ?? 0),
    );
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];
    if (weakest.slug !== strongest.slug) {
      return `Strong overall, with the weakest point being ${weakest.label.toLowerCase()} (${weakest.value}).`;
    }
  }

  if (verified.length === 1) {
    return `Primary result: ${verified[0].label.toLowerCase()} at ${verified[0].value}.`;
  }

  const highlights = verified.slice(0, 3).map((m) => `${m.label.toLowerCase()} (${m.value})`);
  return `Key results include ${highlights.join(', ')}.`;
}

function formatProofLabel(count: number, items: DraftProofItem[] = []): string {
  if (count <= 0) return '';
  const images = items.filter((p) => p.kind === 'image').length;
  if (images === count) return count === 1 ? '1 screenshot' : `${count} screenshots`;
  return count === 1 ? '1 proof file' : `${count} proof files`;
}

function humanizeFindingLabel(label: string, value: string): { label: string; value: string } {
  const lower = label.toLowerCase();
  if (lower.includes('consistency') && (value === '0%' || value === '0')) {
    return { label: 'Contradictions', value: '0%' };
  }
  if (lower.includes('error') && !lower.includes('errors')) {
    return { label: label.replace(/rate/i, 'errors').replace(/count/i, 'errors'), value };
  }
  return { label, value };
}

function buildScopeDescription(sub: DraftSubscore, productDescription?: string): string | undefined {
  if (productDescription?.trim()) return productDescription.trim();
  const name = sub.name.toLowerCase();
  if (name.includes('understanding')) {
    return 'How well the AI remembered earlier messages, answered directly, used context, followed rules, and stayed accurate in roleplay.';
  }
  if (name.includes('realism')) {
    return 'How natural, emotional, and human-like the AI felt during conversation.';
  }
  if (name.includes('reliability')) {
    return 'How consistently the AI responded, recovered from errors, and stayed stable over repeated use.';
  }
  if (name.includes('variety')) {
    return 'How much choice and diversity the library offers across styles, identities, and scenarios.';
  }
  if (name.includes('quality')) {
    return 'How original, complete, and visually consistent the profiles or outputs are.';
  }
  if (name.includes('discovery')) {
    return 'How easy it is to search, filter, browse, and find what you want.';
  }
  return sub.explanation;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function averageEvidenceScore(measurements: DraftMeasurement[]): number | null {
  const scored = measurements.filter((m) => m.normalizedScore != null);
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, m) => acc + m.normalizedScore!, 0);
  return round1(sum / scored.length);
}

function buildCategorySummary(
  contributor: { label: string; value: string },
  testResults: DraftMeasurement[],
  opts?: { platformExtras?: boolean; bySlug?: Map<string, DraftRatingsDbContext['evidenceResults'][0]> },
): string {
  if (opts?.platformExtras && opts.bySlug) {
    const formatted = formatBonusFeaturesSummaryLine(
      opts.bySlug.get('platform-extras-list')?.rawValue,
      opts.bySlug.get('live-cam')?.rawValue,
    );
    if (formatted) return formatted;
  }
  if (contributor.value?.trim() && contributor.value !== '—') {
    return contributor.value.trim();
  }
  const parts = testResults
    .filter((m) => m.value && m.value !== '—')
    .slice(0, 3)
    .map((m) => `${m.label}: ${m.value}`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function measurementFromRow(
  slug: string,
  row: DraftRatingsDbContext['evidenceResults'][0] | undefined,
): DraftMeasurement {
  if (!row) {
    return { slug, label: slug, value: '—', status: 'missing' };
  }
  return {
    slug,
    label: row.name,
    value: row.publicResult?.trim() || '—',
    status: mapStatus(row),
    normalizedScore: row.normalizedScore ?? null,
  };
}

function buildCardTeaser(results: DraftMeasurement[], max = 4): string {
  return results
    .filter((m) => m.value && m.value !== '—')
    .slice(0, max)
    .map((m) => {
      const short = m.label.replace(/\s+characters?$/i, '').trim();
      return `${m.value} ${short.toLowerCase()}`;
    })
    .join(' · ');
}

function buildCategoryMeaning(scope?: string, summary?: string): string | undefined {
  if (scope?.trim()) return scope.trim();
  if (summary?.trim() && summary.length < 120) return summary.trim();
  return undefined;
}

function buildCategoryScoreCalculation(
  name: string,
  score: number | null,
  results: DraftMeasurement[],
): string | undefined {
  if (score == null) return undefined;
  const scored = results.filter((m) => m.normalizedScore != null);
  const lines = [`${name} score: ${score.toFixed(1)}`];
  if (scored.length > 0) {
    lines.push('', 'Combined from these evidence scores:');
    for (const m of scored) {
      lines.push(`  ${m.label}: ${m.normalizedScore!.toFixed(1)} (measured ${m.value})`);
    }
  }
  return lines.join('\n');
}

function buildWhatWeFound(
  name: string,
  summary: string,
  results: DraftMeasurement[] = [],
): string | undefined {
  if (summary?.trim() && summary.length > 20 && summary.length < 280) return summary.trim();
  const verified = results.filter((m) => m.value && m.value !== '—');
  if (verified.length === 0) return undefined;
  if (verified.length === 1) return `${name}: ${verified[0].label} measured at ${verified[0].value}.`;
  const top = verified.slice(0, 3).map((m) => `${m.value} ${m.label.toLowerCase()}`);
  return `We recorded ${top.join(', ')}${verified.length > 3 ? ', and more' : ''}.`;
}

function buildLimitations(slug: string): string | undefined {
  if (slug === 'amount' || slug.includes('count')) {
    return 'These numbers show what we saw during testing. The library can change if characters are added, removed, or hidden.';
  }
  if (slug === 'browsing' || slug === 'search') {
    return 'These results come from the tests we ran on one account at one point in time.';
  }
  return undefined;
}

function isPlatformExtrasCategory(slug: string, memberSlugs?: string[]): boolean {
  return (
    slug === 'platform-extras-list' ||
    slug === 'platform-extras' ||
    Boolean(memberSlugs?.includes('platform-extras-list'))
  );
}

function buildBonusExtrasWithProof(
  listRaw: unknown,
  proofItems: DraftProofItem[],
): Array<{ id: string; name: string; note?: string; proof: DraftProofItem[] }> {
  const structured =
    listRaw && typeof listRaw === 'object' && 'structured' in listRaw
      ? (listRaw as { structured?: { hasBonus?: string; extras?: Array<{ id?: string; name?: string; note?: string }> } })
          .structured
      : undefined;
  if (structured?.hasBonus !== 'yes') return [];
  const saved = Array.isArray(structured?.extras) ? structured!.extras! : [];
  return saved
    .map((row, idx) => {
      const name = row.name?.trim() ?? '';
      if (!name) return null;
      const id = typeof row.id === 'string' && row.id ? row.id : `legacy-${idx}`;
      return {
        id,
        name,
        note: row.note?.trim() || undefined,
        proof: proofItems.filter((p) => mediaMatchesProofTag(p.caption, bonusExtraCaption(id))),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
}

function liveCamProofItems(proofItems: DraftProofItem[]): DraftProofItem[] {
  return proofItems.filter((p) => mediaMatchesProofTag(p.caption, LIVE_CAM_PROOF_TAG));
}

function finalizeEvidenceCategory(
  catSlug: string,
  subSlug: string,
  partial: Omit<
    DraftEvidenceCategory,
    | 'drawerId'
    | 'selectedProof'
    | 'cardTeaser'
    | 'meaning'
    | 'scoreCalculation'
    | 'breadcrumb'
    | 'headlineConclusion'
    | 'calculation'
    | 'methodologyUrl'
    | 'technicalAudit'
  > & { memberSlugs?: string[] },
  bySlug: Map<string, DraftRatingsDbContext['evidenceResults'][0]>,
  testGroup: DraftTestGroup | undefined,
  context: {
    productName: string;
    categoryName: string;
    subscoreName: string;
    lastTested?: string;
    methodologyVersion?: string;
    paidAccount?: boolean;
  },
): DraftEvidenceCategory {
  const { memberSlugs, ...rest } = partial;
  const rawResults = rest.testResults ?? [];
  const testResults = enrichMeasurements(rawResults);
  const verified = testResults.filter(
    (m) => m.status === 'verified' && m.value && m.value !== '—',
  );
  const proofItems =
    memberSlugs?.flatMap((s) => bySlug.get(s)?.proof ?? []) ??
    verified.flatMap((m) => bySlug.get(m.slug)?.proof ?? []);
  const scopeDescription = enhancedScopeDescription(
    rest.slug,
    rest.scopeDescription ?? scopeForContributor(rest.name),
  );
  const whatWeFound = buildWhatWeFound(rest.name, rest.summary, verified.length > 0 ? verified : testResults);
  const calculation = buildEvidenceCalculation(rest.name, rest.score, testResults);
  const calculationSummary = buildCalculationSummary(
    context.productName,
    rest.name,
    testResults,
  );
  if (calculation && calculationSummary) {
    calculation.summary = calculationSummary;
  }

  const platformExtras = isPlatformExtrasCategory(rest.slug, memberSlugs);
  let summary = rest.summary;
  if (platformExtras) {
    const line = formatBonusFeaturesSummaryLine(
      bySlug.get('platform-extras-list')?.rawValue,
      bySlug.get('live-cam')?.rawValue,
    );
    if (line) summary = line;
  }

  return {
    ...rest,
    summary,
    testResults,
    scopeDescription,
    drawerId: `evidence-${catSlug}-${subSlug}-${rest.slug}`,
    selectedProof: proofItems.slice(0, 12),
    cardTeaser: buildCardTeaser(verified.length > 0 ? verified : testResults),
    meaning: buildCategoryMeaning(scopeDescription, summary),
    mainResult: verified[0] ? `${verified[0].value} ${verified[0].label.toLowerCase()}` : summary,
    whyItMatters:
      scopeDescription ??
      `This helps us score ${rest.name.toLowerCase()} as part of the overall rating.`,
    whatWeTested: testGroup?.whatWeTested ?? testGroup?.publicDescription,
    howWeTested: buildPublicHowWeTested(
      context.productName,
      catSlug,
      rest.slug,
      testGroup?.drawerSections?.howWeTested ?? testGroup?.howWeTested,
    ),
    whatWeFound,
    whatThisMeans: buildWhatThisMeans(context.productName, rest.slug, testResults, rest.score),
    limitations: buildLimitations(rest.slug),
    scoreCalculation: buildCategoryScoreCalculation(rest.name, rest.score, testResults),
    breadcrumb: `${context.categoryName} › ${context.subscoreName} › ${rest.name}`,
    categorySlug: catSlug,
    subscoreSlug: subSlug,
    categoryName: context.categoryName,
    subscoreName: context.subscoreName,
    headlineConclusion: buildHeadlineConclusion(rest.name, testResults, whatWeFound),
    calculation,
    methodologyUrl: methodologyLinkForEvidence(catSlug, subSlug, rest.name),
    trustBadges: buildTrustBadges({
      paidAccount: context.paidAccount,
      lastTested: context.lastTested,
      methodologyVersion: context.methodologyVersion,
      fullLibrary: catSlug === 'characters' && rest.slug === 'amount',
    }),
    technicalAudit: testResults.map((m) => ({
      slug: m.slug,
      evidenceId: bySlug.get(m.slug)?.id,
      rawValue: m.value,
      internalScore: m.normalizedScore ?? null,
    })),
    bonusExtras: isPlatformExtrasCategory(rest.slug, memberSlugs)
      ? buildBonusExtrasWithProof(bySlug.get('platform-extras-list')?.rawValue, proofItems)
      : undefined,
    liveCamProof: isPlatformExtrasCategory(rest.slug, memberSlugs)
      ? liveCamProofItems(proofItems)
      : undefined,
  };
}

function buildEvidenceCategories(
  catSlug: string,
  sub: DraftSubscore,
  productContributors: Array<{ label: string; value: string; internalScore?: number }>,
  bySlug: Map<string, DraftRatingsDbContext['evidenceResults'][0]>,
  context: {
    productName: string;
    categoryName: string;
    lastTested?: string;
    methodologyVersion?: string;
    paidAccount?: boolean;
  },
): DraftEvidenceCategory[] {
  const dbRows = [...bySlug.values()].filter(
    (r) => r.categorySlug === catSlug && r.subscoreSlug === sub.slug,
  );
  if (catSlug === 'pricing' && dbRows.length > 0) {
    return dbRows.map((row) => {
      const testResults = [measurementFromRow(row.slug, row)];
      const testGroup = sub.testGroups.find((g) => g.measurements.some((m) => m.slug === row.slug));
      return finalizeEvidenceCategory(
        catSlug,
        sub.slug,
        {
          slug: row.slug,
          name: row.name,
          score: row.normalizedScore ?? null,
          summary: row.publicResult?.trim() || '—',
          testResults,
          testGroupId: testGroup?.id,
          proofCount: row.proofCount ?? 0,
          proofLabel: formatProofLabel(row.proofCount ?? 0, row.proof ?? []),
          memberSlugs: [row.slug],
        },
        bySlug,
        testGroup,
        { ...context, subscoreName: sub.name },
      );
    });
  }

  const groupDefs = evidenceGroupsForSubscore(catSlug, sub.slug);
  const contributorBySlug = new Map(
    productContributors.map((c) => [toSlug(c.label), c]),
  );

  if (groupDefs?.length) {
    return groupDefs
      .map((group) => {
        const testResults = group.memberSlugs.map((memberSlug) =>
          measurementFromRow(memberSlug, bySlug.get(memberSlug)),
        );
        const verifiedResults = testResults.filter(
          (m) => m.status === 'verified' && m.value && m.value !== '—',
        );
        if (verifiedResults.length === 0 && group.memberSlugs.every((s) => !bySlug.has(s))) {
          return null;
        }
        const testGroup = sub.testGroups.find((g) =>
          g.measurements.some((m) => group.memberSlugs.includes(m.slug)),
        );
        const testGroupId = testGroup?.id;
        const proofItems = group.memberSlugs.flatMap((s) => bySlug.get(s)?.proof ?? []);
        const proofCount = group.memberSlugs.reduce(
          (n, s) => n + (bySlug.get(s)?.proofCount ?? 0),
          0,
        );
        const productContributor = contributorBySlug.get(group.slug);

        return finalizeEvidenceCategory(
          catSlug,
          sub.slug,
          {
            slug: group.slug,
            name: group.name,
            score:
              productContributor?.internalScore ??
              averageEvidenceScore(verifiedResults) ??
              null,
            summary: productContributor
              ? buildCategorySummary(productContributor, verifiedResults, {
                  platformExtras: isPlatformExtrasCategory(group.slug, group.memberSlugs),
                  bySlug,
                })
              : buildCategorySummary({ label: group.name, value: '—' }, verifiedResults, {
                  platformExtras: isPlatformExtrasCategory(group.slug, group.memberSlugs),
                  bySlug,
                }),
            scopeDescription: scopeForContributor(group.name),
            testResults: verifiedResults.length > 0 ? verifiedResults : testResults,
            testGroupId,
            proofCount,
            proofLabel: formatProofLabel(proofCount, proofItems),
            memberSlugs: group.memberSlugs,
          },
          bySlug,
          testGroup,
          {
            ...context,
            subscoreName: sub.name,
          },
        );
      })
      .filter((item): item is DraftEvidenceCategory => item != null);
  }

  if (productContributors.length === 0) {
    const verified = sub.testGroups
      .flatMap((g) => g.measurements)
      .filter((m) => m.status === 'verified' && m.value && m.value !== '—');
    return verified.map((m) => {
      const testGroup = sub.testGroups.find((g) => g.measurements.some((x) => x.slug === m.slug));
      return finalizeEvidenceCategory(
        catSlug,
        sub.slug,
        {
          slug: m.slug,
          name: m.label,
          score: m.normalizedScore ?? null,
          summary: m.value,
          testResults: [m],
          testGroupId: testGroup?.id,
          proofCount: bySlug.get(m.slug)?.proofCount ?? 0,
          proofLabel: formatProofLabel(
            bySlug.get(m.slug)?.proofCount ?? 0,
            bySlug.get(m.slug)?.proof ?? [],
          ),
          memberSlugs: [m.slug],
        },
        bySlug,
        testGroup,
        {
          ...context,
          subscoreName: sub.name,
        },
      );
    });
  }

  return productContributors.map((contributor) => {
    const slug = toSlug(contributor.label);
    const members = [slug];
    const testResults = members.map((memberSlug) =>
      measurementFromRow(memberSlug, bySlug.get(memberSlug)),
    );
    const verifiedResults = testResults.filter(
      (m) => m.status === 'verified' && m.value && m.value !== '—',
    );
    const testGroup = sub.testGroups.find((g) =>
      g.measurements.some((m) => members.includes(m.slug)),
    );
    const proofItems = members.flatMap((s) => bySlug.get(s)?.proof ?? []);
    const proofCount = members.reduce((n, s) => n + (bySlug.get(s)?.proofCount ?? 0), 0);

    return finalizeEvidenceCategory(
      catSlug,
      sub.slug,
      {
        slug,
        name: contributor.label,
        score: contributor.internalScore ?? averageEvidenceScore(verifiedResults) ?? null,
        summary: buildCategorySummary(contributor, verifiedResults, {
          platformExtras: isPlatformExtrasCategory(slug, members),
          bySlug,
        }),
        scopeDescription: scopeForContributor(contributor.label),
        testResults: verifiedResults.length > 0 ? verifiedResults : testResults,
        testGroupId: testGroup?.id,
        proofCount,
        proofLabel: formatProofLabel(proofCount, proofItems),
        memberSlugs: members,
      },
      bySlug,
      testGroup,
      {
        ...context,
        subscoreName: sub.name,
      },
    );
  });
}

function buildSubscoreExplanation(sub: DraftSubscore): string | undefined {
  if (sub.finding?.trim()) return sub.finding.trim();
  const top = sub.keyMeasurements.find((m) => m.status === 'verified' && m.value && m.value !== '—');
  if (top) return `${top.label}: ${top.value}`;
  if (sub.score != null) return `Scored ${sub.score.toFixed(1)} out of 10 based on our testing.`;
  return undefined;
}

function verdictForCategory(product: Product, categorySlug: string): VerdictItem | undefined {
  return product.verdicts.find((v) => v.id === categorySlug);
}

function fmtTestPeriod(lastTestedAt?: number, fallback?: string): string {
  if (lastTestedAt) {
    return new Date(lastTestedAt).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
  if (fallback) {
    const parsed = Date.parse(fallback);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return fallback;
  }
  return '—';
}

function fmtMethodologyVersion(raw: string | undefined, fallback: string): string {
  const v = (raw ?? fallback).replace(/^Methodology\s*/i, '').trim();
  return v.startsWith('v') ? v : `v${v}`;
}

function buildTrustStatement(productName: string, paidAccount: boolean, methodologyVersion: string): string {
  const account = paidAccount ? 'a paid account' : 'a test account';
  return `We tested ${productName} using ${account} across chat, images, video, privacy, and pricing using Methodology ${methodologyVersion}.`;
}

function categoryCoverageSummary(
  slug: string,
  groups: DraftTestGroup[],
): 'complete' | 'partial' | 'empty' {
  if (groups.length === 0) return 'empty';
  const complete = groups.filter((g) => g.status === 'complete').length;
  if (complete === groups.length) return 'complete';
  if (groups.some((g) => g.status !== 'empty')) return 'partial';
  return 'empty';
}

function buildTestingCoverage(categories: DraftCategory[]): DraftCoverageItem[] {
  const items: DraftCoverageItem[] = [];
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  items.push({
    label: 'Chat',
    summary: `${SAMPLE.chatConversations} sessions`,
  });

  const imageTotal = SAMPLE.imageBatch + SAMPLE.imageConsistency;
  items.push({
    label: 'Images',
    summary: `${imageTotal} generations`,
    detail: `${SAMPLE.imageBatch} quality tests + ${SAMPLE.imageConsistency} consistency tests`,
  });

  items.push({
    label: 'Video',
    summary: `${SAMPLE.videoBatch} tests`,
  });

  const pricingStatus = categoryCoverageSummary('pricing', bySlug.pricing?.subscores.flatMap((s) => s.testGroups) ?? []);
  if (pricingStatus !== 'empty') {
    items.push({ label: 'Pricing', summary: 'Verified', verified: true });
  }

  const privacyStatus = categoryCoverageSummary('privacy', bySlug.privacy?.subscores.flatMap((s) => s.testGroups) ?? []);
  if (privacyStatus !== 'empty') {
    items.push({ label: 'Privacy', summary: 'Reviewed', verified: true });
  }

  return items;
}

function buildTestingOverview(
  product: Product,
  ctx: DraftRatingsDbContext,
  categories: DraftCategory[],
  allGroups: DraftTestGroup[],
  completedEvidence: number,
  totalRequiredEvidence: number,
  proofTotal: number,
): DraftTestingOverview {
  const methodologyVersion = fmtMethodologyVersion(
    ctx.methodologyVersion,
    product.methodology.replace(/^Methodology\s*/i, '') || '3.1',
  );
  const paidAccount = ctx.paidAccountTested ?? product.overallScore != null;
  const tester = product.authors[0]?.name;
  const pricingVerifiedDate = product.modifiedDate || undefined;

  const metadataParts: string[] = [`Methodology ${methodologyVersion}`];
  if (paidAccount) metadataParts.push('Paid account');
  if (tester) metadataParts.push(`Tested by ${tester}`);
  if (pricingVerifiedDate) metadataParts.push(`Pricing verified ${pricingVerifiedDate}`);

  const testGroupsCompleted = allGroups.filter((g) => g.status !== 'empty').length;

  return {
    productName: product.name,
    trustStatement: buildTrustStatement(product.name, paidAccount, methodologyVersion),
    completedEvidence,
    totalRequiredEvidence,
    testGroupsCompleted,
    testGroupCount: allGroups.length,
    proofAttachments: proofTotal,
    lastTested: fmtTestPeriod(ctx.lastTestedAt, product.reviewedDate),
    coverage: buildTestingCoverage(categories),
    metadataParts,
    methodologyVersion,
    testRunStatus: ctx.testRun?.status ?? (product.overallScore != null ? 'published' : 'draft'),
    testRunId: ctx.testRun?.id,
  };
}

export function buildDraftRatingsViewModel(
  product: Product,
  ctx: DraftRatingsDbContext,
): DraftRatingsViewModel {
  const bySlug = evidenceBySlug(ctx);
  const required = ctx.evidenceResults.filter((e) => e.required);
  const completed = required.filter(
    (e) => e.publicResult?.trim() || e.notApplicable || e.unableToVerify,
  );
  const proofTotal = ctx.evidenceResults.reduce((n, e) => n + e.proofCount, 0);
  const methodologyVersion = fmtMethodologyVersion(
    ctx.methodologyVersion,
    product.methodology.replace(/^Methodology\s*/i, '') || '3.1',
  );
  const lastTested = fmtTestPeriod(ctx.lastTestedAt, product.lastTested);
  const paidAccount = ctx.paidAccountTested ?? product.overallScore != null;
  const drawerContext = {
    productName: product.name,
    lastTested,
    methodologyVersion,
    paidAccount,
  };

  const categories: DraftCategory[] = [];

  for (const catSlug of DRAFT_CATEGORY_ORDER) {
    const productCat = product.categories.find((c) => c.key === catSlug);
    if (!productCat) continue;

    const verdict = verdictForCategory(product, catSlug);
    const mappedGroups = mappedTestGroupsForCategory(catSlug);
    const subscoreNames = ctx.subscoresByCategory.get(catSlug) ?? [];

    const subscoreMap = new Map<string, DraftSubscore>();

    const subscoreSeeds =
      subscoreNames.length > 0
        ? subscoreNames.map((meta) => {
            const productSub = productCat.subscores.find((s) => {
              const slug =
                subscoreNames.find((n) => n.name === s.name)?.slug ??
                s.name.toLowerCase().replace(/\s+/g, '-');
              return slug === meta.slug || s.name === meta.name;
            });
            return { slug: meta.slug, name: meta.name, productSub };
          })
        : productCat.subscores.map((s) => ({
            slug:
              subscoreNames.find((n) => n.name === s.name)?.slug ??
              s.name.toLowerCase().replace(/\s+/g, '-'),
            name: s.name,
            productSub: s,
          }));

    for (const { slug, name, productSub } of subscoreSeeds) {
      subscoreMap.set(slug, {
        slug,
        name,
        score: productSub?.score ?? null,
        finding: productSub?.description || undefined,
        keyMeasurements: [],
        evidenceCategories: [],
        testGroups: [],
        testCount: 0,
        recordedResultCount: 0,
        proofCount: 0,
        proofLabel: '',
      });
    }

    for (const group of mappedGroups) {
      const measurements: DraftMeasurement[] = group.slugs.map((slug) => {
        const row = bySlug.get(slug);
        if (!row) {
          return { slug, label: slug, value: '—', status: 'missing' as PublicEvidenceStatus };
        }
        return {
          slug,
          label: row.name,
          value: row.publicResult?.trim() || '—',
          status: mapStatus(row),
          normalizedScore: row.normalizedScore ?? null,
        };
      });

      const proof: DraftProofItem[] = group.slugs.flatMap((slug) => bySlug.get(slug)?.proof ?? []);
      const subscoreName =
        subscoreMap.get(group.subscoreSlug)?.name ??
        formatSubscoreName(
          group.subscoreSlug,
          subscoreNames.find((s) => s.slug === group.subscoreSlug)?.name,
        );

      const drawerSections = buildDrawerSections(
        {
          id: group.id,
          intro: group.intro,
          title: group.title,
          subscoreName,
          categoryName: productCat.name,
        },
        measurements,
      );

      const subscoreEntry = subscoreMap.get(group.subscoreSlug);
      const verifiedCount = measurements.filter((m) => m.status === 'verified').length;
      const testGroup: DraftTestGroup = {
        id: group.id,
        anchor: anchor(catSlug, group.subscoreSlug, group.id),
        title: group.title,
        description: group.intro,
        categorySlug: catSlug,
        categoryName: productCat.name,
        subscoreSlug: group.subscoreSlug,
        subscoreName,
        subscoreScore: subscoreEntry?.score ?? null,
        measurementCount: measurements.length,
        proofCount: proof.length,
        checkCount: verifiedCount,
        proofLabel: formatProofLabel(proof.length, proof),
        resultSummary: buildResultSummary(measurements),
        howWeTested: group.intro,
        whyItMatters: drawerSections.whyItMatters,
        measurements,
        selectedProof: proof.slice(0, 8),
        status:
          measurements.some((m) => m.status === 'verified')
            ? 'complete'
            : measurements.some((m) => m.value !== '—')
              ? 'partial'
              : 'empty',
        publicName: group.title,
        publicDescription: firstSentence(group.intro),
        mainResult: drawerSections.mainResult,
        whatThisMeans: buildTestGroupWhatThisMeans(measurements),
        sampleSize: sessionSampleSize(catSlug, group.id),
        whatWeTested: group.intro,
        whatWeFound: drawerSections.whatWeFound,
        drawerSections,
      };

      const existing = subscoreMap.get(group.subscoreSlug);
      if (existing) {
        existing.testGroups.push(testGroup);
      } else {
        subscoreMap.set(group.subscoreSlug, {
          slug: group.subscoreSlug,
          name: testGroup.subscoreName,
          score: null,
          keyMeasurements: measurements.slice(0, 4),
          evidenceCategories: [],
          testGroups: [testGroup],
          testCount: 0,
          recordedResultCount: 0,
          proofCount: 0,
          proofLabel: '',
        });
      }
    }

    for (const sub of subscoreMap.values()) {
      const productSub = productCat.subscores.find((s) => {
        const slug =
          subscoreNames.find((n) => n.name === s.name)?.slug ??
          s.name.toLowerCase().replace(/\s+/g, '-');
        return slug === sub.slug;
      });
      const measurements = sub.testGroups.flatMap((g) => g.measurements);
      sub.keyMeasurements = measurements
        .filter((m) => m.status === 'verified' && m.value && m.value !== '—')
        .slice(0, 6);
      sub.explanation = buildSubscoreExplanation(sub);
      sub.testCount = sub.testGroups.length;
      sub.recordedResultCount = measurements.filter((m) => m.status === 'verified').length;
      sub.proofCount = sub.testGroups.reduce((n, g) => n + g.proofCount, 0);
      const allProof = sub.testGroups.flatMap((g) => g.selectedProof);
      sub.proofLabel = formatProofLabel(sub.proofCount, allProof);
      sub.scopeDescription = buildScopeDescription(sub, sub.finding);
      sub.evidenceCategories = buildEvidenceCategories(
        catSlug,
        sub,
        productSub?.contributors ?? [],
        bySlug,
        {
          ...drawerContext,
          categoryName: productCat.name,
        },
      );
      if (deferPayAsYouGoScores(product.slug, sub.slug)) {
        sub.evidenceCategories = sub.evidenceCategories.map((ec) => ({
          ...ec,
          score: null,
          calculation: ec.calculation
            ? {
                ...ec.calculation,
                finalScore: null,
                formulaTotal: null,
                rows: ec.calculation.rows.map((row) => ({ ...row, internalScore: null })),
              }
            : undefined,
          scoreCalculation: ec.scoreCalculation
            ? { ...ec.scoreCalculation, score: null }
            : undefined,
        }));
      }
    }

    const subscores = [...subscoreMap.values()];
    const allGroups = subscores.flatMap((s) => s.testGroups);
    const allMeasurements = allGroups.flatMap((g) => g.measurements);
    const proofCount = allGroups.reduce((n, g) => n + g.proofCount, 0);
    const recordedResultCount = allMeasurements.filter((m) => m.status === 'verified').length;
    const keyFindings = selectKeyFindings(allMeasurements);

    categories.push({
      slug: catSlug,
      name: productCat.name,
      score: productCat.score,
      weight: productCat.weight,
      categoryVerdict: verdict?.summary || verdict?.tagline || productCat.whatThisMeans || undefined,
      primaryStrength: verdict?.pros?.[0],
      primaryLimitation: verdict?.cons?.[0],
      keyStats: keyFindings.map((f) => ({
        slug: f.slug,
        label: f.label,
        value: f.value,
        status: f.status,
      })),
      keyFindings,
      subscores,
      testGroupCount: allGroups.length,
      measurementCount: allMeasurements.length,
      proofCount,
      publicTestCount: allGroups.length,
      recordedResultCount,
      proofFileCount: proofCount,
      anchor: anchor('category', catSlug),
    });
  }

  const allGroupsFlat = categories.flatMap((c) => c.subscores.flatMap((s) => s.testGroups));
  const overview = buildTestingOverview(
    product,
    ctx,
    categories,
    allGroupsFlat,
    completed.length,
    required.length || ctx.evidenceResults.length,
    proofTotal,
  );

  return {
    product,
    overview,
    categories,
    detailLevelDefault: 'summary',
    experimental: true,
  };
}
