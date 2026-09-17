/** Default rel tokens stored on new affiliate links in admin. */
export const DEFAULT_AFFILIATE_REL = 'sponsored nofollow';

/** True when href points at a cloaked /go/ affiliate redirect. */
export function isGoAffiliateHref(href: string | undefined | null): boolean {
  if (!href) return false;
  const raw = href.trim();
  if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return false;
  try {
    const url = raw.startsWith('//')
      ? new URL(`https:${raw}`)
      : new URL(raw, 'https://aigirlfriend.expert');
    return url.pathname === '/go' || url.pathname.startsWith('/go/');
  } catch {
    return raw.startsWith('/go/');
  }
}

export function isExternalAffiliateHref(href: string | undefined | null): boolean {
  if (!href?.trim() || href === '#') return false;
  return /^https?:\/\//i.test(href) || href.startsWith('/go/');
}

/**
 * rel for a /go/ link. Always sponsored + nofollow.
 * Add noopener only when the link opens a new tab. Never noreferrer
 * (it can strip referrer and break affiliate attribution).
 */
export function goAffiliateRel(opts: { newTab?: boolean } = {}): string {
  return opts.newTab ? 'sponsored nofollow noopener' : 'sponsored nofollow';
}

/** rel for any href: /go/ links get disclosure tokens; others keep `stored`. */
export function affiliateHrefRel(
  href: string | undefined | null,
  opts: { newTab?: boolean; stored?: string | null } = {},
): string | undefined {
  if (isGoAffiliateHref(href)) return goAffiliateRel({ newTab: opts.newTab });
  const trimmed = opts.stored?.trim();
  return trimmed || undefined;
}

/** Normalize stored rel tags for admin / fallbacks. Never emit noreferrer. */
export function affiliateRel(tags?: string | null): string {
  const tokens = new Set(
    String(tags ?? '')
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && t !== 'noreferrer'),
  );
  tokens.add('sponsored');
  tokens.add('nofollow');
  const ordered = ['sponsored', 'nofollow', 'noopener'].filter((t) => tokens.has(t));
  for (const extra of tokens) {
    if (!ordered.includes(extra)) ordered.push(extra);
  }
  return ordered.join(' ');
}

function walkHast(node: {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: unknown[];
}) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'element' && node.tagName === 'a') {
    const props = (node.properties ??= {});
    const href = String(props.href ?? '');
    if (isGoAffiliateHref(href)) {
      // Affiliate links always open in a new tab; target="_self" opts out.
      const newTab = String(props.target ?? '') !== '_self';
      if (newTab) props.target = '_blank';
      props.rel = goAffiliateRel({ newTab });
    }
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) walkHast(child as typeof node);
  }
}

/** Astro markdown rehype plugin: stamp rel on /go/ anchors. */
export function rehypeAffiliateLinks() {
  return function transformer(tree: { type?: string; children?: unknown[] }) {
    walkHast(tree);
  };
}
