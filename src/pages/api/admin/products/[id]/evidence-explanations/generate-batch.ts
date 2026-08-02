export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../../../lib/api';
import { requirePermission } from '../../../../../../lib/db/auth';
import { batchGenerateRequestSchema } from '../../../../../../lib/ai-explanations/schema';
import { startBatchGeneration } from '../../../../../../lib/ai-explanations/batchJobs';

export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const body = batchGenerateRequestSchema.parse(await readJson(request));
  const job = await startBatchGeneration(String(params.id), identity, body);
  return json({ job });
});
