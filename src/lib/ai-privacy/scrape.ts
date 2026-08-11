// Fetch a policy URL and extract readable plain text (no Firecrawl in v1).

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ScrapeResult {
  text: string;
  status: 'ok' | 'failed';
  error?: string;
}

/** Prefer the policy body over full-page chrome (Candy uses `.prose` / content containers). */
function extractLikelyPolicyHtml(html: string): string {
  const prose = html.match(
    /<div[^>]*class="[^"]*\bprose\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>\s*){0,3}<(?:footer|script|aside|nav)/i,
  );
  if (prose?.[1] && prose[1].length > 500) return prose[1];

  const mainContent = html.match(
    /<div[^>]*class="[^"]*main-content-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*id="mpc-/i,
  );
  if (mainContent?.[1] && mainContent[1].length > 500) return mainContent[1];

  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (article?.[1] && article[1].length > 500) return article[1];

  return html;
}

function stripHtml(html: string): string {
  let s = extractLikelyPolicyHtml(html);
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<(nav|header|footer|aside|svg)[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|br|section|article|header|footer)>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0 && !/^(class|id|style|data-|fill|viewBox|stroke)=/i.test(line))
    .filter((line) => !/^main#/i.test(line))
    .filter((line) => !/^(h|w|z)-\[/.test(line))
    .join('\n');
  return s.trim();
}

function blockedPageMessage(html: string): string | null {
  const sample = html.slice(0, 12_000).toLowerCase();
  if (/turnstile|cf-challenge|verify you are human|checking your browser/.test(sample)) {
    return 'This site uses Cloudflare bot protection — our server cannot pass the challenge. Open the link in your browser and paste the policy text below.';
  }
  if (/age verification required|adults only|confirm you.?re 18/.test(sample)) {
    return 'This site shows an age-verification gate before the policy text loads. Open the link in your browser and paste the policy text below.';
  }
  if (/page not found|404|doesn.?t exist|has been moved/.test(sample)) {
    return 'That URL returned a “page not found” page — double-check the link (some sites use paths like /terms/privacy-policy instead of /privacy-policy).';
  }
  return null;
}

function friendlyFetchError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : '';
  const combined = `${msg} ${cause}`.toLowerCase();
  if (combined.includes('abort') || combined.includes('timeout')) {
    return 'Timed out connecting to this site. It may block automated requests or be unreachable from our server — open the link in your browser and paste the policy text below.';
  }
  if (combined.includes('fetch failed') || combined.includes('connect timeout') || combined.includes('econnrefused')) {
    return 'Could not connect to this site from our server (it may block bots or restrict certain regions). Open the link in your browser and paste the policy text below.';
  }
  return msg.slice(0, 200);
}

export async function scrapePolicyUrl(url: string, maxChars = 80_000): Promise<ScrapeResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { text: '', status: 'failed', error: 'Invalid URL' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { text: '', status: 'failed', error: 'Only http(s) URLs are supported' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        text: '',
        status: 'failed',
        error: `HTTP ${res.status} — open the link to verify it, or paste the policy text below.`,
      };
    }

    const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
    const body = await res.text();
    const blocked = blockedPageMessage(body);
    if (blocked) {
      return { text: '', status: 'failed', error: blocked };
    }

    let text: string;
    if (contentType.includes('text/plain') || contentType.includes('markdown')) {
      text = body;
    } else {
      text = stripHtml(body);
    }
    text = text.slice(0, maxChars).trim();
    if (text.length < 40) {
      return {
        text: '',
        status: 'failed',
        error: 'Page returned too little readable text — open the link and paste the policy text below.',
      };
    }
    return { text, status: 'ok' };
  } catch (e) {
    return {
      text: '',
      status: 'failed',
      error: friendlyFetchError(e),
    };
  }
}

export function documentBodyText(doc: {
  pastedText?: string;
  scrapedText?: string;
}): string {
  const pasted = (doc.pastedText ?? '').trim();
  if (pasted) return pasted;
  return (doc.scrapedText ?? '').trim();
}
