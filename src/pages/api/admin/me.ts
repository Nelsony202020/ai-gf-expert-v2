export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { requireIdentity, permissionsForRole } from '../../../lib/db/auth';

export const GET: APIRoute = handler(async ({ request }) => {
  const identity = await requireIdentity(request);
  return json({
    ...identity,
    permissions: permissionsForRole(identity.role),
  });
});
