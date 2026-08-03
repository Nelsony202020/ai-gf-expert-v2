/** Hide / exclude gender count tests when that group was not selected on genders. */

const GENDER_COUNT_REQUIRES: Record<string, string | '__other__'> = {
  'female-count': 'Female',
  'anime-female-count': 'Female',
  'male-count': 'Male',
  'anime-male-count': 'Male',
  'transgender-count': 'Transgender',
  'non-binary-count': 'Non-binary',
  'other-count': '__other__',
};

export const GENDER_COUNT_SLUGS = new Set(Object.keys(GENDER_COUNT_REQUIRES));

export function parseGenderGroupsFromRaw(raw: unknown): Set<string> {
  const groups = new Set<string>();
  if (!raw || typeof raw !== 'object' || !('detail' in raw)) return groups;
  const detail = (raw as { detail?: Record<string, unknown> }).detail;
  if (!detail || typeof detail !== 'object') return groups;

  if (Array.isArray(detail.selected)) {
    for (const entry of detail.selected) {
      if (typeof entry === 'string' && entry.trim()) groups.add(entry.trim());
    }
  }

  if (Array.isArray(detail.otherEntries)) {
    for (const entry of detail.otherEntries) {
      if (typeof entry === 'string' && entry.trim()) groups.add('__other__');
    }
  } else if (typeof detail.other === 'string') {
    const extras = detail.other
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (extras.length > 0) groups.add('__other__');
  }

  return groups;
}

/** True when this count question should be shown and scored. */
export function isGenderCountApplicable(
  categorySlug: string | undefined,
  defSlug: string,
  gendersRaw: unknown,
): boolean {
  if (categorySlug !== 'characters') return true;
  const required = GENDER_COUNT_REQUIRES[defSlug];
  if (!required) return true;

  const groups = parseGenderGroupsFromRaw(gendersRaw);
  if (groups.size === 0) return false;

  if (required === '__other__') return groups.has('__other__');
  return groups.has(required);
}

export function filterGenderGatedItems<T extends { def: { slug?: unknown } }>(
  categorySlug: string | undefined,
  items: T[],
  gendersRaw: unknown,
): T[] {
  return items.filter(({ def }) =>
    isGenderCountApplicable(categorySlug, String(def.slug ?? ''), gendersRaw),
  );
}
