import { authors } from '../../data/authors';
import { featuredGuides } from '../../data/homepage';
import { fileAiGirlfriendRoundup } from '../../data/roundups/ai-girlfriend';
import { guides } from '../../data/guides';
import { publicPagePath } from '../urls';
import { loadRoundupForPublic, loadPublishedProducts } from '../content/store';
import { figmaScoreTone, formatScore } from './figmaScore';

const WINNER_CARD_KEYS = ['images', 'characters', 'chat'] as const;
const TOP_CARD_KEYS = ['chat', 'images', 'video'] as const;

export type HomePriorityId = 'overall' | 'chat' | 'images' | 'video' | 'price';

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
}

const PRIORITY_META: Array<{
  id: HomePriorityId;
  label: string;
  categoryKey: string | null;
  rankParam: string | null;
  eyebrow: string;
  award: string;
  metricLabel: string;
  ctaLabel: string;
}> = [
  {
    id: 'overall',
    label: 'Overall',
    categoryKey: null,
    rankParam: null,
    eyebrow: 'Best overall',
    award: 'Best overall',
    metricLabel: 'overall',
    ctaLabel: 'View overall ranking',
  },
  {
    id: 'chat',
    label: 'Chat',
    categoryKey: 'chat',
    rankParam: 'chat',
    eyebrow: 'Best for chat',
    award: 'Best chat',
    metricLabel: 'for Chat',
    ctaLabel: 'View chat ranking',
  },
  {
    id: 'images',
    label: 'Images',
    categoryKey: 'images',
    rankParam: 'images',
    eyebrow: 'Best for images',
    award: 'Best images',
    metricLabel: 'for Images',
    ctaLabel: 'View image ranking',
  },
  {
    id: 'video',
    label: 'Video',
    categoryKey: 'video',
    rankParam: 'video',
    eyebrow: 'Best for video',
    award: 'Best videos',
    metricLabel: 'for Video',
    ctaLabel: 'View video ranking',
  },
  {
    id: 'price',
    label: 'Price',
    categoryKey: 'pricing',
    rankParam: 'price',
    eyebrow: 'Best for price',
    award: 'Best price',
    metricLabel: 'for Price',
    ctaLabel: 'View price ranking',
  },
];

const CATEGORY_WEIGHTS: Record<string, string> = {
  characters: '10% weight',
  customization: '15% weight',
  chat: '20% weight',
  'chat-features': '10% weight',
  images: '15% weight',
  video: '10% weight',
  privacy: '10% weight',
  pricing: '10% weight',
};

function chip(score: number): HomeScoreChip {
  return { value: formatScore(score), tone: figmaScoreTone(score) };
}

function barFrom(
  pick: { categoryScores: Array<{ key: string; name: string; score: number }> },
  key: string,
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
    weight: CATEGORY_WEIGHTS[cat.key],
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
): HomeRankedApp {
  const bars = barKeys.map((key) => barFrom(pick, key)).filter((b): b is HomeCategoryBar => b != null);
  return {
    slug: pick.slug,
    name: pick.name,
    logo: pick.logo,
    rank,
    overall: chip(pick.overallScore),
    overallNumber: pick.overallScore,
    award: pick.awards?.[0]?.label,
    reviewUrl: pick.reviewUrl,
    affiliateUrl: pick.affiliateUrl,
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

function formatMonthYear(value: string | undefined, fallbackMs?: number): string {
  const ms = parseDateMs(value) || fallbackMs || 0;
  if (!ms) return value ?? '';
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export async function loadDesktopHomepage(): Promise<DesktopHomepageData> {
  const [{ roundup }, published] = await Promise.all([
    loadRoundupForPublic('ai-girlfriend', fileAiGirlfriendRoundup),
    loadPublishedProducts([]),
  ]);

  const picks = roundup.picks.filter((p) => p.overallScore != null);
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
  const top3 = picks.slice(0, 3).map((p, i) => toRanked(p, i + 1, TOP_CARD_KEYS));
  const winnerSource = picks[0];
  const winner = winnerSource ? toRanked(winnerSource, 1, TOP_CARD_KEYS) : top3[0] ?? emptyApp;
  const winnerHeroBars = WINNER_CARD_KEYS.map((key) => (winnerSource ? barFrom(winnerSource, key) : null)).filter(
    (b): b is HomeCategoryBar => b != null,
  );
  if (winnerSource) {
    const overallAward =
      winnerSource.awards?.find((a) => a.sortKey === 'overall')?.label ?? 'Best overall';
    winner.award = overallAward;
    if (top3[0]) top3[0].award = overallAward;
  }

  const finalists = picks.slice(0, 5).map((p) => ({ name: p.name, logo: p.logo, slug: p.slug }));

  const priorities: HomePriorityPanel[] = PRIORITY_META.map((meta) => {
    const sorted = [...picks].sort((a, b) => scoreFor(b, meta.categoryKey) - scoreFor(a, meta.categoryKey));
    const first = sorted[0];
    const winnerApp = first
      ? toRanked(first, 1, TOP_CARD_KEYS)
      : winner;
    const metricScore = first ? scoreFor(first, meta.categoryKey) : winner.overallNumber;
    winnerApp.award = meta.award;
    winnerApp.overall = chip(metricScore);
    winnerApp.overallNumber = metricScore;
    const catBar = first && meta.categoryKey ? barFrom(first, meta.categoryKey) : null;
    if (catBar) {
      winnerApp.summary = first.categoryScores.find((c) => c.key === meta.categoryKey)?.description || first.overallSummary || first.intro;
    } else {
      winnerApp.summary = first?.overallSummary || first?.intro || winner.summary;
    }
    const runners = sorted.slice(1, 3).map((p, i) => ({
      rank: i + 2,
      slug: p.slug,
      name: p.name,
      logo: p.logo,
      score: chip(scoreFor(p, meta.categoryKey)),
    }));
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

  const examplePick = winnerSource ?? picks[0];
  const exampleBars = examplePick
    ? [
        'characters',
        'customization',
        'chat',
        'chat-features',
        'images',
        'video',
        'privacy',
        'pricing',
      ]
        .map((key) => barFrom(examplePick, key))
        .filter((b): b is HomeCategoryBar => b != null)
    : [];

  const latestPool: HomeLatestItem[] = [];

  for (const product of published) {
    const date = product.modifiedDate || product.reviewedDate || '';
    const image = product.featuredImage?.full;
    const weakest = [...product.categories]
      .filter((c) => c.score != null)
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
    const bits = [product.tagline];
    if (weakest?.score != null) bits.push(`Weakest category: ${weakest.name} (${formatScore(weakest.score)}).`);
    latestPool.push({
      id: `review-${product.slug}`,
      type: 'Review',
      title: `${product.name} Review`,
      href: publicPagePath(`/reviews/${product.slug}/`),
      date: formatMonthYear(date),
      dateMs: parseDateMs(date),
      description: bits.filter(Boolean).join(' '),
      image,
      result:
        product.overallScore != null
          ? `${formatScore(product.overallScore)}/10 after 3+ months of testing`
          : undefined,
    });
  }

  latestPool.push({
    id: 'roundup-best',
    type: 'Roundup',
    title: roundup.title || 'Best AI Girlfriend Apps',
    href: publicPagePath('/best/ai-girlfriend/'),
    date: formatMonthYear(roundup.modifiedDate),
    dateMs: parseDateMs(roundup.modifiedDate),
    description: 'Every tested app ranked on the same 8 categories.',
  });

  latestPool.push({
    id: 'method-hub',
    type: 'Methodology',
    title: 'How We Score Apps',
    href: publicPagePath('/test/'),
    date: formatMonthYear(undefined, Date.parse('2026-05-03')),
    dateMs: Date.parse('2026-05-03'),
    description: 'What each of the 8 categories measures and how it is weighted.',
  });

  latestPool.push({
    id: 'method-score',
    type: 'Methodology',
    title: 'How the AIGE Score works',
    href: publicPagePath('/test/tooltips/'),
    date: formatMonthYear(undefined, Date.parse('2026-05-03')),
    dateMs: Date.parse('2026-05-03') - 1,
    description: 'How results and weights make the final score.',
  });

  for (const guide of guides.filter((g) => !g.noindex)) {
    latestPool.push({
      id: `guide-${guide.slug}`,
      type: 'Guide',
      title: guide.title,
      href: publicPagePath(`/guides/${guide.slug}/`),
      date: formatMonthYear(guide.publishedAt),
      dateMs: parseDateMs(guide.publishedAt),
      description: guide.excerpt || '',
      image: undefined,
    });
  }

  for (const guide of featuredGuides) {
    if (latestPool.some((item) => item.href === guide.href)) continue;
    latestPool.push({
      id: `static-${guide.id}`,
      type: guide.type === 'roundup' ? 'Roundup' : guide.type === 'comparison' ? 'Comparison' : 'Guide',
      title: guide.title,
      href: guide.href,
      date: formatMonthYear(guide.date),
      dateMs: parseDateMs(guide.date),
      description: guide.excerpt,
    });
  }

  latestPool.sort((a, b) => b.dateMs - a.dateMs);
  const featured =
    latestPool.find((item) => item.type === 'Review' && item.image) ??
    latestPool.find((item) => item.type === 'Review') ??
    latestPool[0] ??
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
    top3,
    finalists,
    winner,
    winnerHeroBars,
    priorities,
    scoreExample: {
      app: winner,
      bars: exampleBars,
    },
    featured: featured
      ? {
          ...featured,
          date: featured.type === 'Review' ? `Updated ${featured.date}` : featured.date,
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
  };
}
