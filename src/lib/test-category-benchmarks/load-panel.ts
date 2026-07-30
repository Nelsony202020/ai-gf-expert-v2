import type {
  BenchmarkMainRowConfig,
  BenchmarkMinimumConfig,
  CategoryBenchmarkPanelConfig,
  ResolvedBenchmarkMainRow,
  ResolvedBenchmarkPanel,
} from './types';
import { getEvidenceScoringDefinition } from './evidence-registry';
import {
  formatBenchmarkTiersFromRule,
  formatGoodThresholdFromRule,
  formatSubscoreControlTiers,
  formatYnlPassCountTiers,
} from './format-from-rule';
import { getMethodologySubscoreEvidenceCount } from './methodology-source';
import { loadPricingMarketRows } from './pricing-market';
import {
  categoryBenchmarkConfigs,
  getCategoryBenchmarkConfig,
  getSubscoreBenchmarkConfig,
  subscoreBenchmarkConfigs,
} from '../../data/test-category-benchmarks';

function resolveMainRow(row: BenchmarkMainRowConfig): ResolvedBenchmarkMainRow {
  if (row.compositeRef?.kind === 'ynl-pass-count') {
    const derived = formatYnlPassCountTiers(row.compositeRef.slugs.length);
    if (derived) {
      return { label: row.label, ...derived, resolvedFromScoring: true };
    }
  }

  if (row.subscoreCountRef?.kind === 'subscore-control-count') {
    const count = getMethodologySubscoreEvidenceCount(
      row.subscoreCountRef.category,
      row.subscoreCountRef.subscore,
    );
    const derived = formatSubscoreControlTiers(count);
    if (derived) {
      return { label: row.label, ...derived, resolvedFromScoring: true };
    }
  }

  if (!row.evidenceRef) {
    return { ...row, resolvedFromScoring: false };
  }

  const def = getEvidenceScoringDefinition(row.evidenceRef.category, row.evidenceRef.slug);
  if (!def) {
    return { ...row, resolvedFromScoring: false };
  }

  const derived = formatBenchmarkTiersFromRule(def.scoringRule, {
    goodMinScore: row.evidenceRef.goodMinScore,
    typicalMinScore: row.evidenceRef.typicalMinScore,
    unit: def.unit,
    measurementType: def.measurementType,
  });
  if (!derived) {
    return { ...row, resolvedFromScoring: false };
  }

  return {
    label: row.label,
    good: derived.good,
    typical: derived.typical,
    weak: derived.weak,
    resolvedFromScoring: true,
  };
}

function resolveMinimum(item: BenchmarkMinimumConfig): BenchmarkMinimumConfig {
  if (!item.evidenceRef) {
    return item;
  }

  const def = getEvidenceScoringDefinition(item.evidenceRef.category, item.evidenceRef.slug);
  if (!def) {
    return item;
  }

  const derived = formatGoodThresholdFromRule(def.scoringRule, {
    goodMinScore: item.evidenceRef.goodMinScore,
    typicalMinScore: item.evidenceRef.typicalMinScore,
    unit: def.unit,
    measurementType: def.measurementType,
  });
  if (!derived) {
    return item;
  }

  return { ...item, value: derived };
}

async function resolveConfig(config: CategoryBenchmarkPanelConfig): Promise<ResolvedBenchmarkPanel> {
  let mainRows = config.mainRows;

  if (config.marketData) {
    mainRows = await loadPricingMarketRows();
  }

  return {
    categoryKey: config.categoryKey,
    title: config.title,
    intro: config.intro,
    mainSectionTitle: config.mainSectionTitle,
    minimumSectionTitle: config.minimumSectionTitle ?? 'Minimum useful standard',
    tierLabels: config.tierLabels,
    tierVariant: config.tierVariant ?? 'standard',
    mainRows: mainRows.map(resolveMainRow),
    minimums: config.minimums.map(resolveMinimum),
    redFlags: config.redFlags,
    footerText:
      config.footer === 'live' ? 'Live benchmarks · Auto-updated' : 'Testing benchmarks · Auto-synced',
    footerIcon: config.footer === 'live' ? 'update' : 'sync',
  };
}

export function hasCategoryBenchmarkPanel(categoryKey: string): boolean {
  return categoryKey in categoryBenchmarkConfigs;
}

export function hasSubscoreBenchmarkPanel(categoryKey: string, subscoreSlug: string): boolean {
  return `${categoryKey}/${subscoreSlug}` in subscoreBenchmarkConfigs;
}

export async function loadCategoryBenchmarkPanel(
  categoryKey: string,
): Promise<ResolvedBenchmarkPanel | null> {
  const config = getCategoryBenchmarkConfig(categoryKey);
  if (!config) return null;
  return resolveConfig(config);
}

export async function loadSubscoreBenchmarkPanel(
  categoryKey: string,
  subscoreSlug: string,
  introOverride?: string,
): Promise<ResolvedBenchmarkPanel | null> {
  const config = getSubscoreBenchmarkConfig(categoryKey, subscoreSlug);
  if (!config) return null;
  const panel = await resolveConfig(config);
  if (introOverride) {
    return { ...panel, intro: introOverride };
  }
  return panel;
}

export { categoryBenchmarkConfigs, subscoreBenchmarkConfigs };
