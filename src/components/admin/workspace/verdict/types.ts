export interface CategoryVerdict {
  headline?: string;
  verdict?: string;
  mainStrength?: string;
  mainWeakness?: string;
  pros?: string[];
  cons?: string[];
  expertOpinion?: string;
  evidenceRefs?: string[];
}

export interface Award {
  kind: string;
  customLabel?: string;
  active?: boolean;
  startAt?: number;
  endAt?: number;
  reason?: string;
}

export type VerdictStepId = 'overall' | 'decision' | 'pros-cons' | 'expert' | 'categories';

export interface VerdictStepDef {
  id: VerdictStepId;
  label: string;
  navLabel: string;
}

export interface ScoreTreePreview {
  overall: number | null;
  categories: {
    slug: string;
    name: string;
    score: number | null;
    subscores: {
      evidence: {
        required: boolean;
        status: string;
      }[];
    }[];
  }[];
}
