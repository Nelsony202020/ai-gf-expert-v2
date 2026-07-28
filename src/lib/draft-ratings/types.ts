import type { Product } from '../../data/products';

export type DraftDetailLevel = 'summary' | 'detailed' | 'full';

export type PublicEvidenceStatus =
  | 'verified'
  | 'not-offered'
  | 'not-applicable'
  | 'not-tested'
  | 'could-not-verify'
  | 'test-failed'
  | 'missing';

export interface DraftCoverageItem {
  label: string;
  summary: string;
  /** Optional expanded detail (e.g. image test breakdown). */
  detail?: string;
  /** Show a verified checkmark (Pricing, Privacy). */
  verified?: boolean;
}

export interface DraftTestingOverview {
  productName: string;
  trustStatement: string;
  completedEvidence: number;
  totalRequiredEvidence: number;
  testGroupsCompleted: number;
  testGroupCount: number;
  proofAttachments: number;
  lastTested: string;
  coverage: DraftCoverageItem[];
  metadataParts: string[];
  methodologyVersion: string;
  testRunStatus: string;
  testRunId?: string;
}

export interface DraftMeasurement {
  slug: string;
  label: string;
  value: string;
  status: PublicEvidenceStatus;
  sampleSize?: number;
  normalizedScore?: number | null;
  /** Plain-English interpretation for drawer tables. */
  interpretation?: string;
  /** good / fair / poor for colored interpretation labels. */
  interpretationTone?: 'good' | 'fair' | 'poor' | 'neutral';
}

export interface DraftEvidenceCalculationRow {
  label: string;
  measuredValue: string;
  internalScore: number | null;
  weight: number | null;
  contribution: number | null;
}

export interface DraftEvidenceCalculation {
  intro: string;
  method: 'average' | 'weighted' | 'single' | 'manual';
  rows: DraftEvidenceCalculationRow[];
  formulaParts: string[];
  formulaTotal: number | null;
  finalScore: number | null;
  summary?: string;
}

export interface DraftTechnicalAuditItem {
  slug: string;
  evidenceId?: string;
  rawValue: string;
  internalScore?: number | null;
}

export interface DraftProofItem {
  id: string;
  thumbUrl: string;
  fullUrl?: string;
  caption?: string;
  alt?: string;
  kind: 'image' | 'video';
  posterUrl?: string;
}

export interface DraftTestGroupDrawerSections {
  mainResult?: string;
  whatWeTested?: string;
  whyItMatters?: string;
  howWeTested?: string;
  whatWeFound?: string;
  scoreCalculation?: string;
  technicalDetails?: string;
}

export interface DraftTestGroup {
  id: string;
  anchor: string;
  title: string;
  description?: string;
  categorySlug: string;
  categoryName: string;
  subscoreSlug: string;
  subscoreName: string;
  /** Parent area score for score-summary on test cards. */
  subscoreScore: number | null;
  measurementCount: number;
  proofCount: number;
  resultSummary?: string;
  howWeTested?: string;
  whyItMatters?: string;
  measurements: DraftMeasurement[];
  selectedProof: DraftProofItem[];
  status: 'complete' | 'partial' | 'empty';
  /** Public-facing one-line name (may match title). */
  publicName: string;
  /** One-sentence plain-English explanation of the test. */
  publicDescription?: string;
  /** Headline result shown on cards and drawer. */
  mainResult?: string;
  /** Plain-English takeaway for the test card. */
  whatThisMeans?: string;
  /** Verified checks recorded for this test. */
  checkCount: number;
  /** Public proof label, e.g. "1 screenshot". */
  proofLabel: string;
  sampleSize?: number;
  whatWeTested?: string;
  whatWeFound?: string;
  drawerSections: DraftTestGroupDrawerSections;
}

export interface DraftKeyFinding {
  slug: string;
  label: string;
  value: string;
  status: PublicEvidenceStatus;
}

export interface DraftEvidenceCategory {
  slug: string;
  name: string;
  score: number | null;
  /** Short public summary for the category row. */
  summary: string;
  /** One-line meaning shown on the card. */
  meaning?: string;
  /** Compact key numbers for the card (2–4 items). */
  cardTeaser?: string;
  /** What this evidence category measures. */
  scopeDescription?: string;
  /** Raw test results — values only on the main page. */
  /** Editorial bonus-feature rows (platform-extras-list). */
  bonusExtras?: Array<{ name: string; note?: string }>;
  testResults: DraftMeasurement[];
  /** Drawer panel id. */
  drawerId: string;
  /** Primary test session for proof linkage. */
  testGroupId?: string;
  proofCount: number;
  proofLabel: string;
  selectedProof: DraftProofItem[];
  whyItMatters?: string;
  whatWeTested?: string;
  scoreCalculation?: string;
  technicalDetails?: string;
  mainResult?: string;
  /** Editorial interpretation for the drawer — not shown in the main table. */
  whatWeFound?: string;
  /** Plain-English “what this means for you” copy in the drawer. */
  whatThisMeans?: string;
  /** Caveats about scope and timing. */
  limitations?: string;
  /** Plain-language testing method shown in the drawer. */
  howWeTested?: string;
  /** Hierarchy breadcrumb, e.g. Characters → Variety → Amount */
  breadcrumb?: string;
  categorySlug?: string;
  subscoreSlug?: string;
  categoryName?: string;
  subscoreName?: string;
  /** One-line conclusion beside the score header. */
  headlineConclusion?: string;
  /** Structured score calculation for the audit layer. */
  calculation?: DraftEvidenceCalculation;
  /** Link to full methodology for this evidence category. */
  methodologyUrl?: string;
  /** Compact metadata chips for how-we-tested row. */
  testMetadata?: string;
  /** Trust badges with icons for how-we-tested. */
  trustBadges?: Array<{ icon: string; label: string }>;
  /** Technical audit rows — shown only in All In detail level. */
  technicalAudit?: DraftTechnicalAuditItem[];
  /** Previous evidence category drawer in the same subscore (for footer nav). */
  prevDrawerId?: string;
  /** Next evidence category drawer in the same subscore (for footer nav). */
  nextDrawerId?: string;
}

export interface DraftSubscore {
  slug: string;
  name: string;
  score: number | null;
  finding?: string;
  /** Plain-English explanation for the selected subscore panel. */
  explanation?: string;
  /** One-line description of what this area measures. */
  scopeDescription?: string;
  /** Public proof label across this area's tests. */
  proofLabel: string;
  /** Evidence categories that compose this subscore. */
  evidenceCategories: DraftEvidenceCategory[];
  keyMeasurements: DraftMeasurement[];
  testGroups: DraftTestGroup[];
  sampleSize?: number;
  howWeTested?: string;
  /** Number of test groups for this subscore. */
  testCount: number;
  /** Verified measurement results recorded for this subscore. */
  recordedResultCount: number;
  /** Proof file attachments across this subscore's tests. */
  proofCount: number;
}

export interface DraftCategory {
  slug: string;
  name: string;
  score: number | null;
  weight: number;
  /** Category-level verdict summary. */
  categoryVerdict?: string;
  primaryStrength?: string;
  primaryLimitation?: string;
  /** @deprecated Use keyFindings */
  keyStats: DraftMeasurement[];
  /** 4–6 decision-relevant metrics for the category header. */
  keyFindings: DraftKeyFinding[];
  subscores: DraftSubscore[];
  testGroupCount: number;
  measurementCount: number;
  proofCount: number;
  /** Public label: number of tests run in this category. */
  publicTestCount: number;
  /** Public label: recorded measurement results. */
  recordedResultCount: number;
  /** Public label: proof file attachments. */
  proofFileCount: number;
  anchor: string;
}

export interface DraftRatingsViewModel {
  product: Product;
  overview: DraftTestingOverview;
  categories: DraftCategory[];
  detailLevelDefault: DraftDetailLevel;
  experimental: boolean;
}

export interface DraftRatingsDbContext {
  methodologyVersion?: string;
  paidAccountTested?: boolean;
  lastTestedAt?: number;
  testRun?: {
    id: string;
    name?: string;
    status?: string;
    startedAt?: number;
    publishedAt?: number;
    isCurrentPublished?: boolean;
  } | null;
  evidenceResults: Array<{
    id: string;
    slug: string;
    name: string;
    categorySlug?: string;
    subscoreSlug?: string;
    publicResult?: string | null;
    rawValue?: unknown;
    normalizedScore?: number | null;
    required?: boolean;
    notApplicable?: boolean;
    isUnknown?: boolean;
    unableToVerify?: boolean;
    verificationStatus?: string | null;
    proofCount: number;
    proof: DraftProofItem[];
  }>;
  subscoresByCategory: Map<string, Array<{ slug: string; name: string; displayOrder: number }>>;
}
