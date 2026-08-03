export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../lib/api';
import { requirePermission } from '../../../../lib/db/auth';
import { validateRedirect } from '../../../../lib/db/redirects';

export const POST: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'redirects.edit');
  const body = await readJson<{
    sourcePath: string;
    destinationPath: string;
    redirectType?: number;
    excludeId?: string;
  }>(request);
  const result = await validateRedirect(
    body.sourcePath,
    body.destinationPath,
    body.excludeId,
    body.redirectType ?? 301,
  );
  return json(result);
});
