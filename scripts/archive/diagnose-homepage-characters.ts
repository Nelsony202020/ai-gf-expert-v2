import { loadFeaturedCharactersFromDb } from '../src/lib/homepage/featuredCharacters';
import { pickCharacterDisplayImage } from '../src/lib/characters/public';
import { inferMediaTypeFromUrl } from '../src/lib/media/url';

async function head(url: string | undefined): Promise<string> {
  if (!url) return 'empty';
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return `${r.status} ${r.headers.get('content-type') ?? ''}`;
  } catch (e) {
    return `ERR: ${String(e)}`;
  }
}

async function main() {
  const chars = await loadFeaturedCharactersFromDb();
  for (const c of chars ?? []) {
    const carouselThumb = pickCharacterDisplayImage(
      c.avatar,
      c.storySlides,
      'last-story-image',
      c.storyImageSlides,
    );
    const spotlight = pickCharacterDisplayImage(
      c.avatar,
      c.storySlides,
      'avatar-first',
      c.storyImageSlides,
    );
    console.log('---', c.name, '---');
    console.log('avatar HEAD:', await head(c.avatar));
    console.log('carousel (fixed) type:', inferMediaTypeFromUrl(carouselThumb), 'HEAD:', await head(carouselThumb));
    console.log('spotlight (fixed) type:', inferMediaTypeFromUrl(spotlight), 'HEAD:', await head(spotlight));
    console.log('storySlides:', c.storySlides?.length ?? 0);
    for (let i = 0; i < (c.storySlides?.length ?? 0); i++) {
      console.log(`  slide ${i}:`, await head(c.storySlides[i]));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
