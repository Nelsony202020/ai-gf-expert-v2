export interface HubTab {
  id: string;
  label: string;
  mobileLabel?: string;
  href: string;
  icon: string;
}

export type HubTabId = 'best-apps' | 'buying-guide' | 'how-we-test';

export const HUB_NAV_TABS: HubTab[] = [
  { id: 'best-apps', label: 'Best apps', href: '/best/ai-girlfriend', icon: 'emoji_events' },
  {
    id: 'buying-guide',
    label: 'Buying guide',
    href: '/guides/how-to-choose-an-ai-girlfriend-app',
    icon: 'shopping_cart',
  },
  {
    id: 'how-we-test',
    label: 'How we test',
    mobileLabel: 'Testing',
    href: '/test/',
    icon: 'science',
  },
];
