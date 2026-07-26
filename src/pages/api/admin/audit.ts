export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../lib/api';
import { requirePermission } from '../../../lib/db/auth';
import { getDb } from '../../../lib/db/server';

export const GET: APIRoute = handler(async ({ request, url }) => {
  await requirePermission(request, 'audit.view');
  const db = getDb();
  const recordType = url.searchParams.get('recordType') ?? undefined;
  const recordId = url.searchParams.get('recordId') ?? undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 1000);

  const where: Record<string, unknown> = {};
  if (recordType) where.recordType = recordType;
  if (recordId) where.recordId = recordId;

  const { auditLog } = await (db.query as any)({
    auditLog: {
      $: {
        ...(Object.keys(where).length ? { where } : {}),
        order: { createdAt: 'desc' as const },
        limit,
      },
    },
  });

  return json({ rows: auditLog });
});
