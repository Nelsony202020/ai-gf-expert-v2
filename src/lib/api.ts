// Helpers for Astro API routes: JSON responses + consistent error handling.

import type { APIRoute } from 'astro';
import { HttpError } from './db/auth';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function publicApiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Internal error';
  const message = error.message;
  const cause =
    error.cause instanceof Error
      ? error.cause.message
      : typeof error.cause === 'object' && error.cause && 'code' in error.cause
        ? String((error.cause as { code?: string }).code ?? '')
        : '';
  const blob = `${message} ${cause}`;
  if (/UND_ERR_HEADERS_TIMEOUT|Headers Timeout|timed out|TimeoutError|AbortError/i.test(blob)) {
    return 'Upload timed out talking to file storage. Try again — or skip the photo and add it later.';
  }
  if (/fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|GOAWAY/i.test(blob)) {
    return 'Could not reach the database or file storage. Check your connection and try again.';
  }
  return message || 'Internal error';
}

/** Wrap a handler so thrown HttpErrors become clean JSON error responses. */
export function handler(fn: APIRoute): APIRoute {
  return async (ctx) => {
    try {
      return await fn(ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message }, error.status);
      }
      console.error('[api]', error);
      return json({ error: publicApiErrorMessage(error) }, 500);
    }
  };
}

export async function readJson<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON body');
  }
}
