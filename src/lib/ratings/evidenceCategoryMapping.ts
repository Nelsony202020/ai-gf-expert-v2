import { toSlug } from '../slugs';

export interface EvidenceCategoryGroupDef {
  slug: string;
  name: string;
  memberSlugs: string[];
}

/** Evidence category groups per category/subscore — drives public hierarchy. */
export const SUBSCORE_EVIDENCE_GROUPS: Record<string, EvidenceCategoryGroupDef[]> = {
  'characters/variety': [
    {
      slug: 'amount',
      name: 'Amount',
      memberSlugs: [
        'female-count',
        'male-count',
        'anime-female-count',
        'anime-male-count',
        'transgender-count',
        'non-binary-count',
        'other-count',
      ],
    },
    { slug: 'styles', name: 'Styles', memberSlugs: ['styles'] },
    { slug: 'genders', name: 'Genders', memberSlugs: ['genders'] },
    { slug: 'ethnicities', name: 'Ethnicities', memberSlugs: ['ethnicities'] },
    { slug: 'personalities', name: 'Personalities', memberSlugs: ['personalities'] },
    { slug: 'scenarios', name: 'Scenarios', memberSlugs: ['scenarios'] },
  ],
  'characters/discovery': [
    { slug: 'filters', name: 'Filters', memberSlugs: ['filters'] },
    { slug: 'categories', name: 'Categories', memberSlugs: ['categories'] },
    { slug: 'search', name: 'Search', memberSlugs: ['search'] },
    { slug: 'browsing', name: 'Browsing', memberSlugs: ['browsing'] },
  ],
  'characters/quality': [
    { slug: 'duplicates', name: 'Duplicates', memberSlugs: ['duplicates'] },
    { slug: 'originality', name: 'Originality', memberSlugs: ['originality'] },
    { slug: 'profile-quality', name: 'Profile Quality', memberSlugs: ['profile-quality'] },
    { slug: 'visual-quality', name: 'Visual Quality', memberSlugs: ['visual-quality'] },
  ],
  'customization/appearance': [
    { slug: 'ethnicity', name: 'Ethnicity', memberSlugs: ['ethnicity'] },
    { slug: 'age', name: 'Age', memberSlugs: ['age'] },
    { slug: 'eye-color', name: 'Eye color', memberSlugs: ['eye-color'] },
    { slug: 'body-type', name: 'Body type', memberSlugs: ['body-type'] },
    { slug: 'breast-size', name: 'Breast size', memberSlugs: ['breast-size'] },
    { slug: 'hair-style', name: 'Hair style', memberSlugs: ['hair-style'] },
    { slug: 'hair-color', name: 'Hair color', memberSlugs: ['hair-color'] },
    { slug: 'outfits', name: 'Outfits', memberSlugs: ['outfits'] },
    { slug: 'personalities', name: 'Personalities', memberSlugs: ['creator-personalities'] },
  ],
  'chat/understanding': [
    { slug: 'memory', name: 'Memory', memberSlugs: ['memory'] },
    { slug: 'relevance', name: 'Relevance', memberSlugs: ['relevance'] },
    { slug: 'context', name: 'Context', memberSlugs: ['context'] },
    { slug: 'instructions', name: 'Instructions', memberSlugs: ['instructions'] },
    { slug: 'roleplay-accuracy', name: 'Roleplay Accuracy', memberSlugs: ['roleplay-accuracy'] },
  ],
  'chat/realism': [
    { slug: 'naturalness', name: 'Naturalness', memberSlugs: ['naturalness'] },
    { slug: 'personality', name: 'Personality', memberSlugs: ['personality'] },
    { slug: 'roleplay', name: 'Roleplay', memberSlugs: ['roleplay'] },
    { slug: 'emotion', name: 'Emotion', memberSlugs: ['emotion'] },
    { slug: 'initiative', name: 'Initiative', memberSlugs: ['initiative'] },
  ],
  'chat/reliability': [
    { slug: 'speed', name: 'Speed', memberSlugs: ['speed'] },
    { slug: 'errors', name: 'Errors', memberSlugs: ['errors'] },
    { slug: 'consistency', name: 'Consistency', memberSlugs: ['consistency'] },
    { slug: 'recovery', name: 'Recovery', memberSlugs: ['recovery'] },
  ],
};

/** Material Symbols icon names for evidence category rows. */
export const CONTRIBUTOR_ICONS: Record<string, string> = {
  amount: 'groups',
  styles: 'palette',
  genders: 'transgender',
  ethnicities: 'public',
  personalities: 'mood',
  scenarios: 'auto_awesome',
  filters: 'filter_alt',
  categories: 'category',
  search: 'search',
  browsing: 'travel_explore',
  duplicates: 'content_copy',
  originality: 'auto_awesome',
  'profile-quality': 'description',
  'visual-quality': 'photo_camera',
  ethnicity: 'public',
  age: 'cake',
  'eye-color': 'visibility',
  'body-type': 'accessibility_new',
  'breast-size': 'straighten',
  'hair-style': 'content_cut',
  'hair-color': 'palette',
  outfits: 'checkroom',
  memory: 'psychology',
  relevance: 'target',
  context: 'forum',
  instructions: 'rule',
  'roleplay-accuracy': 'theater_comedy',
  naturalness: 'record_voice_over',
  personality: 'mood',
  roleplay: 'theater_comedy',
  emotion: 'sentiment_satisfied',
  initiative: 'bolt',
  speed: 'speed',
  errors: 'error',
  consistency: 'sync',
  recovery: 'restart_alt',
};

/** @deprecated Use SUBSCORE_EVIDENCE_GROUPS — kept for slug lookups. */
export const CONTRIBUTOR_MEMBER_SLUGS: Record<string, string[]> = Object.fromEntries(
  Object.entries(SUBSCORE_EVIDENCE_GROUPS).flatMap(([key, groups]) =>
    groups.map((g) => [`${key}/${g.slug}`, g.memberSlugs]),
  ),
);

const SCOPE_BY_CONTRIBUTOR: Record<string, string> = {
  amount: 'Measures the size and breadth of available options in this area.',
  styles: 'Measures how many distinct visual or format styles are offered.',
  genders: 'Measures gender and identity representation across available options.',
  ethnicities: 'Measures how many ethnicity or background groups are represented.',
  personalities: 'Measures the range of personality types available.',
  scenarios: 'Measures relationship, story, and scenario variety.',
};

export function contributorKey(
  categorySlug: string,
  subscoreSlug: string,
  contributorLabel: string,
): string {
  return `${categorySlug}/${subscoreSlug}/${toSlug(contributorLabel)}`;
}

export function memberSlugsForContributor(
  categorySlug: string,
  subscoreSlug: string,
  contributorLabel: string,
): string[] {
  const key = contributorKey(categorySlug, subscoreSlug, contributorLabel);
  return CONTRIBUTOR_MEMBER_SLUGS[key] ?? [toSlug(contributorLabel)];
}

export function evidenceGroupsForSubscore(
  categorySlug: string,
  subscoreSlug: string,
): EvidenceCategoryGroupDef[] | undefined {
  return SUBSCORE_EVIDENCE_GROUPS[`${categorySlug}/${subscoreSlug}`];
}

export function scopeForContributor(contributorLabel: string): string | undefined {
  return SCOPE_BY_CONTRIBUTOR[toSlug(contributorLabel)];
}

export function iconForContributor(groupSlug: string, label: string): string {
  return CONTRIBUTOR_ICONS[groupSlug] ?? CONTRIBUTOR_ICONS[toSlug(label)] ?? 'analytics';
}
