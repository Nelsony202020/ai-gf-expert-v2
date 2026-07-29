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
  'pricing|monthly-price': ['Monthly price?', 'Cheapest paid monthly plan in USD (filled from Pricing tab when available).'],
  'pricing|annual-price': ['Annual price?', 'Effective monthly cost when paying yearly.'],
  'pricing|annual-discount': ['Annual discount?', 'Percent saved vs paying monthly for 12 months.'],
  'pricing|included-credits': ['Included credits?', 'Tokens or credits included with the subscription.'],
  'pricing|included-features': ['Included features?', 'Tick core features included without extra payment.'],
  'pricing|plan-limits': ['Plan limits?', 'Daily or monthly caps on messages, images, video, voice, characters.'],
  'pricing|image-cost': ['Image cost?', 'USD per usable image (total generation cost ÷ usable images when possible).'],
  'pricing|video-cost': ['Video cost?', 'USD per 10 seconds of video — normalize shorter clips to this unit.'],
  'pricing|voice-cost': ['Voice cost?', 'USD per 10 seconds of voice message.'],
  'pricing|call-cost': ['Call cost?', 'USD per minute of voice calling.'],
  'pricing|top-up-value': ['Top-up value?', 'Smallest and largest credit packages plus cost per credit.'],
  'pricing|monthly-spend': ['Monthly spend?', 'Estimated monthly cost for regular use (500 msgs, 20 images, 4 videos, 30 voice min).'],
  'pricing|free-chat': ['Free chat?', 'How many messages can a free user send? Use a short label like 20 messages.'],
  'pricing|free-images': ['Free images?', 'How many images can a free user generate? e.g. 3 images.'],
  'pricing|free-video': ['Free video?', 'How many videos can a free user create? e.g. 1 video.'],
  'pricing|free-voice': ['Free voice?', 'Free voice allowance in seconds — e.g. 30 sec voice.'],
  'pricing|free-characters': ['Free characters?', 'How many characters can a free user create or chat with? e.g. 1 character.'],
  'pricing|free-value': ['Free value?', 'Short label for overall free access — e.g. No card needed.'],
  'pricing|restrictions': ['Restrictions?', 'How free access resets or expires — e.g. Resets daily.'],
  'pricing|pricing-clarity': ['Price clarity?', 'Tick what the site shows before checkout (price, limits, refunds, etc.).'],
  'pricing|paywalls': ['Paywalls?', 'Tick core features that require a higher plan, credits, or separate purchase.'],
  'pricing|credit-expiry': ['Credit expiry?', 'Do purchased credits expire? When?'],
  'pricing|refunds': ['Refunds?', 'Can you get money back? Any rules or time limits?'],
  'pricing|cancellation': ['Cancellation?', 'Can you cancel self-service? How many steps?'],
  'pricing|payment-privacy': ['Payment & privacy?', 'Discreet billing descriptor and payment privacy on statements.'],

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
