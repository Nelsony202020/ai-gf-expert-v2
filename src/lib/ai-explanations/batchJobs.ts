import { runConcurrent } from '../concurrency';
import { generateExplanation } from './generate';
import type { AdminIdentity } from '../db/auth';
import type { BatchGenerateRequest } from './schema';
import { listExplanationStatuses } from './listGroups';
import { aiExplanationsConfig } from './config';

export interface BatchJobState {
  id: string;
  productId: string;
  total: number;
  done: number;
  current?: string;
  errors: Array<{ groupKey: string; error: string }>;
  cancelled: boolean;
  finished: boolean;
}

const jobs = new Map<string, BatchJobState>();

function newJobId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getBatchJob(jobId: string): BatchJobState | undefined {
  return jobs.get(jobId);
}

export async function startBatchGeneration(
  productId: string,
  identity: AdminIdentity,
  body: BatchGenerateRequest,
): Promise<BatchJobState> {
  const rows = await listExplanationStatuses(productId);
  let targets = rows.filter((r) => r.hasUsableResults);

  if (body.scope === 'missing') {
    targets = targets.filter((r) =>
      ['not_generated', 'error'].includes(r.explanationStatus),
    );
  } else if (body.scope === 'outdated') {
    targets = targets.filter((r) => r.explanationStatus === 'outdated');
  } else if (body.scope === 'category') {
    if (!body.categorySlug) throw new Error('categorySlug is required for category scope');
    targets = targets.filter(
      (r) =>
        r.categorySlug === body.categorySlug &&
        (r.explanationStatus === 'not_generated' ||
          r.explanationStatus === 'error' ||
          r.explanationStatus === 'outdated'),
    );
  } else if (body.scope === 'groups') {
    const keys = new Set(body.groupKeys ?? []);
    targets = targets.filter((r) => keys.has(r.groupKey));
  }

  const job: BatchJobState = {
    id: newJobId(),
    productId,
    total: targets.length,
    done: 0,
    errors: [],
    cancelled: false,
    finished: false,
  };
  jobs.set(job.id, job);

  void runBatchJob(job, targets.map((t) => t.groupKey), identity);
  return job;
}

async function runBatchJob(
  job: BatchJobState,
  groupKeys: string[],
  identity: AdminIdentity,
) {
  const cfg = aiExplanationsConfig();
  const concurrency = cfg.concurrency;

  await runConcurrent(groupKeys, concurrency, async (groupKey) => {
    if (job.cancelled) return;
    job.current = groupKey;
    try {
      await generateExplanation(job.productId, groupKey, identity, {
        regenerate: true,
        skipRateLimit: true,
      });
    } catch (e) {
      job.errors.push({
        groupKey,
        error: e instanceof Error ? e.message : 'Generation failed',
      });
    } finally {
      job.done += 1;
    }
  });

  job.current = undefined;
  job.finished = true;
}

export function cancelBatchJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.finished) return false;
  job.cancelled = true;
  return true;
}
