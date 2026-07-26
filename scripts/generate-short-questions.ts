#!/usr/bin/env npx tsx
// Generates src/components/admin/testing/shortQuestions.ts from methodology seed
// data. Labels are short but include category context so testers know what area
// they are in (Characters vs Creator vs Chat, etc.).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface Item {
  category: string;
  slug: string;
  name: string;
  pub?: string;
  mt?: string;
  instr: string[];
}

const CHARS = 25;
const CHATS = 5;
const REPLIES = 100; // 5 chats × 20 replies

const raw = readFileSync(resolve(process.cwd(), 'scripts/seed/methodology-data.ts'), 'utf8');
const items: Item[] = [];
let cur: Partial<Item> | null = null;
for (const line of raw.split('\n')) {
  let m: RegExpMatchArray | null;
  if ((m = line.match(/^\s*category: '([^']+)'/))) {
    cur = { category: m[1], instr: [] };
    continue;
  }
  if ((m = line.match(/^\s*slug: '([^']+)'/))) {
    if (cur) cur.slug = m[1];
    continue;
  }
  if ((m = line.match(/^\s*name: '([^']+)'/))) {
    if (cur) cur.name = m[1];
    continue;
  }
  if ((m = line.match(/^\s*publicDescription: '([^']+)'/))) {
    if (cur) cur.pub = m[1];
    continue;
  }
  if ((m = line.match(/^\s*measurementType: '([^']+)'/))) {
    if (cur) cur.mt = m[1];
    continue;
  }
  if ((m = line.match(/^\s*internalInstructions: '([^']*(?:\\'[^']*)*)'/))) {
    if (cur?.slug) {
      cur.instr = m[1]
        .replace(/\\n/g, '\n')
        .split('\n')
        .map((s) => s.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)/, '').trim())
        .filter(Boolean);
      items.push(cur as Item);
      cur = null;
    }
  }
}

/** Category prefix so labels stay clear when jumping between sections. */
const CAT: Record<string, string> = {
  characters: 'Characters',
  customization: 'Creator',
  chat: 'Chat',
  'chat-features': 'Chat',
  images: 'Images',
  video: 'Video',
  pricing: 'Pricing',
  privacy: 'Privacy',
};

/** Hand-tuned [label, hint]. Key = "category|slug". */
const CUSTOM: Record<string, [string, string]> = {
  // — Characters —
  'characters|amount': ['Characters: how many total?', 'Count every ready-made character in the library.'],
  'characters|styles': ['Characters: which art styles?', 'Tick each style offered (realistic, anime, 2D, etc.).'],
  'characters|genders': ['Characters: which genders?', 'Tick each gender option in the library.'],
  'characters|ethnicities': ['Characters: which ethnicities?', 'Tick each ethnicity option in the library.'],
  'characters|personalities': ['Characters: which personalities?', 'Tick each personality type offered.'],
  'characters|scenarios': ['Characters: which scenarios?', 'Tick each roleplay scenario type.'],
  'characters|filters': ['Characters: how many filters?', 'Count every filter in the character library.'],
  'characters|categories': ['Characters: how many groups?', 'Count categories that organize characters.'],
  'characters|search': ['Characters: does search work?', 'Search 3 names and 3 keywords. Did you find them?'],
  'characters|browsing': ['Characters: easy to browse?', 'Do 10 browsing tasks. Count the easy ones.'],
  'characters|duplicates': ['Characters: any duplicates?', `In ${CHARS} characters, count near-copy profiles.`],
  'characters|originality': ['Characters: how unique?', `In ${CHARS} characters, count that feel original.`],
  'characters|profile-quality': ['Characters: good profiles?', `In ${CHARS} profiles, count complete useful ones.`],
  'characters|visual-quality': ['Characters: good photos?', `In ${CHARS} profile photos, count clear good ones.`],

  // — Creator / customization —
  'customization|gender': ['Creator: gender options?', 'Count gender choices when making a new character.'],
  'customization|age': ['Creator: age options?', 'Count age choices (or min/max adult age).'],
  'customization|ethnicity': ['Creator: ethnicity options?', 'Count ethnicity choices in the creator.'],
  'customization|face': ['Creator: face options?', 'Count face presets and face controls.'],
  'customization|hair': ['Creator: hair options?', 'Count hair styles and hair color options.'],
  'customization|body': ['Creator: body options?', 'Count body type and body shape controls.'],
  'customization|clothing': ['Creator: clothing options?', 'Count outfit and clothing choices.'],
  'customization|traits': ['Creator: personality traits?', 'Count personality trait options.'],
  'customization|interests': ['Creator: interest options?', 'Count hobby/interest options for characters.'],
  'customization|communication': ['Creator: chat style options?', 'Count communication style choices.'],
  'customization|relationship': ['Creator: relationship types?', 'Count relationship type options.'],
  'customization|role': ['Creator: role options?', 'Count role/occupation options.'],
  'customization|voice': ['Creator: voice options?', 'Count voice choices for characters.'],
  'customization|preview': [
    'Creator: preview before save?',
    'Make 5 characters. Before finishing each one, check if you can see a picture or description first — without burning all your tokens.',
  ],
  'customization|detail-level': [
    'Creator: how much control?',
    'Tick every option you can change when making a character (gender, face, hair, clothes, voice, etc.).',
  ],
  'customization|custom-prompts': [
    'Creator: custom text works?',
    'Make 5 characters using your own written description. Count how many followed it.',
  ],
  'customization|editing': [
    'Creator: edit after creating?',
    'Make 5 characters, then try to change them. Count how many let you edit.',
  ],
  'customization|combinations': [
    'Creator: presets + custom text?',
    'Make 5 characters using preset buttons AND your own text. Count successes.',
  ],

  // — Chat (worksheet + standalone) —
  'chat|memory': ['Chat: remembers facts?', `Use the table — ${CHATS} chats, 5 facts each.`],
  'chat|relevance': ['Chat: answers questions?', `Use the table — ${CHATS} chats, 5 questions each.`],
  'chat|context': ['Chat: uses earlier messages?', `Use the table — tick if each chat used context correctly.`],
  'chat|instructions': ['Chat: follows your rules?', `Use the table — rules followed per chat.`],
  'chat|roleplay-accuracy': ['Chat: roleplay correct?', `Use the table — roleplay checks per chat.`],
  'chat|naturalness': ['Chat: sounds natural?', `Use the table — count natural replies per chat (of ~20).`],
  'chat|personality': ['Chat: keeps personality?', `Use the table — tick if character stayed in character.`],
  'chat|roleplay': ['Chat: good roleplay?', `Use the table — roleplay score per chat.`],
  'chat|initiative': ['Chat: takes initiative?', `Use the table — times it moved the conversation forward.`],
  'chat|emotion': ['Chat: handles emotions?', `Use the table — emotional moments handled well.`],
  'chat|style': ['Chat: right tone/style?', `Use the table — replies that match the character style.`],
  'chat|repetition': ['Chat: repeats itself?', `In your ${REPLIES} test replies, count repetition problems.`],
  'chat|refusals': ['Chat: refuses too much?', 'Try 25 different prompts. Count how many got refused.'],
  'chat|reply-speed': ['Chat: reply speed?', 'Time 25 replies. Enter median seconds to respond.'],
  'chat|errors': ['Chat: errors or crashes?', `In ${REPLIES} test replies, count errors or broken replies.`],
  'chat|consistency': ['Chat: contradicts itself?', `In ${CHATS} chats, count times it contradicted earlier facts.`],
  'chat|recovery': ['Chat: recovers from mistakes?', 'Correct the AI 5 times when it messes up. Count successes.'],

  // — Pricing —
  'pricing|monthly-price': ['Pricing: monthly cost?', 'Cheapest paid monthly plan in USD.'],
  'pricing|annual-price': ['Pricing: annual cost?', 'Full year price in USD (or monthly equivalent).'],
  'pricing|free-plan': ['Pricing: free plan?', 'Can you use it 7 days without paying?'],
  'pricing|free-trial': ['Pricing: free trial?', 'Can you try paid features before being charged?'],
  'pricing|included-credits': ['Pricing: included credits?', 'Tokens/credits included with a normal subscription.'],
  'pricing|included-features': ['Pricing: what is included?', 'Tick features you get without paying extra.'],
  'pricing|plan-limits': ['Pricing: usage limits?', 'Daily/monthly caps on messages, images, etc.'],
  'pricing|image-cost': ['Pricing: image cost?', 'USD cost for one image.'],
  'pricing|video-cost': ['Pricing: video cost?', 'USD cost for one video.'],
  'pricing|voice-cost': ['Pricing: voice cost?', 'Cost per voice message or per minute.'],
  'pricing|top-ups': ['Pricing: credit packs?', 'Smallest and biggest token pack + price per credit.'],
  'pricing|credit-expiry': ['Pricing: credits expire?', 'Do bought credits expire? When?'],
  'pricing|feature-paywalls': ['Pricing: pay extra for what?', 'Tick features that cost more on top of your plan.'],
  'pricing|refunds': ['Pricing: refunds allowed?', 'Can you get money back? Any rules?'],
  'pricing|real-cost': ['Pricing: normal month total?', '500 msgs + 20 images + 4 videos + 30 voice min — total cost?'],
  'pricing|heavy-use-cost': ['Pricing: heavy month total?', '2000 msgs + 100 images + 20 videos + 120 voice min — total cost?'],
  'pricing|category-comparison': ['Pricing: vs other apps?', 'Cheaper or pricier than similar apps for normal use?'],
  'pricing|feature-value': ['Pricing: worth the money?', 'Tick features included in a normal month without extra pay (10 items).'],
  'pricing|usage-value': ['Pricing: stuff per $10?', 'Count usable chats, images, videos, voice from your tests. Results per $10 spent.'],
  'pricing|pricing-clarity': ['Pricing: prices shown clearly?', 'Tick what the site shows before checkout (price, limits, refunds, etc.).'],

  // — Images (worksheet) —
  'images|realism': ['Images: looks real?', 'Use the image table — realism checks per image.'],
  'images|resolution': ['Images: max resolution?', 'Biggest image size you can generate.'],
};

function hintFrom(item: Item): string {
  const key = `${item.category}|${item.slug}`;
  if (CUSTOM[key]) return CUSTOM[key][1];
  if (item.instr[0]) {
    const s = item.instr[0];
    if (s.length <= 100) return s;
    return `${s.slice(0, 97)}…`;
  }
  if (item.pub) {
    const p = item.pub.charAt(0).toUpperCase() + item.pub.slice(1);
    return `Check ${p}. Write what you found.`;
  }
  return `Test this and write what you found.`;
}

function labelFrom(item: Item): string {
  const key = `${item.category}|${item.slug}`;
  if (CUSTOM[key]) return CUSTOM[key][0];

  const prefix = CAT[item.category];
  const { name, pub, mt } = item;

  if (mt === 'yes_limited_no' || mt === 'boolean') {
    const bit = pub
      ? pub.charAt(0).toUpperCase() + pub.slice(1)
      : name;
    const q = bit.endsWith('?') ? bit : `${bit}?`;
    return prefix ? `${prefix}: ${q.charAt(0).toLowerCase()}${q.slice(1)}` : q;
  }

  if (mt === 'count' || mt === 'currency' || mt === 'seconds') {
    const core = pub ? `${name.toLowerCase()} — ${pub}` : name.toLowerCase();
    return prefix ? `${prefix}: ${core}?` : `${name}?`;
  }

  return prefix ? `${prefix}: ${name.toLowerCase()}?` : `${name}?`;
}

const map: Record<string, { q: string; hint: string }> = {};
for (const item of items) {
  const key = `${item.category}|${item.slug}`;
  const custom = CUSTOM[key];
  map[key] = custom
    ? { q: custom[0], hint: custom[1] }
    : { q: labelFrom(item), hint: hintFrom(item) };
}

const out = `// Auto-generated short tester labels + tooltip hints.
// Regenerate: npx tsx scripts/generate-short-questions.ts

export interface ShortQuestion {
  q: string;
  hint: string;
}

export const SHORT_QUESTIONS: Record<string, ShortQuestion> = ${JSON.stringify(map, null, 2)};
`;

writeFileSync(resolve(process.cwd(), 'src/components/admin/testing/shortQuestions.ts'), out);
console.log(`Wrote ${items.length} short questions.`);
