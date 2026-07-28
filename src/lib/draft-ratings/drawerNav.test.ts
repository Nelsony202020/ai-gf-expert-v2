import { describe, expect, it } from 'vitest';
import { buildDrawerNavChain } from './drawerNav';
import type { DraftCategory } from './types';

const categories: DraftCategory[] = [
  {
    slug: 'characters',
    name: 'Characters',
    subscores: [
      {
        slug: 'discovery',
        name: 'Discovery',
        evidenceCategories: [
          { drawerId: 'evidence-characters-discovery-filters', name: 'Filters' } as never,
          { drawerId: 'evidence-characters-discovery-browsing', name: 'Browsing' } as never,
        ],
      } as never,
      {
        slug: 'scenarios',
        name: 'Scenarios',
        evidenceCategories: [
          { drawerId: 'evidence-characters-scenarios-amount', name: 'Amount' } as never,
        ],
      } as never,
    ],
  } as never,
];

describe('buildDrawerNavChain', () => {
  it('scopes next/back within a subscore table', () => {
    const nav = buildDrawerNavChain(categories);
    const browsing = nav.get('evidence-characters-discovery-browsing');
    expect(browsing?.prevDrawerId).toBe('evidence-characters-discovery-filters');
    expect(browsing?.nextDrawerId).toBeUndefined();
    expect(nav.get('evidence-characters-discovery-filters')?.nextDrawerId).toBe(
      'evidence-characters-discovery-browsing',
    );
  });

  it('does not link discovery evidence to scenarios subscore', () => {
    const nav = buildDrawerNavChain(categories);
    expect(nav.get('evidence-characters-discovery-browsing')?.nextDrawerId).not.toBe(
      'evidence-characters-scenarios-amount',
    );
    expect(nav.get('subscore-calc-characters-scenarios')?.prevDrawerId).not.toBe(
      'evidence-characters-discovery-browsing',
    );
  });
});
