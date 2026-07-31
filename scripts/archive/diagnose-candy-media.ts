import { loadPublishedProductBySlug } from '../src/lib/content/store';
import { isUsablePublicMediaUrl } from '../src/lib/media/url';

async function head(url: string | undefined): Promise<string> {
  if (!url) return 'empty';
  if (!isUsablePublicMediaUrl(url)) return 'not-usable-public-url';
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return `${r.status} ${r.headers.get('content-type') ?? ''}`;
  } catch (e) {
    return `ERR: ${String(e)}`;
  }
}

async function main() {
  const product = await loadPublishedProductBySlug('candy-ai');
  if (!product) {
    console.log('NO PRODUCT');
    process.exit(1);
  }

  console.log('=== FEATURED ===');
  console.log(JSON.stringify(product.featuredImage, null, 2));

  console.log('=== HERO GALLERY (first 3) ===');
  console.log(JSON.stringify(product.heroGallery?.slice(0, 3), null, 2));

  console.log('=== MEDIA ITEMS sample (first 3) ===');
  console.log(JSON.stringify(product.mediaItems?.slice(0, 3), null, 2));

  console.log('=== CHARACTERS ===');
  for (const c of product.overview.characters.slice(0, 6)) {
    console.log({
      name: c.name,
      avatar: c.avatar?.slice(0, 140),
      hasAvatar: Boolean(c.avatar),
      usable: isUsablePublicMediaUrl(c.avatar ?? ''),
    });
  }

  console.log('=== HEAD checks ===');
  console.log('featured:', await head(product.featuredImage?.full));
  console.log('hero0:', await head(product.heroGallery?.[0]?.full));
  console.log('hero1:', await head(product.heroGallery?.[1]?.full));
  console.log('media0:', await head(product.mediaItems?.[0]?.src));
  console.log('char0:', await head(product.overview.characters[0]?.avatar));

  const brokenMedia = (product.mediaItems ?? []).filter((m) => !isUsablePublicMediaUrl(m.src));
  console.log('broken mediaItems count:', brokenMedia.length);

  const charsNoAvatar = product.overview.characters.filter((c) => !c.avatar);
  console.log('chars without avatar:', charsNoAvatar.map((c) => c.name));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
