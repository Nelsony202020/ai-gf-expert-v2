export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import {
  generatePricingFieldCopy,
  pricingWriteRequestSchema,
} from '../../../../lib/ai-pricing-copy/generateField';

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'content.edit');
  const body = pricingWriteRequestSchema.parse(await readJson(request));
  const result = await generatePricingFieldCopy(body, identity);
  return json(result);
});
