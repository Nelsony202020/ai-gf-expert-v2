import type { ScoringRule } from '../scoring/engine';
import { getMethodologyEvidenceDefinition } from './methodology-source';

export interface EvidenceScoringDefinition {
  category: string;
  subscore: string;
  slug: string;
  name: string;
  measurementType: string;
  unit?: string;
  scoringRule: ScoringRule;
}

export function getEvidenceScoringDefinition(
  category: string,
  slug: string,
): EvidenceScoringDefinition | undefined {
  return getMethodologyEvidenceDefinition(category, slug);
}
