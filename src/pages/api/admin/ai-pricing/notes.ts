export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { generatePricingAiNotes, loadPricingAiNotes } from '../../../../lib/ai-pricing-copy/generateNotes';

const bodySchema = z.object({
  productId: z.string().min(1),
  regenerate: z.boolean().optional(),
});

export const GET: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'content.view');
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');
  if (!productId) return json({ error: 'productId required' }, 400);
  const result = await loadPricingAiNotes(productId);
  return json(result);
});

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'content.edit');
  const body = bodySchema.parse(await readJson(request));
  const notes = await generatePricingAiNotes(body.productId, identity, {
    regenerate: body.regenerate,
  });
  return json({ notes });
});
