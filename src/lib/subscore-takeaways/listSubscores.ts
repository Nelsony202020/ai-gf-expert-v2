import { loadExplanationProductBundle } from '../ai-explanations/assembleContext';
import { assembleSubscoreTakeawayFromBundle } from './assembleContext';
import { findTakeawayInMap, loadTakeawayRowsByKey } from './db';
import { listAllSubscores } from './subscores';
import type {
  TakeawayListRowDto,
  TakeawayRowDto,
  TakeawayStatus,
  TakeawaySummaryDto,
} from './types';

export function deriveTakeawayStatus(
  row: any,
  resultsChanged: boolean,
  hasUsableScores: boolean,
): TakeawayStatus {
  if (!hasUsableScores) return 'not_generated';
  const hasText = Boolean(row?.keyTakeaway?.trim());
  if (!row && !hasText) return 'not_generated';
  if (row?.takeawayStatus === 'error') return 'error';
  if (resultsChanged && row?.takeawayStatus === 'approved') return 'outdated';
  if (resultsChanged && hasText && row?.takeawayStatus !== 'approved') {
    return row?.takeawayStatus === 'needs_review' ? 'needs_review' : 'outdated';
  }
  return (row?.takeawayStatus as TakeawayStatus) ?? (hasText ? 'needs_review' : 'not_generated');
}

function toListRow(
  subscore: ReturnType<typeof listAllSubscores>[number],
  context: ReturnType<typeof assembleSubscoreTakeawayFromBundle>,
  row: any | undefined,
  status: TakeawayStatus,
  resultsChanged: boolean,
): TakeawayListRowDto {
  return {
    id: row?.id,
    subscoreKey: subscore.subscoreKey,
    categorySlug: subscore.categorySlug,
    subscoreSlug: subscore.subscoreSlug,
    categoryName: subscore.categoryName,
    subscoreName: subscore.subscoreName,
    keyTakeaway: row?.keyTakeaway ?? undefined,
    takeawayStatus: status,
    approvedAt: row?.approvedAt ?? undefined,
    approvedBy: row?.approvedBy ?? undefined,
    finalScore: context.finalScore,
    resultsChanged,
    hasUsableScores: context.hasUsableScores,
  };
}

function toFullRow(
  subscore: ReturnType<typeof listAllSubscores>[number],
  context: ReturnType<typeof assembleSubscoreTakeawayFromBundle>,
  row: any | undefined,
  status: TakeawayStatus,
  resultsChanged: boolean,
): TakeawayRowDto {
  return {
    ...toListRow(subscore, context, row, status, resultsChanged),
    inputHash: row?.inputHash ?? undefined,
    reviewerNote: row?.reviewerNote ?? undefined,
    generationError: row?.generationError ?? undefined,
    generatedAt: row?.generatedAt ?? undefined,
    generatedBy: row?.generatedBy ?? undefined,
    breakdown: context.breakdown,
  };
}

export async function loadAssemblyInputs(productId: string) {
  const [bundle, byKey] = await Promise.all([
    loadExplanationProductBundle(productId),
    loadTakeawayRowsByKey(productId),
  ]);
  return { bundle, byKey };
}

function buildSummary(rows: TakeawayListRowDto[]): TakeawaySummaryDto {
  const summary: TakeawaySummaryDto = {
    total: rows.length,
    notGenerated: 0,
    draft: 0,
    needsReview: 0,
    approved: 0,
    outdated: 0,
    error: 0,
  };
  for (const r of rows) {
    switch (r.takeawayStatus) {
      case 'not_generated':
        summary.notGenerated += 1;
        break;
      case 'draft':
        summary.draft += 1;
        break;
      case 'needs_review':
        summary.needsReview += 1;
        break;
      case 'approved':
        summary.approved += 1;
        break;
      case 'outdated':
        summary.outdated += 1;
        break;
      case 'error':
        summary.error += 1;
        break;
    }
  }
  return summary;
}

export async function listProductTakeawaysSlim(productId: string) {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const rows: TakeawayListRowDto[] = [];

  for (const subscore of listAllSubscores()) {
    let context;
    try {
      context = assembleSubscoreTakeawayFromBundle(bundle, subscore.subscoreKey);
    } catch {
      continue;
    }
    const row = byKey.get(subscore.subscoreKey);
    const resultsChanged = Boolean(row?.inputHash && row.inputHash !== context.inputHash);
    const status = deriveTakeawayStatus(row, resultsChanged, context.hasUsableScores);
    rows.push(toListRow(subscore, context, row, status, resultsChanged));
  }

  return { summary: buildSummary(rows), rows };
}

export async function getProductTakeawayDetail(productId: string, subscoreKey: string) {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const subscore = listAllSubscores().find((s) => s.subscoreKey === subscoreKey);
  if (!subscore) throw new Error(`Unknown subscore: ${subscoreKey}`);

  const context = assembleSubscoreTakeawayFromBundle(bundle, subscoreKey);
  const row = findTakeawayInMap(byKey, subscoreKey);
  const resultsChanged = Boolean(row?.inputHash && row.inputHash !== context.inputHash);
  const status = deriveTakeawayStatus(row, resultsChanged, context.hasUsableScores);
  return toFullRow(subscore, context, row, status, resultsChanged);
}
