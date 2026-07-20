import type { DataRow, RatingCategory, Subscore } from './products';
import { computeCategoryScore } from '../lib/scores';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/300/400`;

type SubInput = Omit<Subscore, 'weight'> & { weight?: number };

/** Three subscores per category, equal weight unless overridden. */
function subs(items: SubInput[]): Subscore[] {
  const base = Math.floor(100 / items.length);
  const extra = 100 - base * items.length;
  return items.map((item, i) => ({
    ...item,
    weight: item.weight ?? base + (i < extra ? 1 : 0),
  }));
}

function row(label: string, value: string, icon?: string, internalScore?: number): DataRow {
  return { label, value, icon, internalScore };
}

function finalize(categories: Omit<RatingCategory, 'score' | 'evidence'>[]): RatingCategory[] {
  return categories.map((cat) => ({
    ...cat,
    score: computeCategoryScore(cat.subscores),
    evidence: cat.subscores.flatMap((s) => s.contributors),
  }));
}

const rawCategories: Omit<RatingCategory, 'score' | 'evidence'>[] = [
  {
    key: 'characters',
    name: 'Characters',
    weight: 10,
    description: 'Measures the platform\'s ready-made character library.',
    subscores: subs([
      {
        name: 'Variety',
        score: 9.4,
        description: 'How many characters, styles and types are available.',
        contributors: [
          row('Amount', '2,450', 'groups', 9.6),
          row('Styles', '4 styles', 'palette', 9.5),
          row('Genders', '4 categories', 'transgender', 9.4),
          row('Ethnicities', '24 categories', 'public', 9.3),
          row('Personalities', '18 types', 'mood', 9.2),
          row('Scenarios', '42 types', 'auto_awesome', 9.4),
        ],
      },
      {
        name: 'Discovery',
        score: 8.8,
        description: 'How easy it is to find characters for your needs.',
        contributors: [
          row('Filters', '12 useful filters', 'filter_alt'),
          row('Categories', '16 categories', 'category'),
          row('Search', 'Yes', 'search'),
          row('Browsing', '90% tasks · 2.1 avg clicks', 'travel_explore'),
        ],
      },
      {
        name: 'Quality',
        score: 9.2,
        description: 'Duplicate check and profile quality on a 50-character sample.',
        contributors: [
          row('Duplicates', '2 in 50 (4%)', 'content_copy'),
          row('Originality', '88% pass', 'auto_awesome'),
          row('Profile Quality', '91% complete', 'description'),
          row('Visual Quality', '86% pass', 'photo_camera'),
        ],
      },
    ]),
    proof: [
      { src: img('char-lib'), caption: 'Character Library', sub: '(2,450 characters)', type: 'image' },
      { src: img('char-browse'), caption: 'Browsing Test', sub: '(90% tasks)', type: 'video' },
      { src: img('char-quality'), caption: 'Quality Sample', sub: '(50 characters)', type: 'image' },
      { src: img('char-filters'), caption: 'Filters', sub: '(12 filters)', type: 'image' },
      { src: img('char-search'), caption: 'Search', sub: '(6/6 passed)', type: 'video' },
      { src: img('char-profiles'), caption: 'Profile Review', sub: '(50 sampled)', type: 'image' },
    ],
    whatThisMeans: 'Large, varied library with strong discovery and high profile quality.',
  },
  {
    key: 'customization',
    name: 'Customization',
    weight: 15,
    description: 'Measures how much control users have when creating their own character.',
    subscores: subs([
      {
        name: 'Appearance',
        score: 9.2,
        description: 'Gender, face, hair, body and clothing options.',
        contributors: [
          row('Gender', '6 options', 'badge'),
          row('Age', '18–60 range', 'cake'),
          row('Ethnicity', '22 options', 'public'),
          row('Face', '60 presets · 8 controls', 'face'),
          row('Hair', '34 styles · 28 colors', 'content_cut'),
          row('Body', '8 presets · 6 controls', 'accessibility_new'),
          row('Clothing', '120+ items · 9 categories', 'checkroom'),
        ],
      },
      {
        name: 'Personality',
        score: 8.9,
        description: 'Traits, interests, communication, relationship, role and voice.',
        contributors: [
          row('Traits', '48 traits · max 5', 'psychology'),
          row('Interests', '36 · custom Yes', 'interests'),
          row('Communication', '8 styles', 'forum'),
          row('Relationship', '12 types', 'favorite'),
          row('Role', '24 presets · custom Yes', 'work'),
          row('Voice', '14 voices', 'record_voice_over'),
        ],
      },
      {
        name: 'Control',
        score: 9.0,
        description: 'Custom prompts, editing, detail and preview.',
        contributors: [
          row('Custom Prompts', 'Yes', 'edit_note'),
          row('Editing', '100% areas editable', 'edit'),
          row('Detail Level', '18 / 20 controls', 'tune'),
          row('Combinations', '5 / 5 successful', 'merge'),
          row('Preview', 'Yes', 'preview'),
        ],
      },
    ]),
    proof: [
      { src: img('cust-app'), caption: 'Appearance', sub: '(Face, hair, body)', type: 'image' },
      { src: img('cust-pers'), caption: 'Personality', sub: '(48 traits)', type: 'image' },
      { src: img('cust-ctrl'), caption: 'Control', sub: '(Custom prompts)', type: 'video' },
      { src: img('cust-edit'), caption: 'Post-Creation Edit', sub: '(Full access)', type: 'image' },
    ],
    whatThisMeans: 'Deep customization across looks, personality and post-creation control.',
  },
  {
    key: 'chat',
    name: 'Chat',
    weight: 20,
    description: 'Measures the quality of the actual conversation.',
    subscores: subs([
      {
        name: 'Understanding',
        score: 9.1,
        description: 'Memory, relevance, context, instructions and roleplay accuracy.',
        contributors: [
          row('Memory', '88%', 'memory'),
          row('Relevance', '92%', 'target'),
          row('Context', '90%', 'hub'),
          row('Instructions', '87%', 'checklist'),
          row('Roleplay Accuracy', '94%', 'theater_comedy'),
        ],
      },
      {
        name: 'Realism',
        score: 9.2,
        description: 'Naturalness, personality, roleplay, initiative, emotion and style.',
        contributors: [
          row('Naturalness', '89%', 'forum'),
          row('Personality', '9.1 / 10', 'psychology'),
          row('Roleplay', '9.4 / 10', 'theater_comedy'),
          row('Initiative', '78%', 'trending_up'),
          row('Emotion', '86%', 'sentiment_satisfied'),
          row('Style', '91%', 'style'),
        ],
      },
      {
        name: 'Reliability',
        score: 8.9,
        description: 'Repetition, refusals, speed, errors, consistency and recovery.',
        contributors: [
          row('Repetition', '3 per 50 messages', 'repeat'),
          row('Refusals', '1 per 50 prompts', 'block'),
          row('Speed', '1.8 seconds', 'speed'),
          row('Errors', '2 per 50 replies', 'error'),
          row('Consistency', '96%', 'sync'),
          row('Recovery', '90%', 'healing'),
        ],
      },
    ]),
    proof: [
      { src: img('chat-mem'), caption: 'Memory Test', sub: '(88%)', type: 'video' },
      { src: img('chat-spd'), caption: 'Reply Speed', sub: '(1.8s median)', type: 'image' },
      { src: img('chat-rp'), caption: 'Roleplay', sub: '(9.4 / 10)', type: 'video' },
      { src: img('chat-ref'), caption: 'Refusals', sub: '(1 / 50)', type: 'image' },
      { src: img('chat-ctx'), caption: 'Context', sub: '(90%)', type: 'video' },
    ],
    whatThisMeans: 'Industry-leading conversation quality with strong memory and roleplay.',
  },
  {
    key: 'chat-features',
    name: 'Chat Features',
    weight: 10,
    description: 'Measures what users can do inside the chat.',
    subscores: subs([
      {
        name: 'Media',
        score: 9.3,
        description: 'Images, voice, video, GIFs and reactions in chat.',
        contributors: [
          row('Images Sent', 'Yes', 'upload'),
          row('Images Received', 'Yes', 'image'),
          row('Voice Sent', 'Yes', 'mic'),
          row('Voice Received', 'Yes', 'graphic_eq'),
          row('Chat Video', 'Yes', 'videocam'),
          row('GIFs', 'Limited', 'gif_box'),
          row('Reactions', 'Yes', 'emoji_emotions'),
        ],
      },
      {
        name: 'Interaction',
        score: 9.1,
        description: 'Calls, modes, groups and proactive messaging.',
        contributors: [
          row('Voice Calls', 'Yes · 3 / 3', 'call'),
          row('Chat Modes', '6 modes', 'tune'),
          row('Mode Types', 'Romance, roleplay, story +3', 'category'),
          row('Group Chat', 'No', 'groups'),
          row('Double Texting', '12 per 100 messages', 'sms'),
          row('Proactive Messages', '4 in 7 days', 'notifications'),
        ],
      },
      {
        name: 'Controls',
        score: 9.0,
        description: 'Edit, delete, regenerate, memories and export.',
        contributors: [
          row('Edit Messages', 'Yes', 'edit'),
          row('Delete Messages', 'Yes', 'delete'),
          row('Regenerate Replies', 'Yes', 'refresh'),
          row('Save Memories', 'Yes', 'bookmark'),
          row('Edit Memories', 'Yes', 'book'),
          row('Reset Chat', 'Yes', 'restart_alt'),
          row('Export Chat', 'Limited', 'download'),
        ],
      },
    ]),
    proof: [
      { src: img('cf-call'), caption: 'Voice Calls', sub: '(Live)', type: 'video' },
      { src: img('cf-modes'), caption: 'Chat Modes', sub: '(6 modes)', type: 'image' },
      { src: img('cf-media'), caption: 'Media', sub: '(Images & voice)', type: 'video' },
      { src: img('cf-proactive'), caption: 'Proactive Messages', sub: '(7-day test)', type: 'image' },
    ],
    whatThisMeans: 'Rich in-chat features including calls, voice and proactive messaging.',
  },
  {
    key: 'images',
    name: 'Images',
    weight: 15,
    description: 'Measures image quality and the image-generation experience.',
    subscores: subs([
      {
        name: 'Quality',
        score: 8.0,
        description: 'Realism, errors, detail, composition and resolution.',
        contributors: [
          row('Realism', '82%', 'photo_camera'),
          row('Visual Errors', '14%', 'error'),
          row('Detail', '78%', 'zoom_in'),
          row('Composition', '81%', 'crop'),
          row('Resolution', '1024 × 1024 px', 'hd'),
        ],
      },
      {
        name: 'Accuracy',
        score: 7.8,
        description: 'Prompt and character consistency across generations.',
        contributors: [
          row('Prompt Accuracy', '78%', 'target'),
          row('Character Consistency', '76%', 'lock'),
          row('Face Consistency', '80%', 'face'),
          row('Body Consistency', '72%', 'accessibility_new'),
          row('Style Consistency', '84%', 'palette'),
          row('Editing Accuracy', '70%', 'auto_fix'),
        ],
      },
      {
        name: 'Experience',
        score: 7.2,
        description: 'Speed, failures, tools and cost (cost affects Pricing only).',
        contributors: [
          row('Speed', '15 seconds', 'timer'),
          row('Failures', '8%', 'cloud_off'),
          row('Chat Generation', 'Yes', 'chat'),
          row('Separate Generator', 'Yes', 'image'),
          row('Custom Prompts', 'Yes', 'edit_note'),
          row('Image Editing', 'Limited', 'brush'),
          row('NSFW Support', 'Yes', 'explicit'),
          row('Cost', '$0.12 per image', 'payments'),
        ],
      },
    ]),
    proof: [
      { src: img('img-real'), caption: 'Realism', sub: '(82%)', type: 'image' },
      { src: img('img-cons'), caption: 'Consistency', sub: '(76%)', type: 'image' },
      { src: img('img-spd'), caption: 'Gen Speed', sub: '(15s median)', type: 'video' },
      { src: img('img-nsfw'), caption: 'NSFW Prompt', sub: '(Test batch)', type: 'image' },
      { src: img('img-edit'), caption: 'In-Chat Gen', sub: '(Screenshot)', type: 'image' },
    ],
    whatThisMeans: 'Solid image quality held back by slower speeds and occasional errors.',
  },
  {
    key: 'video',
    name: 'Video',
    weight: 10,
    description: 'Measures video capabilities, output quality and generation experience.',
    subscores: subs([
      {
        name: 'Capabilities',
        score: 8.5,
        description: 'Available video types, audio, length and resolution.',
        contributors: [
          row('Text-to-Video', 'No', 'text_fields'),
          row('Image-to-Video', 'Yes', 'movie'),
          row('Chat Video', 'Yes', 'chat'),
          row('Audio', 'No', 'volume_up'),
          row('Maximum Length', '5 seconds', 'schedule'),
          row('Maximum Resolution', '1280 × 720 px', 'hd'),
        ],
      },
      {
        name: 'Quality',
        score: 9.5,
        description: 'Realism, motion, accuracy, consistency and errors.',
        contributors: [
          row('Realism', '92%', 'movie'),
          row('Motion', '94%', 'animation'),
          row('Accuracy', '94%', 'target'),
          row('Character Consistency', '95%', 'lock'),
          row('Visual Errors', '6%', 'error'),
          row('Frame Consistency', '90%', 'video_stable'),
        ],
      },
      {
        name: 'Experience',
        score: 8.6,
        description: 'Speed, failures, ease of use, controls and cost.',
        contributors: [
          row('Speed', '45 seconds', 'timer'),
          row('Failures', '10%', 'cloud_off'),
          row('Ease of Use', '4 avg steps', 'touch_app'),
          row('Controls', '5 controls', 'tune'),
          row('Regeneration', 'Yes', 'refresh'),
          row('Cost', '$1.40 per video', 'payments'),
        ],
      },
    ]),
    proof: [
      { src: img('vid-i2v'), caption: 'Image-to-Video', sub: '(5s clips)', type: 'video' },
      { src: img('vid-mot'), caption: 'Motion', sub: '(94%)', type: 'video' },
      { src: img('vid-out'), caption: 'Output', sub: '(720p)', type: 'image' },
      { src: img('vid-chat'), caption: 'In-Chat Video', sub: '(Screenshot)', type: 'video' },
    ],
    whatThisMeans: 'Image-to-video only · 5-second clips · $1.40 per generation',
  },
  {
    key: 'privacy',
    name: 'Privacy',
    weight: 10,
    description: 'Measures chat privacy, user control, account security and billing privacy.',
    subscores: subs([
      {
        name: 'Data Use',
        score: 9.3,
        description: 'Training, review, sharing, advertising, retention and policy clarity.',
        contributors: [
          row('Training', 'No', 'model_training'),
          row('Human Review', 'No', 'visibility'),
          row('Data Sharing', 'Limited · 2 categories', 'share'),
          row('Advertising', 'No', 'campaign'),
          row('Retention', 'Until deletion', 'schedule'),
          row('Policy Clarity', '100%', 'policy'),
        ],
      },
      {
        name: 'User Control',
        score: 9.1,
        description: 'Deletion, opt-out, export and consent controls.',
        contributors: [
          row('Delete Chats', 'Yes · 3 / 3', 'delete'),
          row('Delete Account', 'Yes · 3 steps', 'person_remove'),
          row('Delete Personal Data', 'Yes', 'delete_forever'),
          row('Training Opt-Out', 'Yes', 'block'),
          row('Export Data', 'Yes · 5 days', 'download'),
          row('Consent Controls', '4 controls', 'tune'),
        ],
      },
      {
        name: 'Security',
        score: 9.0,
        description: 'Encryption, account security, 2FA and billing privacy.',
        contributors: [
          row('Encryption', '2 / 3 confirmed', 'enhanced_encryption'),
          row('Account Security', '4 / 5 protections', 'shield'),
          row('Two-Factor Authentication', 'Yes · Authenticator', 'phonelink_lock'),
          row('Billing Privacy', 'Discreet', 'credit_card_off'),
          row('Billing Descriptor', 'Yes', 'receipt'),
          row('Security Incidents', '0 in 5 years', 'report'),
        ],
      },
    ]),
    proof: [
      { src: img('priv-pol'), caption: 'Privacy Policy', sub: '(No training)', type: 'image' },
      { src: img('priv-ctrl'), caption: 'User Control', sub: '(Delete & export)', type: 'image' },
      { src: img('priv-bill'), caption: 'Billing', sub: '(Discreet)', type: 'image' },
    ],
    whatThisMeans: 'Strong privacy practices with clear policies and user control.',
  },
  {
    key: 'pricing',
    name: 'Pricing',
    weight: 10,
    description: 'Measures what users pay and the value they receive.',
    subscores: subs([
      {
        name: 'Subscription',
        score: 8.8,
        description: 'Monthly price, free plan, credits and included features.',
        contributors: [
          row('Monthly Price', '$12.99/mo', 'payments'),
          row('Annual Price', '$9.99/mo effective', 'calendar_month'),
          row('Free Plan', 'Limited', 'card_giftcard'),
          row('Free Trial', 'Yes · 3 days', 'timer'),
          row('Included Credits', '500/mo', 'toll'),
          row('Included Features', '8 / 10', 'checklist'),
          row('Plan Limits', '100 msgs/day free', 'speed'),
        ],
      },
      {
        name: 'Extra Costs',
        score: 8.2,
        description: 'Per-use costs, top-ups, paywalls and refunds.',
        contributors: [
          row('Image Cost', '$0.12 each', 'image'),
          row('Video Cost', '$1.40 each', 'movie'),
          row('Voice Cost', '$0.02/msg · $0.15/min', 'call'),
          row('Top-Ups', '$4.99 – $49.99', 'add_shopping_cart'),
          row('Credit Expiry', 'No', 'event_busy'),
          row('Feature Paywalls', '2 / 10', 'lock'),
          row('Refunds', 'Yes · 7 days', 'currency_exchange'),
        ],
      },
      {
        name: 'Value',
        score: 8.4,
        description: 'Real cost, heavy-use cost and pricing clarity.',
        contributors: [
          row('Real Cost', '$31/mo regular use', 'account_balance_wallet'),
          row('Heavy-Use Cost', '$89/mo', 'trending_up'),
          row('Category Comparison', '8% below average', 'leaderboard'),
          row('Feature Value', '8 / 10 at real cost', 'verified'),
          row('Usage Value', '14 outputs per $10', 'analytics'),
          row('Pricing Clarity', '88%', 'info'),
        ],
      },
    ]),
    proof: [
      { src: img('price-plans'), caption: 'Plans', sub: '($12.99/mo)', type: 'image' },
      { src: img('price-real'), caption: 'Real Cost', sub: '($31/mo)', type: 'image' },
      { src: img('price-heavy'), caption: 'Heavy Use', sub: '($89/mo)', type: 'image' },
    ],
    whatThisMeans: '$12.99 subscription · $31 estimated regular use',
  },
];

export const auraAiCategories: RatingCategory[] = finalize(rawCategories);
