export interface AuthorSocial {
  platform: string;
  url: string;
  icon: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'medium';
}

export interface AuthorProfile {
  slug: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  email: string;
  profileUrl: string;
  socials: AuthorSocial[];
}

export const authors: Record<string, AuthorProfile> = {
  'herman-carter': {
    slug: 'herman-carter',
    name: 'Herman Carter',
    title: 'M.A. AI Ethics & Society · CEO · Lead Tester',
    avatar: '/brand/herman-main-icon.svg',
    email: 'herman@aigirlfriend.expert',
    profileUrl: '/author/herman-carter',
    bio: 'Herman Carter is one of the leading experts on AI girlfriends, having tested over 100 AI companion apps and reviewed more than 50 on his blog and YouTube channel. With a Master\'s in AI Ethics from Cambridge, he provides straightforward insights to help users find the right tools.',
    socials: [
      { platform: 'YouTube', url: 'https://www.youtube.com/@ai-girlfriend-expert', icon: 'youtube' },
      { platform: 'Facebook', url: 'https://www.facebook.com/people/Herman-Carter/pfbid02r3BBKLcqwAkwMeC1QwAMYee2h2MaffuqgR8wzUcJpGjbmwdfmBsaueY9efGeFpfWl/', icon: 'facebook' },
      { platform: 'Instagram', url: 'https://www.instagram.com/hermancarter271/', icon: 'instagram' },
      { platform: 'TikTok', url: 'https://www.tiktok.com/@ai_girlfriend_expert', icon: 'tiktok' },
      { platform: 'Medium', url: 'https://medium.com/@hermanjcarter', icon: 'medium' },
    ],
  },
};

export function getAuthor(slug: string): AuthorProfile | undefined {
  return authors[slug];
}
