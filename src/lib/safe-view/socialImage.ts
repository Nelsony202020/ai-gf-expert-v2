import { cdnAsset } from '../media/cdn';
import { PRODUCTION_SITE_ORIGIN } from '../siteOrigin';

/** Safe branded social card — never a gallery, character, or review screenshot. */
export const SAFE_REVIEW_SOCIAL_IMAGE_PATH = '/brand/herman-youtube-review.png';

export function safeReviewSocialImageUrl(origin = PRODUCTION_SITE_ORIGIN): string {
  const src = cdnAsset(SAFE_REVIEW_SOCIAL_IMAGE_PATH);
  if (/^https?:\/\//i.test(src)) return src;
  return new URL(SAFE_REVIEW_SOCIAL_IMAGE_PATH, `${origin.replace(/\/$/, '')}/`).toString();
}
