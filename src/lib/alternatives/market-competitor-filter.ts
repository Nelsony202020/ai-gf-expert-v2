/** Filter Ahrefs organic competitors to AI companion / chatbot-relevant domains. */

const BLOCKED_DOMAINS = new Set([
  'apple.com',
  'google.com',
  'microsoft.com',
  'amazon.com',
  'facebook.com',
  'meta.com',
  'instagram.com',
  'youtube.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'reddit.com',
  'wikipedia.org',
  'linkedin.com',
  'pinterest.com',
  'yahoo.com',
  'bing.com',
  'netflix.com',
  'spotify.com',
  'github.com',
  'medium.com',
  'quora.com',
  'forbes.com',
  'nytimes.com',
  'bbc.com',
  'cnn.com',
  'ebay.com',
  'walmart.com',
  'target.com',
  'cloudflare.com',
  'wordpress.com',
  'shopify.com',
]);

const KNOWN_AI_DOMAINS = new Set([
  'aura.ai',
  'candy.ai',
  'kindroid.ai',
  'ourdream.ai',
  'girlfriendgpt.com',
  'replika.ai',
  'myanima.ai',
  'romanticai.com',
  'kupid.ai',
  'nastia.ai',
  'secrets.ai',
  'crushon.ai',
  'janitorai.com',
  'character.ai',
  'chai.ml',
  'chub.ai',
  'spicychat.ai',
  'dreamgf.ai',
  'pephop.ai',
  'botify.ai',
  'anima.ai',
]);

const DOMAIN_KEYWORDS = [
  'ai',
  'chat',
  'companion',
  'girlfriend',
  'boyfriend',
  'dream',
  'replika',
  'anima',
  'kindroid',
  'candy',
  'aura',
  'romantic',
  'kupid',
  'gpt',
  'character',
  'soul',
  'nastia',
  'secret',
  'crush',
  'flirt',
  'lover',
  'virtual',
  'waifu',
  'bot',
  'gf',
  'bf',
  'roleplay',
  'fantasy',
];

function normalizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, '');
}

export function isRelevantMarketCompetitor(domain: string): boolean {
  const d = normalizeDomain(domain);
  if (!d || d.length < 4) return false;
  if (BLOCKED_DOMAINS.has(d)) return false;

  const root = d.split('.').slice(-2).join('.');
  if (BLOCKED_DOMAINS.has(root)) return false;

  if (KNOWN_AI_DOMAINS.has(d)) return true;

  const stem = d.replace(/\.(com|ai|io|app|net|org|co)$/i, '');
  return DOMAIN_KEYWORDS.some((kw) => stem.includes(kw) || d.includes(kw));
}

export function filterRelevantCompetitors<T extends { domain: string }>(rows: T[], limit = 7): T[] {
  return rows.filter((r) => isRelevantMarketCompetitor(r.domain)).slice(0, limit);
}
