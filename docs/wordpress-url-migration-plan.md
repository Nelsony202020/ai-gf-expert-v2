Implement this revised redirect and removal plan for the old WordPress URLs on aigirlfriend.expert. This version launches the new site without any live guide pages.

IMPORTANT IMPLEMENTATION RULES

1. Use permanent HTTP 301 redirects only where a replacement URL is listed.
2. A 410 entry must return HTTP 410 Gone. Do not redirect it to the homepage, a directory, or an unrelated page.
3. KEEP means the URL remains indexable at the same path and must return HTTP 200.
4. Every redirect must go directly to its final destination. Do not create redirect chains.
5. Preserve query parameters only when they are still useful, but never allow them to change the destination path.
6. Remove every 301 and 410 source URL from the XML sitemap.
7. Include only KEEP URLs and final destination URLs in the XML sitemap.
8. Update all internal links so they point directly to final URLs instead of old redirecting URLs.
9. Keep redirects active indefinitely because many old pages have backlinks.
10. Before deployment, validate that there are no redirect loops, no destination 404s, and no accidental soft 404s.
11. Treat paths as case-sensitive only where the framework requires it, but normalize trailing slashes consistently.
12. The target paths below assume these canonical routes exist. Create or confirm each target before activating its redirect.


LAUNCH POLICY FOR OLD GUIDES

- The new site launches without a Guides section.
- Any old guide that has no close replacement must return HTTP 410 Gone.
- Do not redirect outdated tutorials to the homepage, the roundup, or a loosely related review.
- Keep a 301 only where the old guide intent is directly covered by a current review section or the current testing methodology.
- The old `/guides/` hub must return HTTP 410 Gone and must not appear in navigation or the XML sitemap.
- A removed guide can be published again later as a new page. Do not remove its 410 until the replacement is ready and a deliberate redirect decision has been made.

FULL URL PLAN

| Old URL | Action | Destination | Reason |
| --- | --- | --- | --- |
| `https://aigirlfriend.expert/blog-archive/` | **410** | `—` | Remove obsolete archive. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/rprp-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/rprp-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/candy-ai-best-characters/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-nsfw-ai-chat/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/spicychat-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/spicychat-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-waifu-chatbot/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-nsfw-character-ai-alternatives/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-girlfriend-with-voice/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-girl-generator/` | **410** | `—` | Different search intent; no close replacement. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-girlfriend-with-pictures/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-girlfriend-porn/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-girlfriend-nudes/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-sexting-app/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-futanari-ai-chat/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-furry-ai-chat/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-girlfriendgpt-alternative/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/nectar-ai-alternative/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/dreamgf-ai-alternative/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/kupid-ai-alternative/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/candy-ai-alternative/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/muah-ai-alternative/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-free-ai-girlfriend/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-roleplay-ai/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-romantic-ai-girlfriend/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-girlfriend-with-video/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/ai-girlfriend-with-best-memory/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-girlfriend-for-lesbian/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-spicychat-ai-alternative/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-crushon-ai-alternative/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-boyfriend/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-yaoi/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/best-ai-girlfriend/best-ai-kissing-video-generator/` | **410** | `—` | Different search intent; no close replacement. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/dreamgf-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/dreamgf-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/kindroid-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/kindroid-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/pephop-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/pephop-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/candy-ai-pricing/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#pricing` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/best-candy-ai-prompts/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/girlfriendgpt-pricing/` | **301** | `https://aigirlfriend.expert/reviews/girlfriendgpt/#pricing` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-girlfriendgpt/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-kupid-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-nectar-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-character-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-replika-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-crushon-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-muah-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-fantasygf-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/crushon-ai-vs-girlfriendgpt/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/muah-ai-vs-character-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/kindroid-ai-vs-replika-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/kindroid-ai-vs-character-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/kindroid-ai-vs-candy-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/candy-ai-vs-dreamgf-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/character-ai-vs-crushon-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/character-ai-vs-replika-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/character-ai-vs-spicychat-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/crushon-ai-vs-pephop-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/muah-ai-vs-replika-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/pephop-ai-vs-character-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/nastia-ai-vs-replika-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/muah-ai-vs-spicychat-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/dreamgf-ai-vs-kindroid-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/dreamgf-ai-vs-replika-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/kupid-ai-vs-replika-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/muah-ai-vs-dreamgf-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/muah-ai-vs-crushon-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/muah-ai-vs-kindroid-ai/` | **410** | `—` | No equivalent comparison page; do not redirect to one product review. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/futurematch-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/futurematch-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/onlychar-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/onlychar-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/how-we-test-score-ai-girlfriend-apps/` | **301** | `https://aigirlfriend.expert/test/` | Move old methodology guide to current testing methodology. |
| `https://aigirlfriend.expert/guides/is-pephop-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/pephop-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/girlfriendgpt-review/` | **301** | `https://aigirlfriend.expert/reviews/girlfriendgpt/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/character-ai-tips-and-tricks/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-unlimited/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/fantasygf-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/fantasygf-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/does-candy-ai-do-videos/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#photos-and-videos` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/best-ai-girlfriend/most-realistic-ai-girlfriend/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/guides/ai-roleplay/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/romantic-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/romantic-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/muah-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/muah-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/character-ai-ooc-guide/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/amouranth-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/amouranth-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/nastia-ai-advanced-traits/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-candy-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/nectar-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/nectar-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/is-gpt-girlfriend-worth-it/` | **301** | `https://aigirlfriend.expert/reviews/girlfriendgpt/#review` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/candy-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/ai-girlfriend-names/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/kupid-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/kupid-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/ai-charfriend-review/` | **301** | `https://aigirlfriend.expert/reviews/ai-charfriend/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-good/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/crushon-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/can-crushon-ai-see-your-chats/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/how-to-get-crushon-ai-unlimited-messages/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-crushon-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/how-to-enable-crushon-ai-hidden-content/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-crushon-ai-good/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#review` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/how-to-use-crushon-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/crushon-ai-models/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/tools/nsfw-prompt-generator-tool/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/guides/how-to-make-a-bot-on-spicychat-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/candy-ai-tips-and-tricks/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-nsfw-ai-legal/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/how-to-create-characters-on-girlfriendgpt/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/how-to-import-character-ai-to-spicychat-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/does-character-ai-allow-nsfw/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/character-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/character-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/can-spicychat-ai-read-your-messages/` | **301** | `https://aigirlfriend.expert/reviews/spicychat-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/moescape-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/moescape-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/ehentai-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/ehentai-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/is-nastia-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/nastia-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/is-fantasygf-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/fantasygf-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/dreamgf-pricing/` | **301** | `https://aigirlfriend.expert/reviews/dreamgf-ai/#pricing` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/muah-ai-commands/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/how-to-use-muah-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/muah-ai-tips/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/what-is-muah-ai/` | **301** | `https://aigirlfriend.expert/reviews/muah-ai/#overview` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/muah-ai-generator/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-muah-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/muah-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/muah-ai-prompts/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-muah-ai-private/` | **301** | `https://aigirlfriend.expert/reviews/muah-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/nastia-ai-review/` | **301** | `https://aigirlfriend.expert/reviews/nastia-ai/` | Move old review to the new canonical review URL. |
| `https://aigirlfriend.expert/guides/is-kupid-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/kupid-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/kupid-ai-pricing/` | **301** | `https://aigirlfriend.expert/reviews/kupid-ai/#pricing` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/best-ai-girlfriend/most-advanced-ai-girlfriend/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/guides/is-nectar-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/nectar-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/nectar-ai-fantasy/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/nectar-ai-pricing/` | **301** | `https://aigirlfriend.expert/reviews/nectar-ai/#pricing` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/how-to-use-nectar-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/nectar-ai-tips-and-tricks/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/how-to-use-nectar-ai-image-generator/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/how-to-roleplay-on-nectar-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/how-to-create-characters-in-nectar-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/nectar-ai-how-to-cancel-subscription/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/can-character-ai-ban-you/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/are-character-ai-chats-real/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/beta-character-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/how-to-roleplay-on-character-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-character-ai-safe/` | **301** | `https://aigirlfriend.expert/reviews/character-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/best-ai-girlfriend/how-do-we-choose-best-ai-girlfriend-apps/` | **301** | `https://aigirlfriend.expert/test/` | Methodology intent. |
| `https://aigirlfriend.expert/guides/ai-girlfriend-statistics/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/what-are-tokens-in-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/ai-sex-bot-statistics/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-candy-ai-worth-it/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#review` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/best-ai-girlfriend/most-interactive-ai-girlfriend/` | **301** | `https://aigirlfriend.expert/best-ai-girlfriend/` | Consolidate into the surviving roundup. |
| `https://aigirlfriend.expert/guides/how-to-use-candy-ai/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-gpt-girlfriend-safe/` | **301** | `https://aigirlfriend.expert/reviews/girlfriendgpt/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/girlfriendgpt-content-policy/` | **301** | `https://aigirlfriend.expert/reviews/girlfriendgpt/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/girlfriendgpt-image-generator-tips/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/how-to-use-girlfriendgpt/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/girlfriendgpt-character-templates/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/girlfriendgpt-how-to-cancel-subscription/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/girlfriendgpt-tips-and-tricks/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/girlfriendgpt-character-creation-guide/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/is-candy-ai-safe-to-pay/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/what-is-candy-ai/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#overview` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/candy-ai-how-to-cancel-subscription/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/can-candy-ai-see-your-chats/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/candy-ai-content-policy/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#privacy` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/guides/is-candy-ai-real/` | **410** | `—` | Remove outdated guide from launch; no close current replacement. |
| `https://aigirlfriend.expert/guides/what-are-tokens-used-for-in-candy-ai/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#pricing` | Consolidate overlapping product information into the review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/how-to-invite-friends-on-crushon-ai/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/is-crushon-ai-legit/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#privacy` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/nectar-ai-faqs/who-is-nectar-ai-ceo/` | **301** | `https://aigirlfriend.expert/reviews/nectar-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/nectar-ai-faqs/is-nectar-ai-free/` | **301** | `https://aigirlfriend.expert/reviews/nectar-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/girlfriendgpt-faqs/is-girlfriendgpt-free/` | **301** | `https://aigirlfriend.expert/reviews/girlfriendgpt/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/how-does-candy-ai-work/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/is-crushon-ai-on-google-play/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#overview` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/why-cant-i-send-messages-on-crushon-ai/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/is-crushon-ai-private/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#privacy` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/can-crushon-ai-send-pictures/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#photos-and-videos` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/is-crushon-ai-free/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/what-is-crushon-ai/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/kupid-ai-faqs/is-kupid-ai-good/` | **301** | `https://aigirlfriend.expert/reviews/kupid-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/kupid-ai-faqs/is-kupid-ai-free/` | **301** | `https://aigirlfriend.expert/reviews/kupid-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/kupid-ai-faqs/who-owns-kupid-ai/` | **301** | `https://aigirlfriend.expert/reviews/kupid-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/kupid-ai-faqs/what-is-kupid-ai/` | **301** | `https://aigirlfriend.expert/reviews/kupid-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-premium-worth-it/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-free/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/nastia-ai-faqs/nastia-ai-delete-account/` | **301** | `https://aigirlfriend.expert/reviews/nastia-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/nastia-ai-faqs/is-nastia-ai-free/` | **301** | `https://aigirlfriend.expert/reviews/nastia-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/nastia-ai-faqs/is-nastia-ai-good/` | **301** | `https://aigirlfriend.expert/reviews/nastia-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/does-candy-ai-have-unlimited-messages/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/does-candy-ai-have-an-app/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#overview` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/what-is-candy-ai-used-for/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-unfiltered/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-a-virus/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#privacy` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-secure/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#privacy` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/how-much-is-candy-ai/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#pricing` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-on-android/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#overview` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-the-best/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#review` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/is-candy-ai-trustworthy/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/#privacy` | Answer is covered by the consolidated product review. |
| `https://aigirlfriend.expert/our-partners/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/ai-girlfriend-quiz/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/careers/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/herman-carter/` | **301** | `https://aigirlfriend.expert/author/herman-carter/` | Use one canonical author page. |
| `https://aigirlfriend.expert/editorial-process/` | **301** | `https://aigirlfriend.expert/editorial-guidelines/` | Move to current editorial policy page. |
| `https://aigirlfriend.expert/about/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/contact/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/terms-of-service/privacy-policy/` | **301** | `https://aigirlfriend.expert/privacy-policy/` | Use clean legal URL. |
| `https://aigirlfriend.expert/terms-of-service/` | **301** | `https://aigirlfriend.expert/terms/` | Use clean legal URL. |
| `https://aigirlfriend.expert/sitemap/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/terms-of-service/accessibility/` | **301** | `https://aigirlfriend.expert/accessibility/` | Use clean legal URL. |
| `https://aigirlfriend.expert/terms-of-service/affiliate-disclosure/` | **301** | `https://aigirlfriend.expert/affiliate-disclosure/` | Use clean legal URL. |
| `https://aigirlfriend.expert/guides/` | **410** | `—` | Remove the old Guides hub because the new site launches without guides. |
| `https://aigirlfriend.expert/ai-girlfriend-comparison/` | **410** | `—` | Remove comparison hub because comparisons are being retired. |
| `https://aigirlfriend.expert/faqs/` | **410** | `—` | Remove the old standalone FAQ archive. |
| `https://aigirlfriend.expert/faqs/candy-ai-faqs/` | **301** | `https://aigirlfriend.expert/reviews/candy-ai/` | Consolidate product FAQs into the product review. |
| `https://aigirlfriend.expert/best-ai-girlfriend/` | **KEEP** | `—` | Keep as the only roundup. |
| `https://aigirlfriend.expert/ai-girlfriend-reviews/` | **301** | `https://aigirlfriend.expert/reviews/` | Move old review archive to new reviews directory. |
| `https://aigirlfriend.expert/tools/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/faqs/nastia-ai-faqs/` | **301** | `https://aigirlfriend.expert/reviews/nastia-ai/` | Consolidate product FAQs into the product review. |
| `https://aigirlfriend.expert/faqs/girlfriendgpt-faqs/` | **301** | `https://aigirlfriend.expert/reviews/girlfriendgpt/` | Consolidate product FAQs into the product review. |
| `https://aigirlfriend.expert/faqs/kupid-ai-faqs/` | **301** | `https://aigirlfriend.expert/reviews/kupid-ai/` | Consolidate product FAQs into the product review. |
| `https://aigirlfriend.expert/faqs/crushon-ai-faqs/` | **301** | `https://aigirlfriend.expert/reviews/crushon-ai/` | Consolidate product FAQs into the product review. |
| `https://aigirlfriend.expert/faqs/nectar-ai-faqs/` | **301** | `https://aigirlfriend.expert/reviews/nectar-ai/` | Consolidate product FAQs into the product review. |
| `https://aigirlfriend.expert/author/herman-carter/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/author/evander/` | **KEEP** | `—` | Keep at the same URL. |
| `https://aigirlfriend.expert/author/sean-russell/` | **410** | `—` | Remove retired author page unless content still credits this author. |

POST-DEPLOYMENT CHECKS

- Crawl all old URLs and confirm every row returns the intended 200, 301, or 410 status.
- Confirm every 301 resolves in one hop.
- Confirm no 410 URL remains in the sitemap.
- Confirm canonical tags on destination pages are self-referencing.
- Submit the updated sitemap in Google Search Console.
- Review Google Search Console weekly for unexpected 404s, redirect errors, and soft 404s.
- Keep a copy of this mapping in the repository as the permanent migration record.
