export type MediaFilter = 'all' | 'proof' | 'characters' | 'image-generator' | 'gallery';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumb: string;
  alt: string;
  caption: string;
  filter: Exclude<MediaFilter, 'all'>;
  nsfw?: boolean;
}

export interface FeaturedReviewVideo {
  youtubeId: string;
  title: string;
  description: string;
}

const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const auraAiFeaturedVideo: FeaturedReviewVideo = {
  youtubeId: 'dQw4w9WgXcQ',
  title: 'Aura AI — Full Video Review',
  description: 'Watch our hands-on walkthrough of chat, characters, image generation, and privacy.',
};

export const auraAiMediaGallery: MediaItem[] = [
  {
    id: 'gallery-1',
    type: 'image',
    src: img('aura-hero', 1280, 720),
    thumb: img('aura-hero', 400, 300),
    alt: 'Aura AI home screen',
    caption: 'Main dashboard',
    filter: 'gallery',
  },
  {
    id: 'gallery-2',
    type: 'image',
    src: img('aura-char-ui', 1280, 720),
    thumb: img('aura-char-ui', 400, 300),
    alt: 'Character library',
    caption: 'Character library browse',
    filter: 'characters',
  },
  {
    id: 'gallery-3',
    type: 'image',
    src: img('aura-chat-ui', 1280, 720),
    thumb: img('aura-chat-ui', 400, 300),
    alt: 'Chat interface',
    caption: 'Chat interface',
    filter: 'gallery',
  },
  {
    id: 'proof-char-lib',
    type: 'image',
    src: img('char-lib', 900, 1200),
    thumb: img('char-lib', 400, 300),
    alt: 'Character library proof',
    caption: 'Character Library',
    filter: 'proof',
  },
  {
    id: 'proof-filters',
    type: 'image',
    src: img('char-filters', 900, 1200),
    thumb: img('char-filters', 400, 300),
    alt: 'Filter panel proof',
    caption: 'Discovery filters',
    filter: 'proof',
  },
  {
    id: 'proof-browse',
    type: 'video',
    src: img('char-browse-vid', 900, 1200),
    thumb: img('char-browse', 400, 300),
    alt: 'Browsing test recording',
    caption: 'Browsing test (video)',
    filter: 'proof',
  },
  {
    id: 'img-gen-1',
    type: 'image',
    src: img('img-gen-safe', 900, 1200),
    thumb: img('img-gen-safe', 400, 300),
    alt: 'Image generator output',
    caption: 'Image generator — portrait',
    filter: 'image-generator',
  },
  {
    id: 'img-gen-2',
    type: 'image',
    src: img('img-gen-style', 900, 1200),
    thumb: img('img-gen-style', 400, 300),
    alt: 'Anime style generation',
    caption: 'Image generator — anime style',
    filter: 'image-generator',
  },
  {
    id: 'img-gen-nsfw',
    type: 'image',
    src: img('img-gen-nsfw', 900, 1200),
    thumb: img('img-gen-nsfw', 400, 300),
    alt: 'NSFW generation sample',
    caption: 'Image generator — mature content',
    filter: 'image-generator',
    nsfw: true,
  },
  {
    id: 'char-nsfw',
    type: 'image',
    src: img('char-mature', 900, 1200),
    thumb: img('char-mature', 400, 300),
    alt: 'Mature character preview',
    caption: 'Character preview — 18+',
    filter: 'characters',
    nsfw: true,
  },
];
