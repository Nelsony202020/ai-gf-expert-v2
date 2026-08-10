import { env } from '../env';

const AHREFS_BASE = 'https://api.ahrefs.com/v3/site-explorer';

export function metricsDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export function compareDate12M(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  return d.toISOString().slice(0, 10);
}

export function historyDateFrom12M(): string {
  return historyDateFromMonths(12);
}

export function historyDateFrom24M(): string {
  return historyDateFromMonths(24);
}

export function historyDateFromMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export async function ahrefsGet<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<{ data: T | null; called: boolean }> {
  const apiKey = env('AHREFS_API_KEY');
  if (!apiKey) return { data: null, called: false };

  const url = new URL(`${AHREFS_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.warn(`[ahrefs] ${path} failed: ${res.status} ${res.statusText}`);
      return { data: null, called: true };
    }
    return { data: (await res.json()) as T, called: true };
  } catch (err) {
    console.warn('[ahrefs] request error:', err);
    return { data: null, called: true };
  }
}

const KEYWORDS_BASE = 'https://api.ahrefs.com/v3/keywords-explorer';

export async function ahrefsKeywordsGet<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<{ data: T | null; called: boolean }> {
  const apiKey = env('AHREFS_API_KEY');
  if (!apiKey) return { data: null, called: false };

  const url = new URL(`${KEYWORDS_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.warn(`[ahrefs-kw] ${path} failed: ${res.status} ${res.statusText}`);
      return { data: null, called: true };
    }
    return { data: (await res.json()) as T, called: true };
  } catch (err) {
    console.warn('[ahrefs-kw] request error:', err);
    return { data: null, called: true };
  }
}

/** Base Ahrefs calls: source metrics + source history + organic competitors + keyword volume. */
export const AHREFS_MARKET_DATA_BASE_CALLS = 4;
