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

/** Public-facing evidence groups that may wrap several DB evidence definitions. */
const PUBLIC_EVIDENCE_GROUPS: Record<string, PublicEvidenceGroup[]> = {
  'characters/variety': [
    {
      label: 'Amount',
      slug: 'amount',
      memberSlugs: [
        'female-count',
        'male-count',
        'transgender-count',
        'non-binary-count',
        'other-count',
      ],
    },
    {
      label: 'Styles',
      slug: 'styles',
      memberSlugs: ['styles'],
    },
    {
      label: 'Genders',
      slug: 'genders',
      memberSlugs: [
        'female-count',
        'male-count',
        'transgender-count',
        'non-binary-count',
        'other-count',
      ],
    },
    {
      label: 'Ethnicities',
      slug: 'ethnicities',
      memberSlugs: ['ethnicities'],
    },
    {
      label: 'Personalities',
      slug: 'personalities',
      memberSlugs: ['personalities'],
    },
    {
      label: 'Scenarios',
      slug: 'scenarios',
      memberSlugs: ['scenarios'],
    },
  ],
  'characters/discovery': [
    { label: 'Filters', slug: 'filters', memberSlugs: ['filters'] },
    { label: 'Categories', slug: 'categories', memberSlugs: ['categories'] },
    { label: 'Search', slug: 'search', memberSlugs: ['search'] },
    { label: 'Browsing', slug: 'browsing', memberSlugs: ['browsing'] },
  ],
  'characters/quality': [
    { label: 'Duplicates', slug: 'duplicates', memberSlugs: ['duplicates'] },
    { label: 'Originality', slug: 'originality', memberSlugs: ['originality'] },
    { label: 'Profile Quality', slug: 'profile-quality', memberSlugs: ['profile-quality'] },
    { label: 'Visual Quality', slug: 'visual-quality', memberSlugs: ['visual-quality'] },
  ],
  'customization/appearance': [
    { label: 'Age', slug: 'age', memberSlugs: ['age'] },
    { label: 'Ethnicity', slug: 'ethnicity', memberSlugs: ['ethnicity'] },
    { label: 'Eye Color', slug: 'eye-color', memberSlugs: ['eye-color'] },
    { label: 'Body Type', slug: 'body-type', memberSlugs: ['body-type'] },
    { label: 'Breast Size', slug: 'breast-size', memberSlugs: ['breast-size'] },
    { label: 'Hair Style', slug: 'hair-style', memberSlugs: ['hair-style'] },
    { label: 'Hair Color', slug: 'hair-color', memberSlugs: ['hair-color'] },
    { label: 'Outfits', slug: 'outfits', memberSlugs: ['outfits'] },
    {
      label: 'Personality Presets',
      slug: 'creator-personalities',
      memberSlugs: ['creator-personalities'],
    },
  ],
  'customization/personality': [
    { label: 'Traits', slug: 'traits', memberSlugs: ['traits'] },
    { label: 'Interests', slug: 'interests', memberSlugs: ['interests'] },
    { label: 'Relationship', slug: 'relationship', memberSlugs: ['relationship'] },
    { label: 'Role', slug: 'role', memberSlugs: ['role'] },
    { label: 'Voice', slug: 'voice', memberSlugs: ['voice'] },
    { label: 'Kink Options', slug: 'kink-options', memberSlugs: ['kink-options'] },
  ],
  'customization/control': [
    { label: 'Custom Prompts', slug: 'custom-prompts', memberSlugs: ['custom-prompts'] },
    { label: 'Editing', slug: 'editing', memberSlugs: ['editing'] },
    { label: 'Preview', slug: 'preview', memberSlugs: ['preview'] },
  ],
  'chat/understanding': [
    { label: 'Memory', slug: 'memory', memberSlugs: ['memory'] },
    { label: 'Relevance', slug: 'relevance', memberSlugs: ['relevance'] },
    { label: 'Context', slug: 'context', memberSlugs: ['context'] },
    { label: 'Instructions', slug: 'instructions', memberSlugs: ['instructions'] },
    { label: 'Roleplay Accuracy', slug: 'roleplay-accuracy', memberSlugs: ['roleplay-accuracy'] },
  ],
  'chat/realism': [
    { label: 'Naturalness', slug: 'naturalness', memberSlugs: ['naturalness'] },
    { label: 'Personality', slug: 'personality', memberSlugs: ['personality'] },
    { label: 'Roleplay', slug: 'roleplay', memberSlugs: ['roleplay'] },
    { label: 'Initiative', slug: 'initiative', memberSlugs: ['initiative'] },
    { label: 'Emotion', slug: 'emotion', memberSlugs: ['emotion'] },
    { label: 'Style', slug: 'style', memberSlugs: ['style'] },
  ],
  'chat/reliability': [
    { label: 'Repetition', slug: 'repetition', memberSlugs: ['repetition'] },
    { label: 'Refusals', slug: 'refusals', memberSlugs: ['refusals'] },
    { label: 'Reply Speed', slug: 'reply-speed', memberSlugs: ['reply-speed'] },
    { label: 'Errors', slug: 'errors', memberSlugs: ['errors'] },
    { label: 'Consistency', slug: 'consistency', memberSlugs: ['consistency'] },
    { label: 'Recovery', slug: 'recovery', memberSlugs: ['recovery'] },
  ],
  'chat-features/media': [
    { label: 'Images Sent', slug: 'images-sent', memberSlugs: ['images-sent'] },
    { label: 'Images Received', slug: 'images-received', memberSlugs: ['images-received'] },
    { label: 'Voice Sent', slug: 'voice-sent', memberSlugs: ['voice-sent'] },
    { label: 'Voice Received', slug: 'voice-received', memberSlugs: ['voice-received'] },
    { label: 'Chat Video', slug: 'chat-video', memberSlugs: ['chat-video'] },
    { label: 'GIFs', slug: 'gifs', memberSlugs: ['gifs'] },
    { label: 'Reactions', slug: 'reactions', memberSlugs: ['reactions'] },
  ],
  'chat-features/interaction': [
    { label: 'Voice Calls', slug: 'voice-calls', memberSlugs: ['voice-calls'] },
    { label: 'Chat Modes', slug: 'chat-modes', memberSlugs: ['chat-modes'] },
    { label: 'Mode Types', slug: 'mode-types', memberSlugs: ['mode-types'] },
    { label: 'Group Chat', slug: 'group-chat', memberSlugs: ['group-chat'] },
    { label: 'Double Texting', slug: 'double-texting', memberSlugs: ['double-texting'] },
    { label: 'Proactive Messages', slug: 'proactive-messages', memberSlugs: ['proactive-messages'] },
  ],
  'chat-features/controls': [
    { label: 'Edit Messages', slug: 'edit-messages', memberSlugs: ['edit-messages'] },
    { label: 'Delete Messages', slug: 'delete-messages', memberSlugs: ['delete-messages'] },
    { label: 'Regenerate Replies', slug: 'regenerate-replies', memberSlugs: ['regenerate-replies'] },
    { label: 'Save Memories', slug: 'save-memories', memberSlugs: ['save-memories'] },
    { label: 'Edit Memories', slug: 'edit-memories', memberSlugs: ['edit-memories'] },
    { label: 'Reset Chat', slug: 'reset-chat', memberSlugs: ['reset-chat'] },
    { label: 'Export Chat', slug: 'export-chat', memberSlugs: ['export-chat'] },
  ],
  'chat-features/platform-extras': [
    { label: 'Live Cam', slug: 'live-cam', memberSlugs: ['live-cam'] },
    { label: 'Other Extras', slug: 'other-extras', memberSlugs: ['other-extras'] },
  ],
  'images/quality': [
    { label: 'Realism', slug: 'realism', memberSlugs: ['realism'] },
    { label: 'Visual Errors', slug: 'visual-errors', memberSlugs: ['visual-errors'] },
    { label: 'Composition', slug: 'composition', memberSlugs: ['composition'] },
    { label: 'Resolution', slug: 'resolution', memberSlugs: ['resolution'] },
  ],
  'images/accuracy': [
    { label: 'Prompt Accuracy', slug: 'prompt-accuracy', memberSlugs: ['prompt-accuracy'] },
    {
      label: 'Character Consistency',
      slug: 'character-consistency',
      memberSlugs: ['character-consistency'],
    },
    { label: 'Face Consistency', slug: 'face-consistency', memberSlugs: ['face-consistency'] },
    { label: 'Body Consistency', slug: 'body-consistency', memberSlugs: ['body-consistency'] },
    { label: 'Style Consistency', slug: 'style-consistency', memberSlugs: ['style-consistency'] },
    { label: 'Editing Accuracy', slug: 'editing-accuracy', memberSlugs: ['editing-accuracy'] },
  ],
  'images/experience': [
    { label: 'Speed', slug: 'speed', memberSlugs: ['speed'] },
    { label: 'Failures', slug: 'failures', memberSlugs: ['failures'] },
    { label: 'Chat Generation', slug: 'chat-generation', memberSlugs: ['chat-generation'] },
    { label: 'Separate Generator', slug: 'separate-generator', memberSlugs: ['separate-generator'] },
    { label: 'Custom Prompts', slug: 'custom-prompts', memberSlugs: ['custom-prompts'] },
    { label: 'Image Editing', slug: 'image-editing', memberSlugs: ['image-editing'] },
    { label: 'NSFW Support', slug: 'nsfw-support', memberSlugs: ['nsfw-support'] },
  ],
  'video/capabilities': [
    { label: 'Text-to-Video', slug: 'text-to-video', memberSlugs: ['text-to-video'] },
    { label: 'Image-to-Video', slug: 'image-to-video', memberSlugs: ['image-to-video'] },
    { label: 'Chat Video', slug: 'chat-video', memberSlugs: ['chat-video'] },
    { label: 'Audio', slug: 'audio', memberSlugs: ['audio'] },
    { label: 'Maximum Length', slug: 'maximum-length', memberSlugs: ['maximum-length'] },
    { label: 'Maximum Resolution', slug: 'maximum-resolution', memberSlugs: ['maximum-resolution'] },
  ],
  'video/quality': [
    { label: 'Motion', slug: 'motion', memberSlugs: ['motion'] },
    { label: 'Prompt Accuracy', slug: 'accuracy', memberSlugs: ['accuracy'] },
    { label: 'Character Consistency', slug: 'character-consistency', memberSlugs: ['character-consistency'] },
    { label: 'Visual Errors', slug: 'visual-errors', memberSlugs: ['visual-errors'] },
    { label: 'Frame Consistency', slug: 'frame-consistency', memberSlugs: ['frame-consistency'] },
  ],
  'video/experience': [
    { label: 'Speed', slug: 'speed', memberSlugs: ['speed'] },
    { label: 'Failures', slug: 'failures', memberSlugs: ['failures'] },
    { label: 'Ease of Use', slug: 'ease-of-use', memberSlugs: ['ease-of-use'] },
    { label: 'Regeneration', slug: 'regeneration', memberSlugs: ['regeneration'] },
  ],
  'privacy/data-use': [
    { label: 'Training', slug: 'training', memberSlugs: ['training'] },
    { label: 'Human Review', slug: 'human-review', memberSlugs: ['human-review'] },
    { label: 'Data Sharing', slug: 'data-sharing', memberSlugs: ['data-sharing'] },
    { label: 'Advertising', slug: 'advertising', memberSlugs: ['advertising'] },
    { label: 'Retention', slug: 'retention', memberSlugs: ['retention'] },
    { label: 'Policy Clarity', slug: 'policy-clarity', memberSlugs: ['policy-clarity'] },
  ],
  'privacy/user-control': [
    { label: 'Delete Chats', slug: 'delete-chats', memberSlugs: ['delete-chats'] },
    { label: 'Delete Account', slug: 'delete-account', memberSlugs: ['delete-account'] },
    { label: 'Delete Personal Data', slug: 'delete-personal-data', memberSlugs: ['delete-personal-data'] },
    { label: 'Training Opt-Out', slug: 'training-opt-out', memberSlugs: ['training-opt-out'] },
    { label: 'Export Data', slug: 'export-data', memberSlugs: ['export-data'] },
  ],
  'privacy/security': [
    { label: 'Encryption', slug: 'encryption', memberSlugs: ['encryption'] },
    { label: 'Two-Factor Authentication', slug: 'two-factor-authentication', memberSlugs: ['two-factor-authentication'] },
    { label: 'Billing Descriptor', slug: 'billing-descriptor', memberSlugs: ['billing-descriptor'] },
    { label: 'Security Incidents', slug: 'security-incidents', memberSlugs: ['security-incidents'] },
  ],
  'privacy/support': [
    { label: 'Support Available', slug: 'support-available', memberSlugs: ['support-available'] },
    { label: 'Support Channels', slug: 'support-channels', memberSlugs: ['support-channels'] },
    { label: 'Ease of Contact', slug: 'support-reach', memberSlugs: ['support-reach'] },
    { label: 'Response Speed', slug: 'support-speed', memberSlugs: ['support-speed'] },
    { label: 'Helpfulness', slug: 'support-helpfulness', memberSlugs: ['support-helpfulness'] },
  ],
  'pricing/plan-value': [
    { label: 'Monthly Price', slug: 'monthly-price', memberSlugs: ['monthly-price'] },
    { label: 'Annual Price', slug: 'annual-price', memberSlugs: ['annual-price'] },
    { label: 'Included Features', slug: 'included-features', memberSlugs: ['included-features'] },
    { label: 'Included Credits', slug: 'included-credits', memberSlugs: ['included-credits'] },
    { label: 'Plan Limits', slug: 'plan-limits', memberSlugs: ['plan-limits'] },
    { label: 'Annual Discount', slug: 'annual-discount', memberSlugs: ['annual-discount'] },
  ],
  'pricing/usage-costs': [
    { label: 'Image Cost', slug: 'image-cost', memberSlugs: ['image-cost'] },
    { label: 'Video Cost', slug: 'video-cost', memberSlugs: ['video-cost'] },
    { label: 'Voice Cost', slug: 'voice-cost', memberSlugs: ['voice-cost'] },
    { label: 'Call Cost', slug: 'call-cost', memberSlugs: ['call-cost'] },
    { label: 'Top-Up Value', slug: 'top-up-value', memberSlugs: ['top-up-value'] },
    { label: 'Monthly Spend', slug: 'monthly-spend', memberSlugs: ['monthly-spend'] },
  ],
  'pricing/free-access': [
    { label: 'Free Chat', slug: 'free-chat', memberSlugs: ['free-chat'] },
    { label: 'Free Images', slug: 'free-images', memberSlugs: ['free-images'] },
    { label: 'Free Video', slug: 'free-video', memberSlugs: ['free-video'] },
    { label: 'Free Voice', slug: 'free-voice', memberSlugs: ['free-voice'] },
    { label: 'Free Characters', slug: 'free-characters', memberSlugs: ['free-characters'] },
    { label: 'Free Value', slug: 'free-value', memberSlugs: ['free-value'] },
    { label: 'Restrictions', slug: 'restrictions', memberSlugs: ['restrictions'] },
  ],
  'pricing/billing': [
    { label: 'Pricing Clarity', slug: 'pricing-clarity', memberSlugs: ['pricing-clarity'] },
    { label: 'Paywalls', slug: 'paywalls', memberSlugs: ['paywalls'] },
    { label: 'Credit Expiry', slug: 'credit-expiry', memberSlugs: ['credit-expiry'] },
    { label: 'Refunds', slug: 'refunds', memberSlugs: ['refunds'] },
    { label: 'Cancellation', slug: 'cancellation', memberSlugs: ['cancellation'] },
    { label: 'Payment Privacy', slug: 'payment-privacy', memberSlugs: ['payment-privacy'] },
  ],
};

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
    { label: 'Restrictions', slug: 'restrictions', memberSectionIds: ['restrictions'] },
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
  return PUBLIC_EVIDENCE_GROUPS[`${categoryKey}/${subscoreSlug}`];
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
