import { testContributorUrl } from './slugs';

export interface PublicContributorNode {
  label: string;
  slug: string;
  href: string;
}

export interface PublicEvidenceGroup {
  label: string;
  slug: string;
  memberSlugs: string[];
}

export interface PublicEvidenceGroupDisplay {
  label: string;
  slug: string;
  memberSectionIds: string[];
  /** Override the default "N scored tests" line under the group header. */
  groupSubtitle?: string;
}

/** Public page hierarchy — which scored tests appear under each evidence group. */
const PUBLIC_EVIDENCE_GROUP_DISPLAY: Record<string, PublicEvidenceGroupDisplay[]> = {
  'characters/variety': [
    {
      label: 'Amount',
      slug: 'amount',
      memberSectionIds: ['female-count', 'male-count', 'anime-female-count', 'anime-male-count'],
    },
    {
      label: 'Styles',
      slug: 'styles',
      memberSectionIds: ['styles'],
    },
    {
      label: 'Genders',
      slug: 'genders',
      memberSectionIds: ['transgender-count', 'non-binary-count', 'other-count'],
    },
    {
      label: 'Ethnicities',
      slug: 'ethnicities',
      memberSectionIds: ['ethnicities'],
    },
    {
      label: 'Personalities',
      slug: 'personalities',
      memberSectionIds: ['personalities'],
    },
    {
      label: 'Scenarios',
      slug: 'scenarios',
      memberSectionIds: ['scenarios'],
    },
  ],
  'characters/discovery': [
    { label: 'Filters', slug: 'filters', memberSectionIds: ['filters'] },
    { label: 'Categories', slug: 'categories', memberSectionIds: ['categories'] },
    { label: 'Search', slug: 'search', memberSectionIds: ['search'] },
    { label: 'Browsing', slug: 'browsing', memberSectionIds: ['browsing'] },
  ],
  'characters/quality': [
    { label: 'Duplicates', slug: 'duplicates', memberSectionIds: ['duplicates'] },
    { label: 'Originality', slug: 'originality', memberSectionIds: ['originality'] },
    { label: 'Profile Quality', slug: 'profile-quality', memberSectionIds: ['profile-quality'] },
    { label: 'Visual Quality', slug: 'visual-quality', memberSectionIds: ['visual-quality'] },
  ],
  'customization/appearance': [
    { label: 'Age', slug: 'age', memberSectionIds: ['age'] },
    { label: 'Ethnicity', slug: 'ethnicity', memberSectionIds: ['ethnicity'] },
    { label: 'Eye Color', slug: 'eye-color', memberSectionIds: ['eye-color'] },
    { label: 'Body Type', slug: 'body-type', memberSectionIds: ['body-type'] },
    { label: 'Breast Size', slug: 'breast-size', memberSectionIds: ['breast-size'] },
    { label: 'Hair Style', slug: 'hair-style', memberSectionIds: ['hair-style'] },
    { label: 'Hair Color', slug: 'hair-color', memberSectionIds: ['hair-color'] },
    { label: 'Outfits', slug: 'outfits', memberSectionIds: ['outfits'] },
    {
      label: 'Personality Presets',
      slug: 'creator-personalities',
      memberSectionIds: ['creator-personalities'],
    },
  ],
  'customization/personality': [
    { label: 'Traits', slug: 'traits', memberSectionIds: ['traits'] },
    { label: 'Interests', slug: 'interests', memberSectionIds: ['interests'] },
    { label: 'Relationship', slug: 'relationship', memberSectionIds: ['relationship'] },
    { label: 'Role', slug: 'role', memberSectionIds: ['role'] },
    { label: 'Voice', slug: 'voice', memberSectionIds: ['voice'] },
    { label: 'Kink Options', slug: 'kink-options', memberSectionIds: ['kink-options'] },
  ],
  'customization/control': [
    { label: 'Custom Prompts', slug: 'custom-prompts', memberSectionIds: ['custom-prompts'] },
    { label: 'Editing', slug: 'editing', memberSectionIds: ['editing'] },
    { label: 'Preview', slug: 'preview', memberSectionIds: ['preview'] },
  ],
  'chat/understanding': [
    { label: 'Memory', slug: 'memory', memberSectionIds: ['memory'] },
    { label: 'Relevance', slug: 'relevance', memberSectionIds: ['relevance'] },
    { label: 'Context', slug: 'context', memberSectionIds: ['context'] },
    { label: 'Instructions', slug: 'instructions', memberSectionIds: ['instructions'] },
    {
      label: 'Roleplay Accuracy',
      slug: 'roleplay-accuracy',
      memberSectionIds: ['roleplay-accuracy'],
    },
  ],
  'chat/realism': [
    { label: 'Naturalness', slug: 'naturalness', memberSectionIds: ['naturalness'] },
    { label: 'Personality', slug: 'personality', memberSectionIds: ['personality'] },
    { label: 'Roleplay', slug: 'roleplay', memberSectionIds: ['roleplay'] },
    { label: 'Initiative', slug: 'initiative', memberSectionIds: ['initiative'] },
    { label: 'Emotion', slug: 'emotion', memberSectionIds: ['emotion'] },
    { label: 'Style', slug: 'style', memberSectionIds: ['style'] },
  ],
  'chat/reliability': [
    { label: 'Repetition', slug: 'repetition', memberSectionIds: ['repetition'] },
    { label: 'Refusals', slug: 'refusals', memberSectionIds: ['refusals'] },
    { label: 'Reply Speed', slug: 'reply-speed', memberSectionIds: ['reply-speed'] },
    { label: 'Errors', slug: 'errors', memberSectionIds: ['errors'] },
    { label: 'Consistency', slug: 'consistency', memberSectionIds: ['consistency'] },
    { label: 'Recovery', slug: 'recovery', memberSectionIds: ['recovery'] },
  ],
  'chat-features/media': [
    { label: 'Images Sent', slug: 'images-sent', memberSectionIds: ['images-sent'] },
    { label: 'Images Received', slug: 'images-received', memberSectionIds: ['images-received'] },
    { label: 'Voice Sent', slug: 'voice-sent', memberSectionIds: ['voice-sent'] },
    { label: 'Voice Received', slug: 'voice-received', memberSectionIds: ['voice-received'] },
    { label: 'Chat Video', slug: 'chat-video', memberSectionIds: ['chat-video'] },
    { label: 'GIFs', slug: 'gifs', memberSectionIds: ['gifs'] },
    { label: 'Reactions', slug: 'reactions', memberSectionIds: ['reactions'] },
  ],
  'chat-features/interaction': [
    { label: 'Voice Calls', slug: 'voice-calls', memberSectionIds: ['voice-calls'] },
    { label: 'Chat Modes', slug: 'chat-modes', memberSectionIds: ['chat-modes'] },
    { label: 'Mode Types', slug: 'mode-types', memberSectionIds: ['mode-types'] },
    { label: 'Group Chat', slug: 'group-chat', memberSectionIds: ['group-chat'] },
    { label: 'Double Texting', slug: 'double-texting', memberSectionIds: ['double-texting'] },
    {
      label: 'Proactive Messages',
      slug: 'proactive-messages',
      memberSectionIds: ['proactive-messages'],
    },
  ],
  'chat-features/controls': [
    { label: 'Edit Messages', slug: 'edit-messages', memberSectionIds: ['edit-messages'] },
    { label: 'Delete Messages', slug: 'delete-messages', memberSectionIds: ['delete-messages'] },
    {
      label: 'Regenerate Replies',
      slug: 'regenerate-replies',
      memberSectionIds: ['regenerate-replies'],
    },
    { label: 'Save Memories', slug: 'save-memories', memberSectionIds: ['save-memories'] },
    { label: 'Edit Memories', slug: 'edit-memories', memberSectionIds: ['edit-memories'] },
    { label: 'Reset Chat', slug: 'reset-chat', memberSectionIds: ['reset-chat'] },
    { label: 'Export Chat', slug: 'export-chat', memberSectionIds: ['export-chat'] },
  ],
  'chat-features/platform-extras': [
    {
      label: 'Live Cam',
      slug: 'live-cam',
      memberSectionIds: ['live-cam'],
      groupSubtitle: '100% of Platform Extras when scored',
    },
    {
      label: 'Other Extras',
      slug: 'other-extras',
      memberSectionIds: ['other-extras'],
      groupSubtitle: 'Reference only — does not affect the score',
    },
  ],
  'images/quality': [
    { label: 'Realism', slug: 'realism', memberSectionIds: ['realism'] },
    { label: 'Visual Errors', slug: 'visual-errors', memberSectionIds: ['visual-errors'] },
    { label: 'Composition', slug: 'composition', memberSectionIds: ['composition'] },
    { label: 'Resolution', slug: 'resolution', memberSectionIds: ['resolution'] },
  ],
  'images/accuracy': [
    { label: 'Prompt Accuracy', slug: 'prompt-accuracy', memberSectionIds: ['prompt-accuracy'] },
    {
      label: 'Character Consistency',
      slug: 'character-consistency',
      memberSectionIds: ['character-consistency'],
    },
    { label: 'Face Consistency', slug: 'face-consistency', memberSectionIds: ['face-consistency'] },
    { label: 'Body Consistency', slug: 'body-consistency', memberSectionIds: ['body-consistency'] },
    {
      label: 'Style Consistency',
      slug: 'style-consistency',
      memberSectionIds: ['style-consistency'],
    },
    {
      label: 'Editing Accuracy',
      slug: 'editing-accuracy',
      memberSectionIds: ['editing-accuracy'],
    },
  ],
  'images/experience': [
    { label: 'Speed', slug: 'speed', memberSectionIds: ['speed'] },
    { label: 'Failures', slug: 'failures', memberSectionIds: ['failures'] },
    { label: 'Chat Generation', slug: 'chat-generation', memberSectionIds: ['chat-generation'] },
    {
      label: 'Separate Generator',
      slug: 'separate-generator',
      memberSectionIds: ['separate-generator'],
    },
    { label: 'Custom Prompts', slug: 'custom-prompts', memberSectionIds: ['custom-prompts'] },
    { label: 'Image Editing', slug: 'image-editing', memberSectionIds: ['image-editing'] },
    { label: 'NSFW Support', slug: 'nsfw-support', memberSectionIds: ['nsfw-support'] },
  ],
  'video/capabilities': [
    { label: 'Text-to-Video', slug: 'text-to-video', memberSectionIds: ['text-to-video'] },
    { label: 'Image-to-Video', slug: 'image-to-video', memberSectionIds: ['image-to-video'] },
    { label: 'Chat Video', slug: 'chat-video', memberSectionIds: ['chat-video'] },
    { label: 'Audio', slug: 'audio', memberSectionIds: ['audio'] },
    { label: 'Maximum Length', slug: 'maximum-length', memberSectionIds: ['maximum-length'] },
    {
      label: 'Maximum Resolution',
      slug: 'maximum-resolution',
      memberSectionIds: ['maximum-resolution'],
    },
  ],
  'video/quality': [
    { label: 'Motion', slug: 'motion', memberSectionIds: ['motion'] },
    { label: 'Prompt Accuracy', slug: 'accuracy', memberSectionIds: ['accuracy'] },
    {
      label: 'Character Consistency',
      slug: 'character-consistency',
      memberSectionIds: ['character-consistency'],
    },
    { label: 'Visual Errors', slug: 'visual-errors', memberSectionIds: ['visual-errors'] },
    {
      label: 'Frame Consistency',
      slug: 'frame-consistency',
      memberSectionIds: ['frame-consistency'],
    },
  ],
  'video/experience': [
    { label: 'Speed', slug: 'speed', memberSectionIds: ['speed'] },
    { label: 'Failures', slug: 'failures', memberSectionIds: ['failures'] },
    { label: 'Ease of Use', slug: 'ease-of-use', memberSectionIds: ['ease-of-use'] },
    { label: 'Regeneration', slug: 'regeneration', memberSectionIds: ['regeneration'] },
  ],
  'privacy/data-use': [
    { label: 'Training', slug: 'training', memberSectionIds: ['training'] },
    { label: 'Human Review', slug: 'human-review', memberSectionIds: ['human-review'] },
    { label: 'Data Sharing', slug: 'data-sharing', memberSectionIds: ['data-sharing'] },
    { label: 'Advertising', slug: 'advertising', memberSectionIds: ['advertising'] },
    { label: 'Retention', slug: 'retention', memberSectionIds: ['retention'] },
    { label: 'Policy Clarity', slug: 'policy-clarity', memberSectionIds: ['policy-clarity'] },
  ],
  'privacy/user-control': [
    { label: 'Delete Chats', slug: 'delete-chats', memberSectionIds: ['delete-chats'] },
    { label: 'Delete Account', slug: 'delete-account', memberSectionIds: ['delete-account'] },
    {
      label: 'Delete Personal Data',
      slug: 'delete-personal-data',
      memberSectionIds: ['delete-personal-data'],
    },
    { label: 'Training Opt-Out', slug: 'training-opt-out', memberSectionIds: ['training-opt-out'] },
    { label: 'Export Data', slug: 'export-data', memberSectionIds: ['export-data'] },
  ],
  'privacy/security': [
    { label: 'Encryption', slug: 'encryption', memberSectionIds: ['encryption'] },
    {
      label: 'Two-Factor Authentication',
      slug: 'two-factor-authentication',
      memberSectionIds: ['two-factor-authentication'],
    },
    { label: 'Billing Descriptor', slug: 'billing-descriptor', memberSectionIds: ['billing-descriptor'] },
    { label: 'Security Incidents', slug: 'security-incidents', memberSectionIds: ['security-incidents'] },
  ],
  'privacy/support': [
    {
      label: 'Support Available',
      slug: 'support-available',
      memberSectionIds: ['support-available'],
      groupSubtitle: 'Reference only — not scored',
    },
    {
      label: 'Support Channels',
      slug: 'support-channels',
      memberSectionIds: ['support-channels'],
      groupSubtitle: 'Reference only — not scored',
    },
    { label: 'Ease of Contact', slug: 'support-reach', memberSectionIds: ['support-reach'] },
    { label: 'Response Speed', slug: 'support-speed', memberSectionIds: ['support-speed'] },
    { label: 'Helpfulness', slug: 'support-helpfulness', memberSectionIds: ['support-helpfulness'] },
  ],
  'pricing/plan-value': [
    { label: 'Monthly Price', slug: 'monthly-price', memberSectionIds: ['monthly-price'] },
    { label: 'Annual Price', slug: 'annual-price', memberSectionIds: ['annual-price'] },
    { label: 'Included Features', slug: 'included-features', memberSectionIds: ['included-features'] },
    { label: 'Included Credits', slug: 'included-credits', memberSectionIds: ['included-credits'] },
    { label: 'Plan Limits', slug: 'plan-limits', memberSectionIds: ['plan-limits'] },
    { label: 'Annual Discount', slug: 'annual-discount', memberSectionIds: ['annual-discount'] },
  ],
  'pricing/usage-costs': [
    { label: 'Image Cost', slug: 'image-cost', memberSectionIds: ['image-cost'] },
    { label: 'Video Cost', slug: 'video-cost', memberSectionIds: ['video-cost'] },
    { label: 'Voice Cost', slug: 'voice-cost', memberSectionIds: ['voice-cost'] },
    { label: 'Call Cost', slug: 'call-cost', memberSectionIds: ['call-cost'] },
    { label: 'Top-Up Value', slug: 'top-up-value', memberSectionIds: ['top-up-value'] },
    { label: 'Monthly Spend', slug: 'monthly-spend', memberSectionIds: ['monthly-spend'] },
  ],
  'pricing/free-access': [
    { label: 'Free Chat', slug: 'free-chat', memberSectionIds: ['free-chat'] },
    { label: 'Free Images', slug: 'free-images', memberSectionIds: ['free-images'] },
    { label: 'Free Video', slug: 'free-video', memberSectionIds: ['free-video'] },
    { label: 'Free Voice', slug: 'free-voice', memberSectionIds: ['free-voice'] },
    { label: 'Free Characters', slug: 'free-characters', memberSectionIds: ['free-characters'] },
    { label: 'Free Value', slug: 'free-value', memberSectionIds: ['free-value'] },
  ],
  'pricing/billing': [
    { label: 'Pricing Clarity', slug: 'pricing-clarity', memberSectionIds: ['pricing-clarity'] },
    { label: 'Paywalls', slug: 'paywalls', memberSectionIds: ['paywalls'] },
    { label: 'Credit Expiry', slug: 'credit-expiry', memberSectionIds: ['credit-expiry'] },
    { label: 'Refunds', slug: 'refunds', memberSectionIds: ['refunds'] },
    { label: 'Cancellation', slug: 'cancellation', memberSectionIds: ['cancellation'] },
    { label: 'Payment Privacy', slug: 'payment-privacy', memberSectionIds: ['payment-privacy'] },
  ],
};

export function listPublicEvidenceSubscoreKeys(): string[] {
  return Object.keys(PUBLIC_EVIDENCE_GROUP_DISPLAY);
}

export function getPublicEvidenceGroupDisplay(
  categoryKey: string,
  subscoreSlug: string,
): PublicEvidenceGroupDisplay[] | undefined {
  return PUBLIC_EVIDENCE_GROUP_DISPLAY[`${categoryKey}/${subscoreSlug}`];
}

export function getPublicEvidenceGroups(
  categoryKey: string,
  subscoreSlug: string,
): PublicEvidenceGroup[] | undefined {
  const groups = getPublicEvidenceGroupDisplay(categoryKey, subscoreSlug);
  if (!groups) return undefined;
  return groups.map((group) => ({
    label: group.label,
    slug: group.slug,
    memberSlugs: group.memberSectionIds,
  }));
}

export function getPublicContributors(
  categoryKey: string,
  subscoreSlug: string,
  subscoreName: string,
): PublicContributorNode[] | undefined {
  const groups = getPublicEvidenceGroups(categoryKey, subscoreSlug);
  if (!groups) return undefined;

  return groups.map((group) => ({
    label: group.label,
    slug: group.slug,
    href: testContributorUrl(categoryKey, subscoreName, group.slug),
  }));
}
