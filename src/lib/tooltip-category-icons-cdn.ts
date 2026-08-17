/** CDN-resolved tooltip category icons — server / Astro only (uses node env via cdnAsset). */

import { cdnAsset } from './media/cdn';
import {
  TOOLTIP_CATEGORY_ICON_FILES,
  getTooltipCategoryIconLocal,
  normalizeTooltipCategoryKey,
  type TooltipCategoryKey,
} from './tooltip-category-icons';

export function getTooltipCategoryIcon(category?: string | null): string {
  return cdnAsset(getTooltipCategoryIconLocal(category));
}

/** Precomputed CDN map keyed by rating category slug. */
export const tooltipCategoryIconsByKey: Record<string, string> = Object.fromEntries(
  (Object.keys(TOOLTIP_CATEGORY_ICON_FILES) as TooltipCategoryKey[]).map((key) => [
    key,
    cdnAsset(TOOLTIP_CATEGORY_ICON_FILES[key]),
  ]),
);

export { normalizeTooltipCategoryKey };
