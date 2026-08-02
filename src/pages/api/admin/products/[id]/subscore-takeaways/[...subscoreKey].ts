export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../../../lib/api';
import { requirePermission } from '../../../../../../lib/db/auth';
import { getProductTakeawayDetail } from '../../../../../../lib/subscore-takeaways/listSubscores';
import {
  approveTakeaway,
  discardTakeawayReview,
  generateSubscoreTakeaway,
} from '../../../../../../lib/subscore-takeaways/generate';
import { saveTakeawayRequestSchema, generateTakeawayRequestSchema } from '../../../../../../lib/subscore-takeaways/schema';

function subscoreKeyFromParams(params: Record<string, string | undefined>): string {
  const raw = params.subscoreKey;
  if (!raw) throw new Error('subscoreKey is required');
  return raw.includes('/') ? raw : raw.replace(/,/g, '/');
}

export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const subscoreKey = subscoreKeyFromParams(params);
  const row = await getProductTakeawayDetail(String(params.id), subscoreKey);
  return json({ row });
});

export const POST: APIRoute = handler(async ({ request, params, url }) => {
  const identity = await requirePermission(request, 'testing.edit');
  const subscoreKey = subscoreKeyFromParams(params);
  const action = url.searchParams.get('action');

  if (action === 'approve') {
    let body: { keyTakeaway?: string; reviewerNote?: string } = {};
    try {
      body = saveTakeawayRequestSchema.parse(await readJson(request));
    } catch {
      body = {};
    }
    const result = await approveTakeaway(String(params.id), subscoreKey, identity, body);
    return json(result);
  }

  if (action === 'discard') {
    const result = await discardTakeawayReview(String(params.id), subscoreKey, identity);
    return json(result);
  }

  let body: { regenerate?: boolean; reviewerNote?: string } = {};
  try {
    body = generateTakeawayRequestSchema.parse(await readJson(request));
  } catch {
    body = {};
  }
  const row = await generateSubscoreTakeaway(String(params.id), subscoreKey, identity, body);
  return json({ row });
});
