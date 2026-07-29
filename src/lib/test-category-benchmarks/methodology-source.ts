import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ScoringRule } from '../scoring/engine';

export interface MethodologyEvidenceDefinition {
  category: string;
  subscore: string;
  slug: string;
  name: string;
  measurementType: string;
  unit?: string;
  scoringRule: ScoringRule;
}

type ExportEvidence = {
  slug: string;
  name: string;
  measurementType: string;
  unit?: string;
  scoringRule: ScoringRule;
};

type ExportSubscore = {
  slug: string;
  name: string;
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

let cached: Map<string, MethodologyEvidenceDefinition> | null = null;

function loadExport(): MethodologyExport {
  const path = resolve(process.cwd(), 'methodology-full-export.json');
  return JSON.parse(readFileSync(path, 'utf8')) as MethodologyExport;
}

function buildRegistry(): Map<string, MethodologyEvidenceDefinition> {
  const map = new Map<string, MethodologyEvidenceDefinition>();
  const data = loadExport();

  for (const category of data.categories) {
    for (const subscore of category.subscores) {
      for (const evidence of subscore.evidence) {
        map.set(`${category.slug}:${evidence.slug}`, {
          category: category.slug,
          subscore: subscore.slug,
          slug: evidence.slug,
          name: evidence.name,
          measurementType: evidence.measurementType,
          unit: evidence.unit,
          scoringRule: evidence.scoringRule,
        });
      }
    }
  }

  return map;
}

function registry(): Map<string, MethodologyEvidenceDefinition> {
  if (!cached) cached = buildRegistry();
  return cached;
}

export function getMethodologyEvidenceDefinition(
  category: string,
  slug: string,
): MethodologyEvidenceDefinition | undefined {
  return registry().get(`${category}:${slug}`);
}

export function getMethodologySubscoreEvidenceCount(category: string, subscore: string): number {
  const data = loadExport();
  const cat = data.categories.find((c) => c.slug === category);
  const sub = cat?.subscores.find((s) => s.slug === subscore);
  return sub?.evidence.length ?? 0;
}
