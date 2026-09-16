import { authors } from '../../data/authors';
import { fileProductsBaseline } from '../../data/products';
import { fileAiGirlfriendRoundup } from '../../data/roundups/ai-girlfriend';
import { publicPagePath } from '../urls';
import { loadRoundupForPublic, loadPublishedProducts, loadProductLogoMap } from '../content/store';
import { isPlaceholderImage } from '../media/optimize';
import { isPlaceholderLogo, resolveBrandLogo } from './brandLogos';
import { figmaScoreTone, formatScore } from './figmaScore';
import { publicAffiliateHref } from '../affiliate/publicHref';
import { getTestCategories } from '../test-framework';
import { buildHomeProofFacts, buildHomeTesterFacts, type HomeProofFact } from './homeProofMetrics';
import { productToRoundupPick } from '../content/roundupPick';

const SCORE_EXAMPLE_SLUG = 'candy-ai';
const WINNER_CARD_KEYS = ['images', 'characters', 'chat'] as const;
const TOP_CARD_KEYS = ['chat', 'images', 'video'] as const;
const SCORE_CATEGORY_KEYS = [
  'characters',
  'customization',
  'chat',
  'chat-features',
  'images',
  'video',
  'privacy',
  'pricing',
] as const;

export type HomePriorityId = string;

export interface HomeScoreChip {
  value: string;
  tone: ReturnType<typeof figmaScoreTone>;
}

export interface HomeCategoryBar {
  key: string;
  name: string;
  score: number;
  display: string;
  tone: ReturnType<typeof figmaScoreTone>;
  width: string;
  weight?: string;
}

export interface HomeRankedApp {
  slug: string;
  name: string;
  logo: string;
  rank: number;
  overall: HomeScoreChip;
  overallNumber: number;
  award?: string;
  reviewUrl: string;
  affiliateUrl: string;
  priceLabel: string;
  bars: HomeCategoryBar[];
  summary: string;
}

export interface HomePriorityPanel {
  id: HomePriorityId;
  label: string;
  eyebrow: string;
  award: string;
  metricLabel: string;
  ctaLabel: string;
  roundupHref: string;
  winner: HomeRankedApp;
  runners: Array<{
    rank: number;
    slug: string;
    name: string;
    logo: string;
    score: HomeScoreChip;
  }>;
}

export interface HomeLatestItem {
  id: string;
  type: string;
  title: string;
  href: string;
  date: string;
  dateMs: number;
  description: string;
  image?: string;
  result?: string;
}

export interface DesktopHomepageData {
  updatedLabel: string;
  updatedShort: string;
  methodologyVersion: string;
  proofFacts: HomeProofFact[];
  testerFacts: HomeProofFact[];
  publishedReviewCount: number;
  top3: HomeRankedApp[];
  finalists: Array<{ name: string; logo: string; slug: string }>;
  winner: HomeRankedApp;
  winnerHeroBars: HomeCategoryBar[];
  priorities: HomePriorityPanel[];
  scoreExample: {
    app: HomeRankedApp;
    bars: HomeCategoryBar[];
  };
  featured: HomeLatestItem | null;
  latestRows: HomeLatestItem[];
  tester: {
    name: string;
    role: string;
    education: string;
    bio: string;
    aboutHref: string;
  };
  testingVideoSrc: string;
  testingVideoPoster: string;
}

function categoryWeightsMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of getTestCategories()) {
    map.set(cat.key, `${cat.weight}% weight`);
  }
  return map;
}

function buildPriorityMeta() {
  const overall = {
    id: 'overall',
    label: 'Overall',
    categoryKey: null as string | null,
    rankParam: null as string | null,
    eyebrow: 'Best overall',
    award: 'Best overall',
    metricLabel: 'overall',
    ctaLabel: 'View overall ranking',
  };
  const fromTaxonomy = getTestCategories().map((cat) => {
    const rankParam = cat.key === 'pricing' ? 'price' : cat.key;
    const short = cat.name;
    return {
      id: cat.key,
      label: short,
      categoryKey: cat.key,
      rankParam,
      eyebrow: `Best for ${short.toLowerCase()}`,
      award: `Best ${short.toLowerCase()}`,
      metricLabel: `for ${short}`,
      ctaLabel: `View ${short.toLowerCase()} ranking`,
    };
  });
  return [overall, ...fromTaxonomy];
}

function chip(score: number): HomeScoreChip {
  return { value: formatScore(score), tone: figmaScoreTone(score) };
}

function barFrom(
  pick: { categoryScores: Array<{ key: string; name: string; score: number }> },
  key: string,
  weights: Map<string, string>,
): HomeCategoryBar | null {
  const cat = pick.categoryScores.find((c) => c.key === key);
  if (!cat) return null;
  return {
    key: cat.key,
    name: cat.name,
    score: cat.score,
    display: formatScore(cat.score),
    tone: figmaScoreTone(cat.score),
    width: `${Math.max(0, Math.min(10, cat.score)) * 10}%`,
    weight: weights.get(cat.key),
  };
}

function priceLabel(monthly: number): string {
  if (!Number.isFinite(monthly) || monthly <= 0) return 'See review';
  return `$${monthly.toFixed(2)}/mo`;
}

function scoreFor(pick: { overallScore: number; categoryScores: Array<{ key: string; score: number }> }, key: string | null) {
  if (!key) return pick.overallScore;
  return pick.categoryScores.find((c) => c.key === key)?.score ?? pick.overallScore;
}

function withLogo<T extends { slug: string; logo: string }>(item: T, logos: Map<string, string>): T {
  const fromDb = logos.get(item.slug);
  const next = fromDb && !isPlaceholderLogo(fromDb) ? fromDb : resolveBrandLogo(item.slug, item.logo);
  return next ? { ...item, logo: next } : item;
}

function toRanked(
  pick: {
    slug: string;
    name: string;
    logo: string;
    overallScore: number;
    awards?: Array<{ label: string; sortKey: string }>;
    reviewUrl: string;
    affiliateUrl: string;
    priceMonthly: number;
    overallSummary: string;
    intro: string;
    categoryScores: Array<{ key: string; name: string; score: number }>;
  },
  rank: number,
  barKeys: readonly string[],
  weights: Map<string, string>,
): HomeRankedApp {
  const bars = barKeys.map((key) => barFrom(pick, key, weights)).filter((b): b is HomeCategoryBar => b != null);
  return {
    slug: pick.slug,
    name: pick.name,
    logo: pick.logo,
    rank,
    overall: chip(pick.overallScore),
    overallNumber: pick.overallScore,
    award: pick.awards?.[0]?.label,
    reviewUrl: pick.reviewUrl,
    affiliateUrl: publicAffiliateHref(pick.slug, pick.affiliateUrl) ?? '',
    priceLabel: priceLabel(pick.priceMonthly),
    bars,
    summary: pick.overallSummary || pick.intro,
  };
}

function parseDateMs(value: string | undefined): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function publishedSortMs(product: { publishedAtMs?: number; reviewedDate?: string }): number {
  if (product.publishedAtMs && product.publishedAtMs > 0) return product.publishedAtMs;
  return parseDateMs(product.reviewedDate);
}

function formatMonthYearFromMs(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export async function loadDesktopHomepage(): Promise<DesktopHomepageData> {
  const [{ roundup }, published, logoMap] = await Promise.all([
    loadRoundupForPublic('ai-girlfriend', fileAiGirlfriendRoundup),
    loadPublishedProducts(fileProductsBaseline),
    loadProductLogoMap(),
  ]);
  const proofFacts = await buildHomeProofFacts(published);

  const weights = categoryWeightsMap();
  const picks = roundup.picks.filter((p) => p.overallScore != null);
  const publishedReviews = published.filter((p) => p.overallScore != null);

  const emptyApp: HomeRankedApp = {
    slug: '',
    name: '—',
    logo: '',
    rank: 1,
    overall: chip(0),
    overallNumber: 0,
    reviewUrl: '/reviews/',
    affiliateUrl: '#',
    priceLabel: '',
    bars: [],
    summary: '',
  };
  const top3 = picks.slice(0, 3).map((p, i) => withLogo(toRanked(p, i + 1, TOP_CARD_KEYS, weights), logoMap));
  const winnerSource = picks[0];
  const winner = withLogo(
    winnerSource ? toRanked(winnerSource, 1, TOP_CARD_KEYS, weights) : top3[0] ?? emptyApp,
    logoMap,
  );
  const winnerHeroBars = WINNER_CARD_KEYS.map((key) =>
    winnerSource ? barFrom(winnerSource, key, weights) : null,
  ).filter((b): b is HomeCategoryBar => b != null);
  if (winnerSource) {
    const overallAward =
      winnerSource.awards?.find((a) => a.sortKey === 'overall')?.label ?? 'Best overall';
    winner.award = overallAward;
    if (top3[0]) top3[0].award = overallAward;
  }

  const finalists = picks.slice(0, 5).map((p) =>
    withLogo({ name: p.name, logo: p.logo, slug: p.slug }, logoMap),
  );

  const priorityMeta = buildPriorityMeta();
  const priorities: HomePriorityPanel[] = priorityMeta.map((meta) => {
    const sorted = [...picks].sort((a, b) => scoreFor(b, meta.categoryKey) - scoreFor(a, meta.categoryKey));
    const first = sorted[0];
    const winnerApp = withLogo(first ? toRanked(first, 1, TOP_CARD_KEYS, weights) : winner, logoMap);
    const metricScore = first ? scoreFor(first, meta.categoryKey) : winner.overallNumber;
    winnerApp.award = meta.award;
    winnerApp.overall = chip(metricScore);
    winnerApp.overallNumber = metricScore;
    if (first && meta.categoryKey) {
      const cat = first.categoryScores.find((c) => c.key === meta.categoryKey);
      winnerApp.summary = cat?.description || first.overallSummary || first.intro;
    } else {
      winnerApp.summary = first?.overallSummary || first?.intro || winner.summary;
    }
    const runners = sorted.slice(1, 3).map((p, i) =>
      withLogo(
        {
          rank: i + 2,
          slug: p.slug,
          name: p.name,
          logo: p.logo,
          score: chip(scoreFor(p, meta.categoryKey)),
        },
        logoMap,
      ),
    );
    const roundupHref = meta.rankParam
      ? publicPagePath(`/best/ai-girlfriend/?rank=${meta.rankParam}`)
      : publicPagePath('/best/ai-girlfriend/');
    return {
      id: meta.id,
      label: meta.label,
      eyebrow: meta.eyebrow,
      award: meta.award,
      metricLabel: meta.metricLabel,
      ctaLabel: meta.ctaLabel,
      roundupHref,
      winner: winnerApp,
      runners,
    };
  });

  const publishedBySlug = new Map(publishedReviews.map((p) => [p.slug, p]));
  let scoreExamplePick = picks.find((p) => p.slug === SCORE_EXAMPLE_SLUG);
  if (!scoreExamplePick) {
    const product = publishedBySlug.get(SCORE_EXAMPLE_SLUG);
    const template = fileAiGirlfriendRoundup.picks.find((p) => p.slug === SCORE_EXAMPLE_SLUG);
    if (product && template) {
      scoreExamplePick = productToRoundupPick(template, product);
    }
  }
  scoreExamplePick = scoreExamplePick ?? winnerSource ?? picks[0];
  const scoreExampleApp = scoreExamplePick
    ? withLogo(toRanked(scoreExamplePick, 1, TOP_CARD_KEYS, weights), logoMap)
    : winner;
  const exampleBars = scoreExamplePick
    ? SCORE_CATEGORY_KEYS.map((key) => barFrom(scoreExamplePick, key, weights)).filter(
        (b): b is HomeCategoryBar => b != null,
      )
    : [];

  const latestPool: HomeLatestItem[] = [];

  for (const product of publishedReviews) {
    const dateMs = publishedSortMs(product);
    const rawImage = product.featuredImage?.full;
    const image = isPlaceholderImage(rawImage)
      ? resolveBrandLogo(product.slug, product.logo)
      : rawImage;
    latestPool.push({
      id: `review-${product.slug}`,
      type: 'Review',
      title: `${product.name} Review`,
      href: publicPagePath(`/reviews/${product.slug}/`),
      date: formatMonthYearFromMs(dateMs),
      dateMs,
      description: product.tagline || product.overallSummary || '',
      image: image || undefined,
      result:
        product.overallScore != null
          ? `${formatScore(product.overallScore)}/10 overall score`
          : undefined,
    });
  }

  latestPool.sort((a, b) => b.dateMs - a.dateMs);
  const featured =
    latestPool.find((item) => item.type === 'Review' && item.image) ??
    latestPool.find((item) => item.type === 'Review') ??
    null;
  const latestRows = latestPool.filter((item) => item.id !== featured?.id).slice(0, 4);

  const herman = authors['herman-carter'];
  const updated = roundup.modifiedDate || new Date().toISOString();
  const methodologyVersion =
    published.find((p) => p.methodology)?.methodology?.replace(/^Methodology\s+/i, '') || 'v3.1';

  return {
    updatedLabel: new Date(parseDateMs(updated) || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    updatedShort: new Date(parseDateMs(updated) || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
    methodologyVersion,
    proofFacts,
    testerFacts: buildHomeTesterFacts(published),
    publishedReviewCount: publishedReviews.length,
    top3,
    finalists,
    winner,
    winnerHeroBars,
    priorities,
    scoreExample: {
      app: scoreExampleApp,
      bars: exampleBars,
    },
    featured: featured
      ? {
          ...featured,
          date: `Published ${featured.date}`,
        }
      : null,
    latestRows,
    tester: {
      name: herman?.name ?? 'Herman Carter',
      role: 'Lead Reviewer',
      education: 'M.A. AI Ethics & Society',
      bio: 'I personally test the apps we review using paid accounts and the same scoring framework.',
      aboutHref: publicPagePath('/author/herman-carter/'),
    },
    testingVideoSrc: fileAiGirlfriendRoundup.testing.videoSrc,
    testingVideoPoster: fileAiGirlfriendRoundup.testing.videoPoster,
  };
}
