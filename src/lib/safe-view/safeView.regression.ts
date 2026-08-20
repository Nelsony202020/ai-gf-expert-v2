import assert from 'node:assert/strict';
import {
  isReviewSafeView,
  reviewSlugFromPath,
  stripSafeViewSearch,
  titleFromReviewSlug,
} from './params';

assert.equal(reviewSlugFromPath('/reviews/candy-ai'), 'candy-ai');
assert.equal(reviewSlugFromPath('/reviews/candy-ai/'), 'candy-ai');
assert.equal(reviewSlugFromPath('/reviews/ourdream-ai?safe=1'), null);
assert.equal(reviewSlugFromPath('/reviews/preview/candy-ai/'), 'candy-ai');
assert.equal(reviewSlugFromPath('/reviews/'), null);
assert.equal(reviewSlugFromPath('/reviews/preview'), null);

assert.equal(isReviewSafeView(new URL('https://aigirlfriend.expert/reviews/candy-ai?safe=1')), true);
assert.equal(isReviewSafeView(new URL('https://aigirlfriend.expert/reviews/candy-ai/?safe=1')), true);
assert.equal(isReviewSafeView(new URL('https://aigirlfriend.expert/reviews/candy-ai?safe=1&utm_source=youtube')), true);
assert.equal(isReviewSafeView(new URL('https://aigirlfriend.expert/reviews/candy-ai')), false);
assert.equal(isReviewSafeView(new URL('https://aigirlfriend.expert/reviews/candy-ai?safe=true')), false);
assert.equal(isReviewSafeView(new URL('https://aigirlfriend.expert/best/ai-girlfriend?safe=1')), false);

assert.equal(stripSafeViewSearch('?safe=1'), '');
assert.equal(stripSafeViewSearch('?safe=1&utm_source=youtube'), '?utm_source=youtube');
assert.equal(stripSafeViewSearch('?utm_source=youtube&safe=1&utm_medium=desc'), '?utm_source=youtube&utm_medium=desc');

assert.equal(titleFromReviewSlug('candy-ai'), 'Candy AI Review');
assert.equal(titleFromReviewSlug('ourdream-ai'), 'Ourdream AI Review');

console.log('safe-view regression: ok');
