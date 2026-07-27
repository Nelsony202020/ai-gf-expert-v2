export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json } from '../../../../../../lib/api';
import { requirePermission } from '../../../../../../lib/db/auth';
import { markSuggestionInserted } from '../../../../../../lib/ai-verdict/generate';
import { suggestionToProductPatch } from '../../../../../../lib/ai-verdict/suggestionSchema';

export const POST: APIRoute = handler(async ({ request, params }) => {
  const identity = await requirePermission(request, 'content.edit');
  const row = await markSuggestionInserted(params.id!, identity);
  const patch = suggestionToProductPatch(
    row.structuredOutput as any,
    row.categorySlug ?? undefined,
  );
  return json({ suggestion: row, patch });
});
