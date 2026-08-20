import { canonicalPublicUrl } from '../siteOrigin';
import { renderSafeViewHtml } from './html';
import { reviewSlugFromPath, stripSafeViewSearch, titleFromReviewSlug } from './params';
import { safeReviewSocialImageUrl } from './socialImage';

export function safeViewResponse(url: URL): Response {
  const slug = reviewSlugFromPath(url.pathname) ?? 'review';
  const title = titleFromReviewSlug(slug);
  const html = renderSafeViewHtml({
    canonical: canonicalPublicUrl(`/reviews/${slug}/`),
    ogImage: safeReviewSocialImageUrl(),
    ogTitle: title,
    ogDescription: 'Independent, data-driven AI girlfriend app review from AI Girlfriend Expert.',
    continueHref: `${url.pathname}${stripSafeViewSearch(url.search)}${url.hash}`,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
