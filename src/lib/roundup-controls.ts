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

export const ROUNDUP_AWARD_SORT_OPTIONS: RoundupSortOption[] = [
  { value: 'overall', label: 'Best Overall', shortLabel: 'Overall' },
  { value: 'images', label: 'Best Images', shortLabel: 'Images' },
  { value: 'videos', label: 'Best Videos', shortLabel: 'Videos' },
  { value: 'roleplay', label: 'Best Roleplay', shortLabel: 'Roleplay' },
  { value: 'price', label: 'Best Price', shortLabel: 'Price' },
];

export function buildRoundupSortOptions(_picks?: RoundupPick[]): RoundupSortOption[] {
  return ROUNDUP_AWARD_SORT_OPTIONS;
}

export const ROUNDUP_SORT_LABELS: Record<string, string> = {
  overall: 'Ranked by best overall',
  images: 'Ranked by best images',
  videos: 'Ranked by best videos',
  roleplay: 'Ranked by best roleplay',
  price: 'Ranked by best price',
};
