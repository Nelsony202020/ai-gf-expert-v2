import type { RatingChangelogEntry } from './products';

export interface TestMethodologyAuthor {
  name: string;
  role: string;
  avatar: string;
  verified?: boolean;
  slug?: string;
}

export interface TestMethodologyPageMeta {
  reviewedDate: string;
  modifiedDate: string;
  methodology: string;
  authors: TestMethodologyAuthor[];
  changelog: RatingChangelogEntry[];
}

export const testMethodologyPageMeta: TestMethodologyPageMeta = {
  reviewedDate: 'Jan 15, 2026',
  modifiedDate: 'Jul 21, 2026',
  methodology: 'Methodology v3.0',
  authors: [
    {
      name: 'Herman Carter',
      role: 'Lead Reviewer',
      avatar: '/brand/herman-main-icon.svg',
      verified: true,
      slug: 'herman-carter',
    },
  ],
  changelog: [
    {
      date: 'Aug 2026',
      title: 'Updated image and pricing tests',
      summary: 'Methodology v3.1 refinements across affected categories.',
      type: 'methodology',
    },
    {
      date: 'Jul 2026',
      title: 'Introduced eight-category framework',
      summary: 'Methodology v3.0 applied site-wide.',
      type: 'methodology',
    },
    {
      date: 'Early 2025',
      title: 'Expanded category coverage',
      summary: 'Added subscores based on reader survey feedback.',
      type: 'methodology',
    },
  ],
};

export function testCategoryFeaturedImage(categoryKey: string): string {
  return `https://picsum.photos/seed/test-cat-${categoryKey}/1600/640`;
}

export function testCategoryFeaturedImageAlt(categoryName: string): string {
  return `${categoryName} testing methodology — scoring framework and scored tests`;
}

export const testHubFeaturedImage = 'https://picsum.photos/seed/test-hub-hero/1600/640';

export const testHubFeaturedImageAlt =
  'How we test AI girlfriend apps — hands-on methodology and scoring framework';
