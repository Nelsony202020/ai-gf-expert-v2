export type BenchmarkTierKind = 'good' | 'typical' | 'weak' | 'caution' | 'poor';

export type BenchmarkFooterKind = 'live' | 'testing';

export interface BenchmarkTierLabels {
  good: string;
  typical: string;
  weak: string;
}

export interface BenchmarkEvidenceRef {
  category: string;
  slug: string;
  goodMinScore?: number;
  typicalMinScore?: number;
}

export interface BenchmarkCompositeRef {
  kind: 'ynl-pass-count';
  category: string;
  slugs: string[];
}

export interface BenchmarkSubscoreCountRef {
  kind: 'subscore-control-count';
  category: string;
  subscore: string;
}

export interface BenchmarkMainRowConfig {
  label: string;
  good: string;
  typical: string;
  weak: string;
  /** When set, display values are derived from the active methodology scoring rule. */
  evidenceRef?: BenchmarkEvidenceRef;
  compositeRef?: BenchmarkCompositeRef;
  subscoreCountRef?: BenchmarkSubscoreCountRef;
}

export interface BenchmarkMinimumConfig {
  label: string;
  value: string;
  evidenceRef?: BenchmarkEvidenceRef;
}

export interface CategoryBenchmarkPanelConfig {
  categoryKey: string;
  title: string;
  intro: string;
  mainSectionTitle: string;
  minimumSectionTitle?: string;
  tierLabels: BenchmarkTierLabels;
  /** privacy uses caution/poor column classes instead of typical/weak */
  tierVariant?: 'standard' | 'privacy';
  mainRows: BenchmarkMainRowConfig[];
  minimums: BenchmarkMinimumConfig[];
  redFlags: string[];
  footer: BenchmarkFooterKind;
  /** Pricing market rows use live DB stats when available. */
  marketData?: boolean;
}

export interface ResolvedBenchmarkMainRow {
  label: string;
  good: string;
  typical: string;
  weak: string;
  resolvedFromScoring: boolean;
}

export interface ResolvedBenchmarkPanel {
  categoryKey: string;
  title: string;
  intro: string;
  mainSectionTitle: string;
  minimumSectionTitle?: string;
  tierLabels: BenchmarkTierLabels;
  tierVariant: 'standard' | 'privacy';
  mainRows: ResolvedBenchmarkMainRow[];
  minimums: BenchmarkMinimumConfig[];
  redFlags: string[];
  footerText: string;
  footerIcon: 'sync' | 'update';
}
