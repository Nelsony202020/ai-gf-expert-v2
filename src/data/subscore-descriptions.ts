import { toSlug } from '../lib/slugs';

/** Plain-language “What it is” copy for each subscore (methodology v3.1). */
const SUBSCORE_DESCRIPTIONS: Record<string, string> = {
  'characters/variety':
    'How many ready-made characters the app offers, and how much variety you get in styles, genders, personalities, and roleplay types.',
  'characters/discovery':
    'How easy it is to find a character that fits what you want — filters, categories, search, and browsing.',
  'characters/quality':
    'How good the character library is overall: duplicates, originality, profile completeness, and image quality.',

  'customization/appearance':
    'How many appearance options you get when creating a character — face, hair, body, clothing, and related controls.',
  'customization/personality':
    'How much you can shape a character’s personality — traits, interests, communication style, relationship type, and voice.',
  'customization/control':
    'How much control you have over creation — custom prompts, editing after creation, detail level, and previews.',

  'chat/understanding':
    'How well the AI understands you — memory, staying on topic, following instructions, and keeping roleplay accurate.',
  'chat/realism':
    'How natural the conversation feels — realistic wording, consistent personality, emotion, and initiative.',
  'chat/reliability':
    'How dependable chat is day to day — repetition, refusals, reply speed, errors, and recovery from mistakes.',

  'chat-features/media':
    'What media you can send and receive in chat — images, voice messages, video, GIFs, and reactions.',
  'chat-features/interaction':
    'Interactive chat features — voice calls, chat modes, group chat, double texting, and proactive messages.',
  'chat-features/controls':
    'Controls you have in chat — edit or delete messages, regenerate replies, manage memory, reset, and export.',
  'chat-features/platform-extras':
    'Extra experiences beyond standard chat. Only live cam affects the score; other extras are noted in the review.',

  'images/quality':
    'How good generated images look — realism, detail, composition, visual errors, and maximum resolution.',
  'images/accuracy':
    'How well images match your prompts and stay consistent with the character’s face, body, and style.',
  'images/experience':
    'What using the image generator feels like — speed, failures, where you can generate, editing, and cost.',

  'video/capabilities':
    'What video features exist — text-to-video, image-to-video, chat video, audio, length, and resolution limits.',
  'video/quality':
    'How good generated videos look — realism, motion, prompt accuracy, consistency, and visual errors.',
  'video/experience':
    'What using video generation feels like — speed, failures, ease of use, controls, regeneration, and cost.',

  'privacy/data-use':
    'How your data is used — AI training, human review, third-party sharing, ads, retention, and policy clarity.',
  'privacy/user-control':
    'Your control over your data — deleting chats and accounts, opt-outs, exports, and consent settings.',
  'privacy/security':
    'Account and payment security — encryption, login protections, two-factor auth, and billing privacy.',
  'privacy/support':
    'How easy it is to reach support, how fast they respond, and how helpful they are.',

  'pricing/subscription':
    'Subscription pricing and what it includes — monthly/annual price, free tier, trial, credits, features, and limits.',
  'pricing/extra-costs':
    'Costs on top of the subscription — images, video, voice, credit packs, expiry, paywalls, and refunds.',
  'pricing/value':
    'Whether the app is good value — estimated real monthly cost, comparison to rivals, and pricing clarity.',
};

export function getSubscoreDescription(categoryKey: string, subscoreName: string): string {
  const key = `${toSlug(categoryKey)}/${toSlug(subscoreName)}`;
  return SUBSCORE_DESCRIPTIONS[key] ?? '';
}
