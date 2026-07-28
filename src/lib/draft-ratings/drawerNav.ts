import type { DraftCategory } from './types';

export interface DrawerNav {
  prevDrawerId?: string;
  prevLabel?: string;
  nextDrawerId?: string;
  nextLabel?: string;
}

/** Depth-first drawer chain: subscore calc → evidence categories → next subscore calc → … */
export function buildDrawerNavChain(categories: DraftCategory[]): Map<string, DrawerNav> {
  const navById = new Map<string, DrawerNav>();

  for (const cat of categories) {
    const chain: { id: string; label: string }[] = [];
    for (const sub of cat.subscores) {
      chain.push({
        id: `subscore-calc-${cat.slug}-${sub.slug}`,
        label: sub.name,
      });
      for (const ec of sub.evidenceCategories) {
        chain.push({ id: ec.drawerId, label: ec.name });
      }
    }
    for (let i = 0; i < chain.length; i++) {
      navById.set(chain[i].id, {
        prevDrawerId: chain[i - 1]?.id,
        prevLabel: chain[i - 1]?.label,
        nextDrawerId: chain[i + 1]?.id,
        nextLabel: chain[i + 1]?.label,
      });
    }
  }

  return navById;
}
