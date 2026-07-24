import { auraAiCategories } from '../data/aura-ai-categories';
import type { RatingCategory } from '../data/products';
import {
  testCategoryUrl,
  testContributorUrl,
  testSubscoreUrl,
  toSlug,
} from './slugs';

export interface TestContributorNode {
  label: string;
  slug: string;
  href: string;
}

export interface TestSubscoreNode {
  name: string;
  slug: string;
  description: string;
  href: string;
  contributors: TestContributorNode[];
}

export interface TestCategoryNode {
  key: string;
  name: string;
  weight: number;
  description: string;
  href: string;
  subscores: TestSubscoreNode[];
}

export function getTestCategories(): TestCategoryNode[] {
  return auraAiCategories.map((cat) => mapCategory(cat));
}

export function getTestCategory(categoryKey: string): TestCategoryNode | undefined {
  const cat = auraAiCategories.find((c) => c.key === categoryKey);
  return cat ? mapCategory(cat) : undefined;
}

export function findTestSubscore(categoryKey: string, subscoreSlug: string) {
  const category = getTestCategory(categoryKey);
  const sub = category?.subscores.find((s) => s.slug === subscoreSlug);
  if (!category || !sub) return undefined;

  const raw = auraAiCategories.find((c) => c.key === categoryKey);
  const rawSub = raw?.subscores.find((s) => toSlug(s.name) === subscoreSlug);

  return { category, sub, rawSub };
}

function mapCategory(cat: RatingCategory): TestCategoryNode {
  return {
    key: cat.key,
    name: cat.name,
    weight: cat.weight,
    description: cat.description,
    href: testCategoryUrl(cat.key),
    subscores: cat.subscores.map((sub) => ({
      name: sub.name,
      slug: toSlug(sub.name),
      description: sub.description,
      href: testSubscoreUrl(cat.key, sub.name),
      contributors: sub.contributors.map((c) => ({
        label: c.label,
        slug: toSlug(c.label),
        href: testContributorUrl(cat.key, sub.name, c.label),
      })),
    })),
  };
}
