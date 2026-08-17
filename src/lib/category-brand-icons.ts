import { getTooltipCategoryIcon } from './tooltip-category-icons-cdn';

/**
 * Rating-category branded icons used in score tooltips.
 * Delegates to the shared tooltip-category icon set.
 */
export function getCategoryBrandIcon(key: string): string | undefined {
  if (!key) return undefined;
  return getTooltipCategoryIcon(key);
}

export function getCategoryBrandIconLight(_key: string): string | undefined {
  return undefined;
}

export const categoryBrandIcons: Record<string, string> = {};
export const categoryBrandIconsLight: Record<string, string> = {};
