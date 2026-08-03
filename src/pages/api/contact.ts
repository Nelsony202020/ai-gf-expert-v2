export const prerender = false;

import type { APIRoute } from 'astro';
import { handler, json, readJson } from '../../lib/api';
import { HttpError } from '../../lib/db/auth';
import { sendContactEmail, type ContactEmailPayload } from '../../lib/contact/sendContactEmail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value: unknown, maxLen: number): string {
  return String(value ?? '').trim().slice(0, maxLen);
}

function parsePayload(body: Record<string, unknown>): ContactEmailPayload {
  const kind = body.kind === 'feedback' ? 'feedback' : body.kind === 'contact' ? 'contact' : null;
  if (!kind) throw new HttpError(400, 'Invalid kind');

  if (kind === 'contact') {
    const name = cleanString(body.name, 120);
    const email = cleanString(body.email, 200);
    const subject = cleanString(body.subject, 120);
    const message = cleanString(body.message, 5000);
    if (!name || !email || !subject || !message) throw new HttpError(400, 'Missing required fields');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Invalid email');
    return { kind, name, email, subject, message };
  }

  const category = cleanString(body.category, 80);
  const email = cleanString(body.email, 200);
  const message = cleanString(body.message, 500);
  const pageUrl = cleanString(body.pageUrl, 500);
  const pageTitle = cleanString(body.pageTitle, 300);
  if (!category || !email || !message) throw new HttpError(400, 'Missing required fields');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Invalid email');
  return { kind, category, email, message, pageUrl, pageTitle };
}

export const POST: APIRoute = handler(async ({ request }) => {
  if (request.method !== 'POST') throw new HttpError(405, 'Method not allowed');

  const body = await readJson<Record<string, unknown>>(request);
  const payload = parsePayload(body);
  await sendContactEmail(payload);
  return json({ ok: true });
});
