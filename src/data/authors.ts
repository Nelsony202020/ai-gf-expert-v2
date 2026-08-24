import { BRAND_SOCIAL } from './social-links';

export interface AuthorSocial {
  platform: string;
  url: string;
  icon: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'medium';
}

export interface AuthorEducation {
  period: string;
  title: string;
  detail?: string;
}

export interface AuthorSpecialty {
  title: string;
  body: string;
}

export interface AuthorPressItem {
  year: string;
  body: string;
}

export interface AuthorFeaturedLogo {
  name: string;
  logo: string;
}

export interface AuthorProfile {
  slug: string;
  name: string;
  title: string;
  avatar: string;
  /** Larger portrait for the author page hero */
  photo?: string;
  bio: string;
  /** Longer intro paragraphs for the author page */
  intro?: string[];
  email: string;
  profileUrl: string;
  socials: AuthorSocial[];
  education?: AuthorEducation[];
  specialties?: AuthorSpecialty[];
  workExperience?: string;
  pressAppearances?: AuthorPressItem[];
  featuredIn?: AuthorFeaturedLogo[];
  youtubeVideoId?: string;
  quote?: string;
  signature?: string;
}

const featuredPressLogos: AuthorFeaturedLogo[] = [
  { name: 'TechBullion', logo: '/authors/featured/techbullion.png' },
  { name: "There's An AI For That", logo: '/authors/featured/theres-an-ai-for-that.png' },
  { name: 'CBS', logo: '/authors/featured/cbs.png' },
  { name: 'Yahoo News', logo: '/authors/featured/yahoo-news.png' },
  { name: 'Newsweek', logo: '/authors/featured/newsweek.png' },
];

export const authors: Record<string, AuthorProfile> = {
  'herman-carter': {
    slug: 'herman-carter',
    name: 'Herman Carter',
    title: 'M.A. in AI Ethics & Society · CEO · Lead Tester',
    avatar: '/brand/herman-main-icon.webp',
    email: 'herman@aigirlfriend.expert',
    profileUrl: '/author/herman-carter/',
    bio: 'Herman Carter is one of the leading experts on AI girlfriends, having tested over 100 AI girlfriend apps and reviewed more than 50 on his blog and YouTube channel. With a Master’s in AI Ethics from Cambridge, Herman provides straightforward insights to help users find the right AI tools.',
    intro: [
      'Herman Carter is an expert on AI and dating apps, providing helpful advice and tips. Herman is the CEO, lead tester and face of AI Girlfriend Expert. He shares easy-to-follow guides to help readers navigate AI girlfriend apps with confidence.',
      'Herman also hosts a YouTube channel, @AI Girlfriend Expert, dedicated to helping viewers find the right AI girlfriend app for their needs. With a background in AI ethics from the University of Cambridge, Herman combines his expertise to promote responsible and transparent use of dating technology.',
    ],
    socials: [
      { platform: 'YouTube', url: BRAND_SOCIAL.youtube, icon: 'youtube' },
      {
        platform: 'Facebook',
        url: 'https://www.facebook.com/people/Herman-Carter/pfbid02r3BBKLcqwAkwMeC1QwAMYee2h2MaffuqgR8wzUcJpGjbmwdfmBsaueY9efGeFpfWl/',
        icon: 'facebook',
      },
      { platform: 'Instagram', url: BRAND_SOCIAL.instagram, icon: 'instagram' },
      { platform: 'TikTok', url: BRAND_SOCIAL.tiktok, icon: 'tiktok' },
      { platform: 'Medium', url: 'https://medium.com/@hermanjcarter', icon: 'medium' },
    ],
    featuredIn: featuredPressLogos,
    youtubeVideoId: 'UkvdCQ_qUcY',
    education: [
      {
        period: '2005–2009',
        title: 'Bachelor’s in Computer Science (Coursera)',
        detail: 'Courses: Introduction to AI, Programming Foundations, Data Structures',
      },
      {
        period: '2012–2014',
        title: 'Master’s in AI Ethics & Society, University of Cambridge',
        detail: 'Thesis: “Ethical Considerations in AI’s Influence on Dating and Relationships”',
      },
    ],
    specialties: [
      {
        title: 'AI and Ethics',
        body: 'Herman focuses on making AI in dating apps more ethical, helping developers create technology that respects user privacy and promotes fairness.',
      },
      {
        title: 'Tech Writing',
        body: 'He is known for his clear and engaging articles that simplify complex AI concepts for everyday tech fanatics.',
      },
    ],
    workExperience:
      'Herman is an AI geek and spends most of his time researching the latest AI tools and other technologies. He also likes online dating and thinks AI will play a great role in the dating market soon. Herman writes most of the AI girlfriend reviews and roundups on AI Girlfriend Expert.',
    pressAppearances: [
      {
        year: '2019',
        body: 'Featured in Men’s Journal, discussing how AI tools are transforming the modern dating landscape.',
      },
      {
        year: '2020',
        body: 'Interviewed on the AI Tomorrow Podcast about the future of AI in relationships and dating.',
      },
      {
        year: '2022',
        body: 'Appeared in TechCrunch, offering insights on the rise of AI-driven dating apps and their impact on online interactions.',
      },
    ],
    quote: 'Herman knows AI girlfriends so well, even his robot vacuum calls him “sweetheart”!',
    signature: '/authors/herman-signature.png',
  },

  ajit: {
    slug: 'ajit',
    name: 'Ajit',
    title: 'Developer & Team Leader',
    avatar: '/authors/ajit.png',
    email: 'ajit2042@gmail.com',
    profileUrl: '/author/ajit/',
    bio: 'Ajit is the main developer behind AI Girlfriend Expert, with a career focused on building top-notch websites. He ensures the site looks great and runs smoothly, always finding new ways to improve the user experience for readers.',
    intro: [
      'Ajit is a passionate and dedicated web developer from Sangli, India. His journey in web development began over a decade ago, during which he has cultivated a robust skill set and deep knowledge of modern web platforms.',
      'Ajit is the main developer behind AI Girlfriend Expert. He ensures the site looks great and runs smoothly, always finding new ways to improve the user experience for readers.',
    ],
    socials: [],
    featuredIn: featuredPressLogos,
    education: [
      {
        period: '2009–2012',
        title: 'Bachelor’s Degree in Computer Application',
        detail: 'Shivaji University, Kolhapur, India',
      },
    ],
    specialties: [
      {
        title: 'Web Development',
        body: 'Ajit specializes in building user-friendly, highly functional websites that meet modern web standards and provide seamless experiences for both administrators and visitors.',
      },
      {
        title: 'UI Systems & Editors',
        body: 'Among the tools Ajit uses, modern page builders and block-based editors stand out as specialties — used to ship polished, maintainable layouts quickly.',
      },
    ],
    workExperience:
      'Ajit’s work experience covers a wide range of projects, each of which has provided new insights and opportunities to sharpen his skills. He has worked with clients from various industries, helping them establish an online presence, improve their website functionality, and enhance their digital marketing efforts.',
  },
};

export function getAuthor(slug: string): AuthorProfile | undefined {
  return authors[slug];
}

export function getAllAuthors(): AuthorProfile[] {
  return Object.values(authors);
}
