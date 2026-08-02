export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../../../lib/api';
import { requirePermission } from '../../../../../../lib/db/auth';
import { getProductExplanationDetail } from '../../../../../../lib/ai-explanations/listGroups';
import {
  approveExplanation,
  discardExplanationReview,
  generateExplanation,
  saveExplanation,
} from '../../../../../../lib/ai-explanations/generate';
import {
  generateExplanationRequestSchema,
  saveExplanationRequestSchema,
} from '../../../../../../lib/ai-explanations/schema';

function groupKeyFromParams(params: Record<string, string | undefined>): string {
  const raw = params.groupKey;
  if (!raw) throw new Error('groupKey is required');
  return raw.includes('/') ? raw : raw.replace(/,/g, '/');
}

export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const groupKey = groupKeyFromParams(params);
  const row = await getProductExplanationDetail(String(params.id), groupKey);
  return json({ row });
});

export const PATCH: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const groupKey = groupKeyFromParams(params);
  const body = saveExplanationRequestSchema.parse(await readJson(request));
  const row = await saveExplanation(String(params.id), groupKey, identity, body);
  return json({ row });
});

export const POST: APIRoute = handler(async ({ request, params, url }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const groupKey = groupKeyFromParams(params);
  const action = url.searchParams.get('action');

  if (action === 'approve') {
    let body: { whatThisMeans?: string; reviewerNote?: string } = {};
    try {
      body = saveExplanationRequestSchema.parse(await readJson(request));
    } catch {
      body = {};
    }
    const result = await approveExplanation(String(params.id), groupKey, identity, body);
    return json(result);
  }

  if (action === 'discard') {
    const result = await discardExplanationReview(String(params.id), groupKey, identity);
    return json(result);
  }

  let body: { regenerate?: boolean; reviewerNote?: string } = {};
  try {
    body = generateExplanationRequestSchema.parse(await readJson(request));
  } catch {
    body = {};
  }
  const row = await generateExplanation(String(params.id), groupKey, identity, body);
  return json({ row });
});
