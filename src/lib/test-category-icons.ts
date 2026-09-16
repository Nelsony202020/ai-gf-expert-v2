/** Canonical AIGE score-category icons — same mapping as HomeDesktopScore / HomeIcon. */

export const TEST_CATEGORY_ICON_NAME = {
  characters: 'users',
  customization: 'sliders',
  chat: 'chat',
  'chat-features': 'layers',
  images: 'image',
  video: 'video',
  privacy: 'shield',
  pricing: 'card',
} as const;

export type TestCategoryIconName = (typeof TEST_CATEGORY_ICON_NAME)[keyof typeof TEST_CATEGORY_ICON_NAME];

export function testCategoryIconName(slug: string): TestCategoryIconName {
  return TEST_CATEGORY_ICON_NAME[slug as keyof typeof TEST_CATEGORY_ICON_NAME] ?? 'users';
}
