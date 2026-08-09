import type { MobileNavMode, BottomNavId } from './modes';

export type BottomNavItemType = 'link' | 'contents' | 'more';

export interface BottomNavItem {
  id: BottomNavId;
  label: string;
  icon: string;
  type: BottomNavItemType;
  href?: string;
}

const DISCOVERY_ITEMS: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: 'home', type: 'link', href: '/' },
  { id: 'reviews', label: 'Reviews', icon: 'rate_review', type: 'link', href: '/reviews/' },
  {
    id: 'best-apps',
    label: 'Best Apps',
    icon: 'emoji_events',
    type: 'link',
    href: '/best/ai-girlfriend/',
  },
  { id: 'testing', label: 'Testing', icon: 'science', type: 'link', href: '/test/' },
  { id: 'more', label: 'More', icon: 'more_horiz', type: 'more' },
];

const HUB_ITEMS: BottomNavItem[] = [
  {
    id: 'best-apps',
    label: 'Best Apps',
    icon: 'emoji_events',
    type: 'link',
    href: '/best/ai-girlfriend/',
  },
  {
    id: 'buying-guide',
    label: 'Buying Guide',
    icon: 'shopping_cart',
    type: 'link',
    href: '/guides/how-to-choose-an-ai-girlfriend-app/',
  },
  { id: 'contents', label: 'Contents', icon: 'menu', type: 'contents' },
  {
    id: 'how-we-test',
    label: 'Testing',
    icon: 'science',
    type: 'link',
    href: '/test/',
  },
  { id: 'more', label: 'More', icon: 'more_horiz', type: 'more' },
];

export function getBottomNavItems(mode: MobileNavMode): BottomNavItem[] {
  if (mode === 'hub') return HUB_ITEMS;
  return DISCOVERY_ITEMS;
}

export function getHubNavLayout(items: BottomNavItem[]) {
  const contents = items.find((item) => item.type === 'contents');
  const sideItems = items.filter((item) => item.type !== 'contents');
  const mid = Math.ceil(sideItems.length / 2);
  return {
    left: sideItems.slice(0, mid),
    center: contents ?? null,
    right: sideItems.slice(mid),
  };
}
