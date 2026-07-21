import type { RoundupPick } from '../data/roundups/ai-girlfriend';

export interface RoundupReadingOption {
  value: string;
  label: string;
  description: string;
}

export interface RoundupSortOption {
  value: string;
  label: string;
  /** Shorter label for compact mobile trigger */
  shortLabel?: string;
}

export const ROUNDUP_READING_OPTIONS: RoundupReadingOption[] = [
  {
    value: 'skim',
    label: 'Skim',
    description: 'Scores, winners and essential findings',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Key evidence and explanations',
  },
  {
    value: 'all-in',
    label: 'All in',
    description: 'Complete testing details',
  },
];

export function buildRoundupSortOptions(picks: RoundupPick[]): RoundupSortOption[] {
  return [
    { value: 'overall', label: 'Overall rating', shortLabel: 'Overall' },
    ...picks.map((p) => ({
      value: p.ribbonKey,
      label: p.ribbon,
      shortLabel: p.ribbon.replace(/^Best for /i, '').replace(/^Best /i, ''),
    })),
    { value: 'price-asc', label: 'Price: low to high', shortLabel: 'Price ↑' },
    { value: 'price-desc', label: 'Price: high to low', shortLabel: 'Price ↓' },
  ];
}

export const ROUNDUP_SORT_LABELS: Record<string, string> = {
  overall: 'Ranked by overall rating',
  voice: 'Ranked by voice',
  roleplay: 'Ranked by roleplay',
  video: 'Ranked by video',
  images: 'Ranked by images',
  privacy: 'Ranked by privacy',
  free: 'Ranked by free tier',
  value: 'Ranked by value',
  'price-asc': 'Ranked by price (low to high)',
  'price-desc': 'Ranked by price (high to low)',
};
