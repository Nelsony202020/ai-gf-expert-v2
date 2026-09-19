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
 * `hqdefault` rather than `maxresdefault`: maxres only exists for videos
 * uploaded above 1280 wide, and when it is missing YouTube serves a grey
 * placeholder image rather than a 404, so the failure is silent and ugly.
 * hqdefault exists for every video.
 *
 * Not routed through the Bunny pull zone. That zone pulls from this site's own
 * origin, so it cannot proxy i.ytimg.com without a second zone — see
 * docs/article-system/parts/96-guide-video.md.
 */
export function youtubeThumbnail(video: GuideVideo): string {
  return video.thumbnail ?? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
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

/** `4-min`, for the header link. Undefined when the runtime is not known. */
export function videoLengthLabel(video: GuideVideo): string | undefined {
  if (!video.durationSeconds) return undefined;
  return `${Math.max(1, Math.round(video.durationSeconds / 60))}-min`;
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
