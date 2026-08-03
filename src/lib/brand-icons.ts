/** Herman branded PNG paths — light variants include built-in circle artwork. */

import { cdnAsset } from './media/cdn';

function pair(dark: string, light: string) {
  return { dark: cdnAsset(dark), light: cdnAsset(light) };
}

export const brandIcons = {
  calling: pair('/brand/branded/branded-calling.png', '/brand/branded/branded-calling-light.png'),
  searching: pair('/brand/branded/branded-searching.png', '/brand/branded/branded-searching-light.png'),
  customization: pair('/brand/branded/branded-customization.png', '/brand/branded/branded-customization-light.png'),
  youtube: pair('/brand/herman-youtube-review.png', '/brand/branded/herman-youtube-review-light.png'),
  sfw: pair('/brand/branded/branded-sfw.png', '/brand/branded/branded-sfw-light.png'),
  nsfw: pair('/brand/branded/branded-nsfw.png', '/brand/branded/branded-nsfw-light.png'),
  scientist: pair('/brand/branded/herman-scientist.png', '/brand/branded/herman-scientist-light.png'),
} as const;

export type BrandIconKey = keyof typeof brandIcons;
