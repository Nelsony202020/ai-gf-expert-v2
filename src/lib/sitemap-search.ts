import type { HtmlSitemapSearchGroup, HtmlSitemapSearchHit } from "../types/sitemap";

export const SEARCH_GROUP_ORDER = [
  "Testing",
  "Guides",
  "Reviews",
  "Roundups",
  "Authors",
  "Resources",
] as const;

function titleScore(title: string, needle: string): number {
  if (title === needle) return 100;
  if (title.startsWith(needle)) return 90;
  const words = title.split(/[^a-z0-9]+/);
  if (words.some((word) => word === needle)) return 82;
  if (words.some((word) => word.startsWith(needle))) return 74;
  if (title.includes(needle)) return 60;
  return 0;
}

function searchScore(item: HtmlSitemapSearchHit, needle: string): number {
  const title = item.title.toLowerCase();
  const context = (item.context ?? "").toLowerCase();
  const group = item.group.toLowerCase();
  const kindLabel = item.kindLabel.toLowerCase();
  let score = titleScore(title, needle);
  if (score === 0 && context) {
    if (context === needle || context.startsWith(needle)) score = 36;
    else if (context.split(/[^a-z0-9]+/).some((word) => word === needle)) score = 28;
    else if (needle.length >= 5 && context.includes(needle)) score = 18;
  }
  if (score === 0 && (group === needle || (needle.length >= 6 && group.startsWith(needle)))) {
    score = 22;
  }
  if (score === 0 && (kindLabel === needle || kindLabel.startsWith(`${needle} `))) {
    score = 16;
  }
  return score;
}

export function filterSitemapSearchHits(
  hits: HtmlSitemapSearchHit[],
  query: string,
): HtmlSitemapSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return hits
    .map((item) => ({ item, score: searchScore(item, needle) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aIndex = SEARCH_GROUP_ORDER.indexOf(a.item.group as (typeof SEARCH_GROUP_ORDER)[number]);
      const bIndex = SEARCH_GROUP_ORDER.indexOf(b.item.group as (typeof SEARCH_GROUP_ORDER)[number]);
      if (aIndex !== -1 && bIndex !== -1 && aIndex !== bIndex) return aIndex - bIndex;
      return a.item.title.localeCompare(b.item.title);
    })
    .map((row) => row.item);
}

export function groupSitemapSearchHits(hits: HtmlSitemapSearchHit[]): HtmlSitemapSearchGroup[] {
  const buckets = new Map<string, HtmlSitemapSearchHit[]>();
  for (const item of hits) {
    const list = buckets.get(item.group) ?? [];
    list.push(item);
    buckets.set(item.group, list);
  }
  const groups: HtmlSitemapSearchGroup[] = [];
  for (const name of SEARCH_GROUP_ORDER) {
    const list = buckets.get(name);
    if (list?.length) groups.push({ group: name, hits: list });
    buckets.delete(name);
  }
  for (const [group, list] of buckets) {
    if (list.length) groups.push({ group, hits: list });
  }
  return groups;
}

export const filterHtmlSitemapSearchHits = filterSitemapSearchHits;
