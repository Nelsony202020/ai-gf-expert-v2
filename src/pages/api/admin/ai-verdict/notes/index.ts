export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../../../../lib/api';
import { requirePermission } from '../../../../../lib/db/auth';
import { generateAiVerdictNotes, loadAiVerdictNotes } from '../../../../../lib/ai-verdict/generateNotes';
import {
  generateNotesRequestSchema,
  loadNotesRequestSchema,
} from '../../../../../lib/ai-verdict/notesSchema';

export const GET: APIRoute = handler(async ({ request }) => {
  await requirePermission(request, 'content.view');
  const url = new URL(request.url);
  const body = loadNotesRequestSchema.parse({
    productId: url.searchParams.get('productId'),
    testRunId: url.searchParams.get('testRunId'),
    sectionKey: url.searchParams.get('sectionKey'),
  });
  const result = await loadAiVerdictNotes(body);
  return json(result);
});

export const POST: APIRoute = handler(async ({ request }) => {
  const identity = await requirePermission(request, 'content.edit');
  const body = generateNotesRequestSchema.parse(await readJson(request));
  const notes = await generateAiVerdictNotes(body, identity);
  return json({ notes });
});
