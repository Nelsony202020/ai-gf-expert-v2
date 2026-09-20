/** Run: npx tsx scripts/test-prompt-vault-url-state.ts */
import assert from 'node:assert/strict';
import { parseVaultState, serializeVaultState } from '../src/lib/prompt-vault/url-state';

const known = new Set(['hair', 'face', 'hair-style-prompts']);
const cases: Array<[string, string]> = [
  ['', ''],
  ['?category=hair', '?category=hair'],
  ['?category=HAIR', '?category=hair'],
  ['?category=nope', ''],
  ['?category=', ''],
  ['?q=%20%20', ''],
  ['?q=blue%20%20hair', '?q=blue+hair'],
  ['?q=hair&category=face', '?category=face&q=hair'],
  ['?category=nope&q=x', '?q=x'],
  ['?utm_source=x&category=hair-style-prompts', '?category=hair-style-prompts&utm_source=x'],
  ['?utm_source=x&category=nope', '?utm_source=x'],
];
for (const [input, expected] of cases) {
  assert.equal(serializeVaultState(parseVaultState(input, known), input), expected, input);
}
console.log(`url-state: ${cases.length} cases OK`);
