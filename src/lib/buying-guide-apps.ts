import type { BuyingGuideUserType } from '../data/buying-guide-content';
import { aiGirlfriendRoundup } from '../data/roundups/ai-girlfriend';
import { loadProductLogoMap } from './content/store';
import { toSlug } from './slugs';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/128/128`;

export interface GuideAppExample {
  name: string;
  slug: string;
  logo: string;
}

export interface EnrichedBuyingGuideUserType extends BuyingGuideUserType {
  resolvedExamples: GuideAppExample[];
}

function findRoundupPick(name: string) {
  const normalized = name.trim().toLowerCase();
  const slug = toSlug(name);
  return aiGirlfriendRoundup.picks.find(
    (pick) => pick.name.toLowerCase() === normalized || pick.slug === slug,
  );
}

export function resolveGuideAppExample(name: string, logoMap: Map<string, string>): GuideAppExample {
  const pick = findRoundupPick(name);
  const slug = pick?.slug ?? toSlug(name);
  const dbLogo = logoMap.get(slug) ?? logoMap.get(name.trim().toLowerCase());
  const logo = pick?.logo ?? dbLogo ?? img(`${slug}-logo`);

  return {
    name: pick?.name ?? name,
    slug,
    logo,
  };
}

export async function enrichBuyingGuideUserTypes(
  types: BuyingGuideUserType[],
): Promise<EnrichedBuyingGuideUserType[]> {
  const logoMap = await loadProductLogoMap();

  return types.map((userType) => ({
    ...userType,
    resolvedExamples: userType.examples.map((name) => resolveGuideAppExample(name, logoMap)),
  }));
}
