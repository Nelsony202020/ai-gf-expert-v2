export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../../../lib/api';
import { requirePermission } from '../../../../../../../lib/db/auth';
import { cancelBatchJob, getBatchJob } from '../../../../../../../lib/ai-explanations/batchJobs';

export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const job = getBatchJob(String(params.jobId));
  if (!job || job.productId !== params.id) {
    return json({ error: 'Job not found' }, { status: 404 });
  }
  return json({ job });
});

export const DELETE: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'testing.edit');
  const ok = cancelBatchJob(String(params.jobId));
  if (!ok) return json({ error: 'Job not found or already finished' }, { status: 404 });
  return json({ ok: true });
});
