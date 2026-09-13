import assert from 'node:assert/strict';
import { isGuideSubpage } from './paths';

assert.equal(isGuideSubpage('/guides'), false);
assert.equal(isGuideSubpage('/guides/'), false);
assert.equal(isGuideSubpage('/guides/ourdream-ai'), false);
assert.equal(isGuideSubpage('/guides/ourdream-ai/'), false);
assert.equal(isGuideSubpage('/guides/ourdream-ai-prompt'), true);
assert.equal(isGuideSubpage('/guides/ourdream-ai-prompt/'), true);
assert.equal(isGuideSubpage('/guides/preview'), true);
assert.equal(isGuideSubpage('/guides/preview?slug=x'), true);
assert.equal(isGuideSubpage('/reviews/ourdream-ai/'), false);

console.log('isGuideSubpage ok');
