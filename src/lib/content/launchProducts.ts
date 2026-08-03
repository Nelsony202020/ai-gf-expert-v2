/** Products shown on public launch pages (directory, homepage, roundup). */
export const LAUNCH_PRODUCT_SLUGS = new Set(['candy-ai']);

export function isLaunchProduct(slug: string): boolean {
  return LAUNCH_PRODUCT_SLUGS.has(slug);
}

export function filterLaunchProducts<T extends { slug: string }>(items: T[]): T[] {
  return items.filter((item) => isLaunchProduct(item.slug));
}

export function filterLaunchSlugs(slugs: string[]): string[] {
  return slugs.filter((slug) => isLaunchProduct(slug));
}

/** Build compare picker defaults from launch picks (pads when fewer than three exist). */
export function launchCompareDefaultIds(
  picks: { id: string; slug: string }[],
  preferred: string[],
): [string, string, string] {
  const pickIds = new Set(picks.flatMap((p) => [p.id, p.slug]));
  const ids: string[] = [];

  for (const id of filterLaunchSlugs(preferred)) {
    if (pickIds.has(id) && !ids.includes(id)) ids.push(id);
  }
  for (const pick of picks) {
    if (!ids.includes(pick.id)) ids.push(pick.id);
    if (ids.length >= 3) break;
  }
  while (ids.length < 3 && picks.length > 0) {
    const next = picks[ids.length % picks.length]?.id;
    if (next) ids.push(next);
    else break;
  }

  const a = ids[0] ?? picks[0]?.id ?? '';
  const b = ids[1] ?? picks[0]?.id ?? a;
  const c = ids[2] ?? picks[0]?.id ?? a;
  return [a, b, c];
}
