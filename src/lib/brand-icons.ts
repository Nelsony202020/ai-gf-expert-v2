/** Herman branded PNG paths — light variants include built-in circle artwork. */

export const brandIcons = {
  calling: {
    dark: '/brand/branded/branded-calling.png',
    light: '/brand/branded/branded-calling-light.png',
  },
  searching: {
    dark: '/brand/branded/branded-searching.png',
    light: '/brand/branded/branded-searching-light.png',
  },
  customization: {
    dark: '/brand/branded/branded-customization.png',
    light: '/brand/branded/branded-customization-light.png',
  },
  youtube: {
    dark: '/brand/herman-youtube-review.png',
    light: '/brand/branded/herman-youtube-review-light.png',
  },
  sfw: {
    dark: '/brand/branded/branded-sfw.png',
    light: '/brand/branded/branded-sfw-light.png',
  },
  nsfw: {
    dark: '/brand/branded/branded-nsfw.png',
    light: '/brand/branded/branded-nsfw-light.png',
  },
  scientist: {
    dark: '/brand/branded/herman-scientist.png',
    light: '/brand/branded/herman-scientist-light.png',
  },
} as const;

export type BrandIconKey = keyof typeof brandIcons;
