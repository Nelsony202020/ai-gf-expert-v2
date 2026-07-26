// Helpers for Astro API routes: JSON responses + consistent error handling.

import type { APIRoute } from 'astro';
import { HttpError } from './db/auth';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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
      const message = error instanceof Error ? error.message : 'Internal error';
      return json({ error: message }, 500);
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
