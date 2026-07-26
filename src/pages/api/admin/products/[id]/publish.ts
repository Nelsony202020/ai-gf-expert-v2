export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../lib/api';
import { requirePermission } from '../../../../../lib/db/auth';
import {
  validateProductForPublish,
  publishProduct,
  unpublishProduct,
} from '../../../../../lib/db/publish';

/** GET = dry-run validation; POST = publish; DELETE = unpublish. */
export const GET: APIRoute = handler(async ({ request, params }) => {
  await requirePermission(request, 'content.view');
  const validation = await validateProductForPublish(params.id!);
  return json(validation);
});

export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'content.publish');
  const result = await publishProduct(params.id!, identity);
  return json(result);
});

export const DELETE: APIRoute = handler(async ({ request, params, url }) => {
  const identity = await requirePermission(request, 'content.publish');
  await unpublishProduct(params.id!, identity, url.searchParams.get('reason') ?? undefined);
  return json({ ok: true });
});
