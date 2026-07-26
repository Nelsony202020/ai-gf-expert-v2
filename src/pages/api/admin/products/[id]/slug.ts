export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../../lib/api';
import { requirePermission, HttpError } from '../../../../../lib/db/auth';
import { changeProductSlug } from '../../../../../lib/db/publish';
import { slugSchema } from '../../../../../lib/validation/schemas';

export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'content.edit');
  const body = await readJson<{ slug: string; createRedirect?: boolean }>(request);
  const parsed = slugSchema.safeParse(body.slug);
  if (!parsed.success) throw new HttpError(400, 'Invalid slug');
  const result = await changeProductSlug(
    params.id!,
    parsed.data,
    body.createRedirect ?? true,
    identity,
  );
  return json(result);
});
