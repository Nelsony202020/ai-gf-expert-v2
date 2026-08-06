import type { DocumentLabel } from './types';

function lastPathSegment(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '');
    const parts = path.split('/').filter(Boolean);
    return (parts[parts.length - 1] ?? '').toLowerCase();
  } catch {
    return '';
  }
}

function segmentMatches(segment: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(segment));
}

/** Infer policy document type from URL path and host. */
export function inferDocumentLabelFromUrl(url: string): DocumentLabel {
  const segment = lastPathSegment(url);
  const s = url.toLowerCase();

  // Prefer the last path segment (handles /terms/refund-policy, /terms/privacy-policy, etc.)
  if (
    segmentMatches(segment, [/refund/, /money-back/, /chargeback/, /return-policy/, /billing-refund/]) ||
    /refund|money-back|chargeback|billing-refund|return-policy/.test(s)
  ) {
    return 'Refund Policy';
  }
  if (
    segmentMatches(segment, [/privacy/, /data-policy/, /gdpr/, /ccpa/, /data-protection/]) ||
    /privacy|data-policy|gdpr|ccpa|data-protection/.test(s)
  ) {
    return 'Privacy Policy';
  }
  if (segmentMatches(segment, [/cookie/]) || /cookie/.test(s)) return 'Cookie Policy';
  if (
    segmentMatches(segment, [/moderation/, /content-policy/, /acceptable-use/, /screening/, /prohibited-content/]) ||
    /moderation|content-policy|acceptable-use|aup\b|prohibited-content|screening-policy/.test(s)
  ) {
    return 'Content Moderation Policy';
  }
  if (
    segmentMatches(segment, [/community/, /guidelines/, /code-of-conduct/]) ||
    /community|guidelines|code-of-conduct/.test(s)
  ) {
    return 'Community Guidelines';
  }
  if (
    segmentMatches(segment, [/data-processing/, /dpa/, /subprocessor/, /processor/]) ||
    /data-processing|dpa|subprocessor|processor/.test(s)
  ) {
    return 'Data Processing Policy';
  }
  if (
    segmentMatches(segment, [/^terms-of-service$/, /^terms-of-use$/, /^tos$/, /^terms$/]) ||
    /terms-of-service|terms-of-use|\/tos\b|legal\/terms/.test(s)
  ) {
    return 'Terms of Service';
  }
  // Broad /terms/ index pages (no specific child policy in the last segment).
  if (/\/terms\/?$/.test(s) || segment === 'terms') return 'Terms of Service';

  if (/conditions/.test(s)) return 'Terms of Service';
  return 'Other';
}

/** Extract http(s) URLs from free-form text (newline, comma, or space separated). */
export function parsePolicyUrls(text: string): string[] {
  const found = new Set<string>();
  const re = /https?:\/\/[^\s<>"')\],]+/gi;
  for (const match of text.matchAll(re)) {
    let url = match[0].replace(/[.,;]+$/, '');
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        found.add(parsed.toString());
      }
    } catch {
      /* skip invalid */
    }
  }
  return [...found];
}

export function documentLooksLikeRefund(doc: { label?: string; sourceUrl?: string }): boolean {
  if (doc.label === 'Refund Policy') return true;
  const url = (doc.sourceUrl ?? '').toLowerCase();
  return /refund|money-back|chargeback|return-policy|billing-refund/.test(url);
}
