import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ScoringRule } from './scoring/engine';

export interface MethodologyEvidenceItem {
  category: string;
  subscore: string;
  slug: string;
  name: string;
  displayOrder: number;
  measurementType: string;
  unit?: string;
  publicDescription?: string;
  internalInstructions?: string;
  resultFormat?: string;
  scoringRule: ScoringRule;
}

type ExportEvidence = {
  slug: string;
  name: string;
  displayOrder: number;
  measurementType: string;
  unit?: string;
  publicDescription?: string;
  internalInstructions?: string;
  resultFormat?: string;
  scoringRule: ScoringRule;
};

type ExportSubscore = {
  slug: string;
  name: string;
  description?: string;
  evidence: ExportEvidence[];
};

type ExportCategory = {
  slug: string;
  name: string;
  subscores: ExportSubscore[];
};

type MethodologyExport = {
  categories: ExportCategory[];
};

let cachedExport: MethodologyExport | null = null;

function loadExport(): MethodologyExport {
  if (!cachedExport) {
    const path = resolve(process.cwd(), 'methodology-full-export.json');
    cachedExport = JSON.parse(readFileSync(path, 'utf8')) as MethodologyExport;
  }
  return cachedExport;
}

export function getSubscoreEvidenceList(
  categoryKey: string,
  subscoreSlug: string,
): MethodologyEvidenceItem[] {
  const data = loadExport();
  const category = data.categories.find((c) => c.slug === categoryKey);
  const subscore = category?.subscores.find((s) => s.slug === subscoreSlug);
  if (!subscore) return [];

  return [...subscore.evidence]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((evidence) => ({
      category: categoryKey,
      subscore: subscoreSlug,
      slug: evidence.slug,
      name: evidence.name,
      displayOrder: evidence.displayOrder,
      measurementType: evidence.measurementType,
      unit: evidence.unit,
      publicDescription: evidence.publicDescription,
      internalInstructions: evidence.internalInstructions,
      resultFormat: evidence.resultFormat,
      scoringRule: evidence.scoringRule,
    }));
}

export function getSubscoreDescription(categoryKey: string, subscoreSlug: string): string | undefined {
  const data = loadExport();
  return data.categories
    .find((c) => c.slug === categoryKey)
    ?.subscores.find((s) => s.slug === subscoreSlug)?.description;
}

export function findEvidenceBySlug(
  categoryKey: string,
  subscoreSlug: string,
  evidenceSlug: string,
): MethodologyEvidenceItem | undefined {
  return getSubscoreEvidenceList(categoryKey, subscoreSlug).find((item) => item.slug === evidenceSlug);
}

export function findEvidenceSlugByName(
  categoryKey: string,
  subscoreSlug: string,
  name: string,
): string | undefined {
  const match = getSubscoreEvidenceList(categoryKey, subscoreSlug).find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.slug;
}
