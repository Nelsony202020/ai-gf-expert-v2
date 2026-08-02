import {
  assembleExplanationContextFromBundle,
  loadExplanationProductBundle,
} from './assembleContext';
import { loadExplanationRowsByKey } from './db';
import { listAllEvidenceGroups } from './groups';
import type {
  ExplanationListRowDto,
  ExplanationRowDto,
  ExplanationSummaryDto,
} from './types';

export function deriveExplanationStatus(
  row: any,
  resultsChanged: boolean,
  hasUsableResults: boolean,
): ExplanationRowDto['explanationStatus'] {
  if (!hasUsableResults) return 'not_generated';
  const hasText = Boolean(row?.whatThisMeans?.trim());
  if (!row && !hasText) return 'not_generated';
  if (row?.explanationStatus === 'error') return 'error';
  if (resultsChanged && row?.explanationStatus === 'approved') return 'outdated';
  if (resultsChanged && hasText && row?.explanationStatus !== 'approved') {
    return row?.explanationStatus === 'needs_review' ? 'needs_review' : 'outdated';
  }
  return (row?.explanationStatus as ExplanationRowDto['explanationStatus']) ?? (hasText ? 'needs_review' : 'not_generated');
}

function toListRow(
  group: ReturnType<typeof listAllEvidenceGroups>[number],
  context: ReturnType<typeof assembleExplanationContextFromBundle>,
  row: any | undefined,
  status: ExplanationRowDto['explanationStatus'],
  resultsChanged: boolean,
): ExplanationListRowDto {
  return {
    id: row?.id,
    groupKey: group.groupKey,
    categorySlug: group.categorySlug,
    subscoreSlug: group.subscoreSlug,
    groupSlug: group.groupSlug,
    groupName: group.groupName,
    categoryName: group.categoryName,
    subscoreName: group.subscoreName,
    whatThisMeans: row?.whatThisMeans ?? undefined,
    explanationStatus: status,
    approvedAt: row?.approvedAt ?? undefined,
    approvedBy: row?.approvedBy ?? undefined,
    score: context.score,
    resultsChanged,
    hasUsableResults: context.hasUsableResults,
  };
}

function toFullRow(
  group: ReturnType<typeof listAllEvidenceGroups>[number],
  context: ReturnType<typeof assembleExplanationContextFromBundle>,
  row: any | undefined,
  status: ExplanationRowDto['explanationStatus'],
  resultsChanged: boolean,
): ExplanationRowDto {
  return {
    ...toListRow(group, context, row, status, resultsChanged),
    inputHash: row?.inputHash ?? undefined,
    generatedFromMethodologyVersion: row?.generatedFromMethodologyVersion ?? undefined,
    reviewerNote: row?.reviewerNote ?? undefined,
    generationError: row?.generationError ?? undefined,
    generatedAt: row?.generatedAt ?? undefined,
    generatedBy: row?.generatedBy ?? undefined,
    methodology: context.methodology,
    results: context.results,
  };
}

async function loadAssemblyInputs(productId: string) {
  const [bundle, byKey] = await Promise.all([
    loadExplanationProductBundle(productId),
    loadExplanationRowsByKey(productId),
  ]);
  return { bundle, byKey };
}

/** Slim list for sidebar — no methodology/results per row. */
export async function listProductExplanationsSlim(productId: string): Promise<{
  summary: ExplanationSummaryDto;
  rows: ExplanationListRowDto[];
}> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);

  const rows: ExplanationListRowDto[] = [];
  const summary: ExplanationSummaryDto = {
    total: 0,
    notGenerated: 0,
    draft: 0,
    needsReview: 0,
    approved: 0,
    outdated: 0,
    error: 0,
  };

  for (const group of listAllEvidenceGroups()) {
    let context;
    try {
      context = assembleExplanationContextFromBundle(bundle, group.groupKey);
    } catch {
      continue;
    }
    if (!context.hasUsableResults) continue;

    summary.total += 1;
    const row = byKey.get(group.groupKey);
    const resultsChanged = Boolean(row?.inputHash && row.inputHash !== context.inputHash);
    const status = deriveExplanationStatus(row, resultsChanged, context.hasUsableResults);

    if (status === 'not_generated') summary.notGenerated += 1;
    if (status === 'draft') summary.draft += 1;
    if (status === 'needs_review') summary.needsReview += 1;
    if (status === 'approved') summary.approved += 1;
    if (status === 'outdated') summary.outdated += 1;
    if (status === 'error') summary.error += 1;

    rows.push(toListRow(group, context, row, status, resultsChanged));
  }

  return { summary, rows };
}

/** Full detail for one group (editor panel). */
export async function getProductExplanationDetail(
  productId: string,
  groupKey: string,
): Promise<ExplanationRowDto> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const group = listAllEvidenceGroups().find((g) => g.groupKey === groupKey);
  if (!group) throw new Error(`Unknown evidence group: ${groupKey}`);

  const context = assembleExplanationContextFromBundle(bundle, groupKey);
  const row = byKey.get(groupKey);
  const resultsChanged = Boolean(row?.inputHash && row.inputHash !== context.inputHash);
  const status = deriveExplanationStatus(row, resultsChanged, context.hasUsableResults);

  return toFullRow(group, context, row, status, resultsChanged);
}

/** @deprecated Use listProductExplanationsSlim + getProductExplanationDetail */
export async function listProductExplanations(productId: string): Promise<{
  summary: ExplanationSummaryDto;
  rows: ExplanationRowDto[];
}> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const rows: ExplanationRowDto[] = [];
  const summary: ExplanationSummaryDto = {
    total: 0,
    notGenerated: 0,
    draft: 0,
    needsReview: 0,
    approved: 0,
    outdated: 0,
    error: 0,
  };

  for (const group of listAllEvidenceGroups()) {
    let context;
    try {
      context = assembleExplanationContextFromBundle(bundle, group.groupKey);
    } catch {
      continue;
    }
    if (!context.hasUsableResults) continue;

    summary.total += 1;
    const row = byKey.get(group.groupKey);
    const resultsChanged = Boolean(row?.inputHash && row.inputHash !== context.inputHash);
    const status = deriveExplanationStatus(row, resultsChanged, context.hasUsableResults);

    if (status === 'not_generated') summary.notGenerated += 1;
    if (status === 'draft') summary.draft += 1;
    if (status === 'needs_review') summary.needsReview += 1;
    if (status === 'approved') summary.approved += 1;
    if (status === 'outdated') summary.outdated += 1;
    if (status === 'error') summary.error += 1;

    rows.push(toFullRow(group, context, row, status, resultsChanged));
  }

  return { summary, rows };
}

export async function getProductExplanation(
  productId: string,
  groupKey: string,
): Promise<ExplanationRowDto> {
  return getProductExplanationDetail(productId, groupKey);
}

/** Lightweight status list for batch targeting. */
export async function listExplanationStatuses(
  productId: string,
): Promise<Array<{ groupKey: string; categorySlug: string; explanationStatus: ExplanationRowDto['explanationStatus']; hasUsableResults: boolean; whatThisMeans?: string }>> {
  const { bundle, byKey } = await loadAssemblyInputs(productId);
  const out: Array<{
    groupKey: string;
    categorySlug: string;
    explanationStatus: ExplanationRowDto['explanationStatus'];
    hasUsableResults: boolean;
    whatThisMeans?: string;
  }> = [];

  for (const group of listAllEvidenceGroups()) {
    let context;
    try {
      context = assembleExplanationContextFromBundle(bundle, group.groupKey);
    } catch {
      continue;
    }
    if (!context.hasUsableResults) continue;
    const row = byKey.get(group.groupKey);
    const resultsChanged = Boolean(row?.inputHash && row.inputHash !== context.inputHash);
    out.push({
      groupKey: group.groupKey,
      categorySlug: group.categorySlug,
      explanationStatus: deriveExplanationStatus(row, resultsChanged, context.hasUsableResults),
      hasUsableResults: context.hasUsableResults,
      whatThisMeans: row?.whatThisMeans ?? undefined,
    });
  }
  return out;
}

export { loadAssemblyInputs };
