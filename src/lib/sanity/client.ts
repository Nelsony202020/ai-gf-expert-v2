// Minimal Sanity client: GROQ over the HTTP API, no SDK dependency.
// Guides are the only Sanity content; everything else lives in InstantDB.

import { env } from '../env';

const API_VERSION = '2025-02-19';

export function isSanityConfigured(): boolean {
  return Boolean(env('PUBLIC_SANITY_PROJECT_ID'));
}

interface QueryOptions {
  /** Include draft documents (requires SANITY_API_READ_TOKEN). */
  drafts?: boolean;
}

export async function sanityQuery<T>(
  groq: string,
  params: Record<string, string> = {},
  options: QueryOptions = {},
): Promise<T> {
  const projectId = env('PUBLIC_SANITY_PROJECT_ID');
  const dataset = env('PUBLIC_SANITY_DATASET') ?? 'production';
  if (!projectId) throw new Error('Sanity is not configured (PUBLIC_SANITY_PROJECT_ID missing).');

  const url = new URL(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`);
  url.searchParams.set('query', groq);
  url.searchParams.set('perspective', options.drafts ? 'previewDrafts' : 'published');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  const headers: Record<string, string> = {};
  const token = env('SANITY_API_READ_TOKEN');
  if (options.drafts) {
    if (!token) throw new Error('Draft preview requires SANITY_API_READ_TOKEN.');
    headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    // Token also grants access to private datasets for published reads.
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Sanity query failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { result: T };
  return data.result;
}
