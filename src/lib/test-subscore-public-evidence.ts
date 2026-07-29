import { testContributorUrl } from './slugs';

export interface PublicContributorNode {
  label: string;
  slug: string;
  href: string;
}

export interface PublicEvidenceGroup {
  label: string;
  slug: string;
  memberSlugs: string[];
}

/** Public-facing evidence groups that may wrap several DB evidence definitions. */
const PUBLIC_EVIDENCE_GROUPS: Record<string, PublicEvidenceGroup[]> = {
  'characters/variety': [
    {
      label: 'Amount',
      slug: 'amount',
      memberSlugs: ['total-count'],
    },
    {
      label: 'Styles',
      slug: 'styles',
      memberSlugs: ['styles'],
    },
    {
      label: 'Genders',
      slug: 'genders',
      memberSlugs: [
        'female-count',
        'male-count',
        'transgender-count',
        'non-binary-count',
        'other-count',
      ],
    },
    {
      label: 'Ethnicities',
      slug: 'ethnicities',
      memberSlugs: ['ethnicities'],
    },
    {
      label: 'Personalities',
      slug: 'personalities',
      memberSlugs: ['personalities'],
    },
    {
      label: 'Scenarios',
      slug: 'scenarios',
      memberSlugs: ['scenarios'],
    },
  ],
};

export function getPublicEvidenceGroups(
  categoryKey: string,
  subscoreSlug: string,
): PublicEvidenceGroup[] | undefined {
  return PUBLIC_EVIDENCE_GROUPS[`${categoryKey}/${subscoreSlug}`];
}

export function getPublicContributors(
  categoryKey: string,
  subscoreSlug: string,
  subscoreName: string,
): PublicContributorNode[] | undefined {
  const groups = getPublicEvidenceGroups(categoryKey, subscoreSlug);
  if (!groups) return undefined;

  return groups.map((group) => ({
    label: group.label,
    slug: group.slug,
    href: testContributorUrl(categoryKey, subscoreName, group.slug),
  }));
}
