import { GUIDES, type GuideVideo } from '../../data/guides';

/**
 * Everything the guide video needs, in one place.
 *
 * The lookup goes through `getGuideVideo` so the source of the data is a single
 * line to change. It reads the guide registry today; moving it to InstantDB
 * means changing this function and nothing else, because no component ever
 * reaches for the registry itself.
 *
 * All of it runs at build time — the guide routes are pre-rendered and none of
 * these helpers touch `window` or any request.
 */

export type { GuideVideo };

/** The video for a guide slug, or undefined when that guide has none. */
export function getGuideVideo(slug: string): GuideVideo | undefined {
  return GUIDES.find((guide) => guide.slug === slug)?.video;
}

/**
 * The poster.
 *
 * `maxresdefault` (1280x720) because the block is 740 wide on desktop and
 * hqdefault is 480x360 — soft when stretched, and 4:3 so it has to be cropped
 * to fit the 16:9 frame.
 *
 * maxres only exists for videos uploaded above 1280 wide, and when it is
 * missing YouTube serves a grey placeholder rather than a 404, so the failure
 * is silent. The block therefore ships an onerror swap to hqdefault, which
 * exists for every video; a guide can also pin its own `thumbnail`.
 *
 * Not routed through the Bunny pull zone. That zone pulls from this site's own
 * origin, so it cannot proxy i.ytimg.com without a second zone — see
 * docs/article-system/parts/96-guide-video.md.
 */
export function youtubeThumbnail(video: GuideVideo): string {
  return video.thumbnail ?? `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`;
}

/** Always-present poster, used when maxresdefault turns out to be missing. */
export function youtubeThumbnailFallback(video: GuideVideo): string {
  return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
}

/** Tags that never carry a closing tag, so they never change nesting depth. */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Where the video block goes in a guide body, or -1 for "nowhere sensible".
 *
 * The brief's rule is: after the opening paragraph, before the first H2. Most
 * guides open with a paragraph or two and then their first heading, so the
 * slot is simply the first H2.
 *
 * The comics guide does not: its standfirst lives in the hero and the body
 * opens straight onto the H2. There the slot is the END of that opening
 * section — the position immediately before the next `<h2>` or `<h3>`.
 *
 * Landing after the section's first paragraph (what this did before) split a
 * three-paragraph section down the middle and pushed the rest of its own
 * argument below a video. Sitting at the section's end, the block reads as the
 * recap of what was just explained and the next heading starts clean.
 *
 * The returned index is always a position between two DIRECT children of the
 * prose container. Anchoring inside a nested block is how a figure once ended
 * up as a stray grid item inside a two-column card.
 *
 * Fallback: a first section that runs to the end of the article has no next
 * heading to sit before, so the old end-of-first-paragraph position is used
 * rather than dropping the video off the bottom of the page.
 */
export function videoSlotIndex(bodyHtml: string): number {
  const h2 = bodyHtml.search(/<h2[\s>]/i);
  if (h2 < 0) return -1;
  if (bodyHtml.slice(0, h2).trim() !== '') return h2;

  // Start scanning INSIDE the first H2, at depth 1, so its own opening tag is
  // not mistaken for the heading that ends the section.
  const openTagEnd = bodyHtml.indexOf('>', h2);
  if (openTagEnd < 0) return -1;

  const tag = /<(\/?)([a-zA-Z0-9]+)([^>]*)>/g;
  tag.lastIndex = openTagEnd + 1;
  let depth = 1;
  let firstParagraphEnd = -1;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(bodyHtml)) !== null) {
    const closing = match[1] === '/';
    const name = match[2].toLowerCase();
    if (VOID_TAGS.has(name) || match[3].trimEnd().endsWith('/')) continue;
    if (closing) {
      depth -= 1;
      if (depth === 0 && name === 'p' && firstParagraphEnd < 0) {
        firstParagraphEnd = tag.lastIndex;
      }
      if (depth < 0) return -1;
    } else {
      // A heading that opens at the top level ends the opening section.
      // match.index, not lastIndex: the slot is before the heading's `<`.
      if (depth === 0 && (name === 'h2' || name === 'h3')) return match.index;
      depth += 1;
    }
  }
  return firstParagraphEnd;
}

/** Player URL. `autoplay` is set only on the click that injects the iframe. */
export function youtubeEmbedUrl(video: GuideVideo, options: { autoplay?: boolean } = {}): string {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
  if (options.autoplay) params.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?${params.toString()}`;
}

export function youtubeWatchUrl(video: GuideVideo): string {
  return `https://www.youtube.com/watch?v=${video.youtubeId}`;
}

/**
 * `5:36` — the exact runtime, for the pill on the thumbnail.
 *
 * Exact, not rounded: this sits where every video player puts its duration, and
 * a rounded "6-min" on a 5:36 video is simply wrong. Hours are rendered as
 * `1:02:09`, matching the same convention.
 *
 * Undefined when the runtime is not known, and the pill is then not rendered.
 */
export function videoLengthLabel(video: GuideVideo): string | undefined {
  if (!video.durationSeconds) return undefined;
  const total = Math.max(0, Math.round(video.durationSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** `PT4M37S`. Undefined when the runtime is not known. */
export function isoDuration(video: GuideVideo): string | undefined {
  if (!video.durationSeconds) return undefined;
  const total = Math.round(video.durationSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `PT${minutes ? `${minutes}M` : ''}${seconds || !minutes ? `${seconds}S` : ''}`;
}

/**
 * VideoObject JSON-LD, or null.
 *
 * Null whenever a required field is missing. Google treats VideoObject without
 * `uploadDate` or `duration` as incomplete, and a half-filled entry is worse
 * for the page than no entry, so this returns nothing rather than something
 * empty.
 */
export function videoObjectSchema(
  video: GuideVideo,
  pageUrl: string,
): Record<string, unknown> | null {
  const duration = isoDuration(video);
  if (!video.description || !video.uploadDate || !duration) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: [youtubeThumbnail(video)],
    uploadDate: video.uploadDate,
    duration,
    embedUrl: youtubeEmbedUrl(video),
    contentUrl: youtubeWatchUrl(video),
    url: pageUrl,
  };
}
