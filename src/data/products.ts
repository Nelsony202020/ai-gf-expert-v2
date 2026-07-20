// ---------------------------------------------------------------------------
// Product data model + one fully-populated mock (Aura AI).
// ---------------------------------------------------------------------------

import { auraAiCategories } from './aura-ai-categories';
import { auraAiVerdicts, auraAiExpertOpinion } from './aura-ai-verdict';
import { computeOverallScore } from '../lib/scores';

export interface Author {
  name: string;
  role: string;
  avatar: string;
  verified?: boolean;
  slug?: string;
}

export interface GalleryImage {
  full: string;
  thumb: string;
  alt: string;
}

/** A labeled data point, optionally with a Material Symbols icon name. */
export interface DataRow {
  label: string;
  value: string;
  icon?: string;
  /** Internal 0–10 score used in calculation breakdowns (optional). */
  internalScore?: number;
}

export interface Subscore {
  name: string;
  score: number;
  /** weight within the category, as a percentage (sums to 100 per category) */
  weight: number;
  description: string;
  /** factors that determine this subscore (shown as chips + a value table) */
  contributors: DataRow[];
}

export interface ProofItem {
  src: string;
  caption: string;
  sub?: string;
  type?: 'image' | 'video';
}

export interface RatingCategory {
  key: string;
  name: string;
  score: number;
  /** weight within the overall score, as a percentage (sums to 100) */
  weight: number;
  description: string;
  subscores: Subscore[];
  /** the category-level evidence table (right column) */
  evidence: DataRow[];
  /** proof media (right column) */
  proof: ProofItem[];
  /** plain-language summary shown in the "What this means" callout */
  whatThisMeans: string;
}

export interface SafetyItem {
  label: string;
  status: string;
  icon: string;
}

export interface FeatureSpec {
  name: string;
  value: string;
  icon: string;
  available: boolean;
}

export interface OverviewCharacter {
  name: string;
  archetype: string;
  avatar: string;
  storySlides: string[];
  /** Placeholder profile URL — edit when character pages exist */
  profileUrl?: string;
}

export interface OverviewFeatureCard {
  id: string;
  title: string;
  icon: string;
  description: string;
  stats: { label: string; value: string }[];
  tabLink?: string;
}

export interface ComparisonMetric {
  id: string;
  label: string;
  productScore: number;
  categoryAverage: number;
  unit?: string;
  lowerIsBetter?: boolean;
}

export interface SearchTrendData {
  productName: string;
  currentInterest: number;
  peakInterest: number;
  changePercent: number;
  changeDirection: 'up' | 'down';
  popularityRank: number;
  totalReviewed: number;
}

export interface ProductOverview {
  highlights: {
    bestFor: string;
    standout: string;
    drawback: string;
    startingPrice: string;
  };
  characters: OverviewCharacter[];
  featureCards: OverviewFeatureCard[];
  comparisonMetrics: ComparisonMetric[];
  searchTrends: SearchTrendData;
  bestForList: string[];
  notIdealList: string[];
}

export interface RatingChangelogEntry {
  date: string;
  title: string;
  summary: string;
  type: 'score' | 'methodology' | 'data';
}

export interface VerdictItem {
  id: string;
  label: string;
  /** Short playful subheading shown below the category name */
  tagline?: string;
  summary: string;
  pros: string[];
  cons: string[];
  score?: number;
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  reviewedDate: string;
  modifiedDate: string;
  methodology: string;
  authors: Author[];
  websiteUrl: string;
  affiliateUrl: string;
  gallery: GalleryImage[];
  overallScore: number;
  overallSummary: string;
  ourTake: string;
  safetyAudit: SafetyItem[];
  featureSpecs: FeatureSpec[];
  overview: ProductOverview;
  ratingChangelog: RatingChangelogEntry[];
  categories: RatingCategory[];
  verdicts: VerdictItem[];
  expertOpinion: string;
  pricingDisplay: { monthly: string; storeLabel: string };
}

const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const avatar = (id: number) => `https://i.pravatar.cc/80?img=${id}`;

const categories = auraAiCategories;
const overallScore = computeOverallScore(categories);

const auraAi: Product = {
  slug: 'aura-ai',
  name: 'Aura AI',
  tagline: 'A premium AI companion with lifelike chat, voice calls, and best-in-class video.',
  reviewedDate: 'Oct 24, 2024',
  modifiedDate: 'Oct 25, 2024',
  methodology: 'Methodology v3.0',
  authors: [
    {
      name: 'Herman Carter',
      role: 'Lead Reviewer',
      avatar: '/brand/herman-main-icon.svg',
      verified: true,
      slug: 'herman-carter',
    },
    { name: 'Sarah Jenkins', role: 'Fact-Checker', avatar: avatar(45), verified: true },
  ],
  websiteUrl: 'https://example.com/aura-ai',
  affiliateUrl: 'https://example.com/go/aura-ai',
  gallery: [
    { full: img('aura-hero', 1280, 720), thumb: img('aura-hero', 320, 200), alt: 'Aura AI interface' },
    { full: img('aura-2', 1280, 720), thumb: img('aura-2', 320, 200), alt: 'Aura AI character gallery' },
    { full: img('aura-3', 1280, 720), thumb: img('aura-3', 320, 200), alt: 'Aura AI chat screen' },
    { full: img('aura-4', 1280, 720), thumb: img('aura-4', 320, 200), alt: 'Aura AI voice call' },
    { full: img('aura-5', 1280, 720), thumb: img('aura-5', 320, 200), alt: 'Aura AI customization' },
  ],
  overallScore,
  overallSummary: 'Top-rated AI companion for realistic chat and immersive media.',
  ourTake:
    'Aura AI excels in character variety and chat realism, making it a top-tier choice for users seeking deep engagement. While the conversational depth is industry-leading, image generation speeds could be improved to match the otherwise seamless experience. Overall, it remains a premier destination for high-quality AI companionship.',
  safetyAudit: [
    { label: 'Training', status: 'No', icon: 'model_training' },
    { label: 'Human Review', status: 'No', icon: 'visibility_off' },
    { label: 'Data Sharing', status: 'Limited', icon: 'share' },
    { label: 'Delete Chats', status: 'Yes', icon: 'delete' },
    { label: 'Encryption', status: 'Yes', icon: 'enhanced_encryption' },
    { label: 'Billing Privacy', status: 'Discreet', icon: 'credit_card_off' },
  ],
  featureSpecs: [
    { name: 'Image to Video', value: 'Yes', icon: 'movie', available: true },
    { name: 'Text to Video', value: 'No', icon: 'text_fields', available: false },
    { name: 'External Image Generator', value: 'Yes', icon: 'image', available: true },
    { name: 'AI Phone Calls', value: 'Yes', icon: 'call', available: true },
    { name: 'Role Play Mode', value: 'Yes', icon: 'theater_comedy', available: true },
    { name: 'Voice Messages', value: 'Yes', icon: 'graphic_eq', available: true },
  ],
  overview: {
    highlights: {
      bestFor: 'Deep roleplay & character variety',
      standout: 'Industry-leading chat realism',
      drawback: 'Slower image generation (~15s)',
      startingPrice: '$12.99 / mo',
    },
    characters: [
      {
        name: 'Finn',
        archetype: 'Adventurous storyteller',
        avatar: img('aura-char-finn', 200, 200),
        profileUrl: '#character/finn',
        storySlides: [img('aura-finn-1', 720, 1280), img('aura-finn-2', 720, 1280), img('aura-finn-3', 720, 1280)],
      },
      {
        name: 'Luna',
        archetype: 'Romantic dreamer',
        avatar: img('aura-char-luna', 200, 200),
        profileUrl: '#character/luna',
        storySlides: [img('aura-luna-1', 720, 1280), img('aura-luna-2', 720, 1280), img('aura-luna-3', 720, 1280)],
      },
      {
        name: 'Aiko',
        archetype: 'Playful anime fan',
        avatar: img('aura-char-aiko', 200, 200),
        profileUrl: '#character/aiko',
        storySlides: [img('aura-aiko-1', 720, 1280), img('aura-aiko-2', 720, 1280)],
      },
      {
        name: 'Sophie',
        archetype: 'Confident professional',
        avatar: img('aura-char-sophie', 200, 200),
        profileUrl: '#character/sophie',
        storySlides: [img('aura-sophie-1', 720, 1280), img('aura-sophie-2', 720, 1280), img('aura-sophie-3', 720, 1280)],
      },
      {
        name: 'Violet',
        archetype: 'Mysterious artist',
        avatar: img('aura-char-violet', 200, 200),
        profileUrl: '#character/violet',
        storySlides: [img('aura-violet-1', 720, 1280), img('aura-violet-2', 720, 1280)],
      },
      {
        name: 'Aria',
        archetype: 'Warm companion',
        avatar: img('aura-char-aria', 200, 200),
        profileUrl: '#character/aria',
        storySlides: [img('aura-aria-1', 720, 1280), img('aura-aria-2', 720, 1280)],
      },
      {
        name: 'Ethan',
        archetype: 'Chill best friend',
        avatar: img('aura-char-ethan', 200, 200),
        profileUrl: '#character/ethan',
        storySlides: [img('aura-ethan-1', 720, 1280), img('aura-ethan-2', 720, 1280)],
      },
    ],
    comparisonMetrics: [
      { id: 'chat', label: 'Chat realism', productScore: 9.2, categoryAverage: 7.4 },
      { id: 'images', label: 'Image quality', productScore: 8.4, categoryAverage: 7.1 },
      { id: 'price', label: 'Monthly price', productScore: 12.99, categoryAverage: 18.5, lowerIsBetter: true },
    ],
    searchTrends: {
      productName: 'Aura AI',
      currentInterest: 72,
      peakInterest: 100,
      changePercent: 18,
      changeDirection: 'up',
      popularityRank: 3,
      totalReviewed: 24,
    },
    featureCards: [
      {
        id: 'chat',
        title: 'Chat Experience',
        icon: 'chat',
        description: 'Memory, realism, and reply speed tested across 50+ scenarios.',
        stats: [
          { label: 'Chat score', value: '9.2' },
          { label: 'Avg. response', value: '1.8s' },
          { label: 'Memory retention', value: '88%' },
        ],
        tabLink: 'ratings',
      },
      {
        id: 'images',
        title: 'Images & Media',
        icon: 'photo_library',
        description: 'Image quality, consistency, and video generation benchmarks.',
        stats: [
          { label: 'Image score', value: '8.4' },
          { label: 'Gen. speed', value: '~15s' },
          { label: 'Video support', value: 'Yes' },
        ],
        tabLink: 'ratings',
      },
      {
        id: 'characters',
        title: 'Characters',
        icon: 'groups',
        description: 'Library size, discovery tools, and profile quality on our sample.',
        stats: [
          { label: 'Library size', value: '2,450+' },
          { label: 'Character score', value: '9.1' },
          { label: 'Filter options', value: '12' },
        ],
        tabLink: 'ratings',
      },
    ],
    bestForList: [
      'Users who want deep, realistic conversations',
      'Character variety across styles and archetypes',
      'Privacy-conscious users who want discreet billing',
    ],
    notIdealList: [
      'Users who need instant image generation',
      'Heavy free-tier usage without credits',
      'Long-form video beyond 5-second clips',
    ],
  },
  ratingChangelog: [
    {
      date: 'Jul 22, 2026',
      title: 'Overview & ratings UI refresh',
      summary: 'Updated comparison charts, search trend tracking, and refreshed character story highlights. No score changes in this release.',
      type: 'data',
    },
    {
      date: 'Oct 25, 2024',
      title: 'Characters score updated to 9.1',
      summary: 'Re-tested discovery filters after a platform update. Browsing success improved from 86% to 90%.',
      type: 'score',
    },
    {
      date: 'Oct 20, 2024',
      title: 'Methodology v3.0 applied',
      summary: 'Moved from expert factor scores to measured evidence with transparent weights across all categories.',
      type: 'methodology',
    },
  ],
  categories,
  verdicts: auraAiVerdicts,
  expertOpinion: auraAiExpertOpinion,
  pricingDisplay: { monthly: '$12.99 / mo', storeLabel: 'Aura AI' },
};

export const products: Product[] = [auraAi];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
