import { toSlug } from '../lib/slugs';

/** “What it is” copy for overall performance score tooltips (methodology v3.1). */
export const OVERALL_TOOLTIP_DESCRIPTION =
  'Shows how well the app performs across all eight testing areas, with more important areas counting more toward the final result.';

/** “What it is” copy for category score tooltips. */
const CATEGORY_TOOLTIP_DESCRIPTIONS: Record<string, string> = {
  characters:
    'Shows how good the ready-made character library is, including choice, discovery, and character quality.',
  customization:
    'Shows how much control users have when creating their own AI character.',
  chat:
    'Shows how well the AI understands users, feels human, and performs reliably during conversations.',
  'chat-features':
    'Shows what users can do inside the chat beyond sending normal text messages.',
  images:
    'Shows how good the generated images are and how well the image tools work.',
  video:
    'Shows what video features the app offers and how good the generated videos are.',
  privacy:
    'Shows how well the app protects personal data, chats, accounts, and billing information.',
  pricing:
    'Shows what users receive for their money and what the app really costs during regular use.',
};

/** “What it is” copy for each subscore tooltip. */
const SUBSCORE_DESCRIPTIONS: Record<string, string> = {
  'characters/variety':
    'Measures how much real choice the library offers across character numbers, styles, identities, personalities, and scenarios.',
  'characters/discovery':
    'Measures how easily users can find characters that match their interests using search, filters, categories, and browsing.',
  'characters/quality':
    'Measures whether characters feel original, complete, visually polished, and different from one another.',

  'customization/appearance':
    'Measures the range of physical features, styles, clothing, and other appearance options available.',
  'customization/personality':
    'Measures how deeply users can shape the character’s personality, interests, relationship, role, voice, and preferences.',
  'customization/control':
    'Measures how much freedom users have to add custom instructions, edit their character, and preview the result.',

  'chat/understanding':
    'Measures how well the AI remembers details, follows instructions, understands context, and stays accurate during roleplay.',
  'chat/realism':
    'Measures how natural, emotional, consistent, and believable the AI feels while chatting.',
  'chat/reliability':
    'Measures how consistently the chat works without repetition, refusals, errors, slow replies, or broken conversations.',

  'chat-features/platform-extras':
    'Measures special experiences outside standard chat, such as live cam features and other unique tools.',
  'chat-features/media':
    'Measures the images, videos, voice messages, GIFs, and reactions users can send or receive in chat.',
  'chat-features/interaction':
    'Measures features that make conversations more active, such as calls, chat modes, group chats, and proactive messages.',
  'chat-features/controls':
    'Measures how much control users have over conversations, including editing, deleting, regenerating, saving memories, resetting, and exporting chats.',

  'images/quality':
    'Measures realism, detail, composition, resolution, and visible image errors.',
  'images/accuracy':
    'Measures how closely images follow the prompt and preserve the character’s face, body, identity, and style.',
  'images/experience':
    'Measures how fast, reliable, flexible, and easy the image generator is to use.',

  'video/quality':
    'Measures motion, accuracy, character consistency, frame stability, and visible video errors.',
  'video/experience':
    'Measures how fast, reliable, and easy the video generator is to use, including failures and regeneration options.',
  'video/capabilities':
    'Measures what the video system can create, including text-to-video, image-to-video, audio, resolution, and maximum length.',

  'privacy/user-control':
    'Measures whether users can delete, export, or manage their chats, account, personal data, and training preferences.',
  'privacy/security':
    'Measures account protection, encryption, two-factor authentication, billing privacy, and known security incidents.',
  'privacy/data-use':
    'Measures how clearly the app explains data retention, sharing, advertising, AI training, and human review.',
  'privacy/support':
    'Measures how easy it is to contact support and how quickly and helpfully the company responds.',

  'pricing/plan-value':
    'Measures the subscription price, included features, credits, limits, and annual savings.',
  'pricing/usage-costs':
    'Measures the real cost of images, video, voice, calls, top-ups, and regular monthly use.',
  'pricing/free-access':
    'Measures how much users can genuinely test before paying, including free chat, media, characters, and trial access.',
  'pricing/billing':
    'Measures how clearly and fairly the app handles prices, paywalls, credit expiry, refunds, cancellation, and payment privacy.',
};

export function getOverallTooltipDescription(): string {
  return OVERALL_TOOLTIP_DESCRIPTION;
}

export function getCategoryTooltipDescription(categoryKey: string): string {
  return CATEGORY_TOOLTIP_DESCRIPTIONS[toSlug(categoryKey)] ?? '';
}

export function getSubscoreDescription(categoryKey: string, subscoreName: string): string {
  const key = `${toSlug(categoryKey)}/${toSlug(subscoreName)}`;
  return SUBSCORE_DESCRIPTIONS[key] ?? '';
}
