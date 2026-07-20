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
    { name: 'Herman Carter', role: 'AI Girlfriend Expert', avatar: '/authors/herman-carter.png', verified: true, slug: 'herman-carter' },
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
  categories,
  verdicts: auraAiVerdicts,
  expertOpinion: auraAiExpertOpinion,
  pricingDisplay: { monthly: '$12.99 / mo', storeLabel: 'Aura AI' },
};

export const products: Product[] = [auraAi];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
