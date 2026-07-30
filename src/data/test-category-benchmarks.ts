import type { CategoryBenchmarkPanelConfig } from '../lib/test-category-benchmarks/types';

const standardTiers = {
  good: 'Good',
  typical: 'Typical',
  weak: 'Weak',
} as const;

/** Category-level benchmark panels replaced by `goodLooksLike` in test-category-methodology.ts. */
export const categoryBenchmarkConfigs: Record<string, CategoryBenchmarkPanelConfig> = {};

/** Benchmark panels for individual subscore methodology pages. */
export const subscoreBenchmarkConfigs: Record<string, CategoryBenchmarkPanelConfig> = {
  'characters/variety': {
    categoryKey: 'characters-variety',
    title: 'What good Variety looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Styles',
        good: '5+',
        typical: '3–4',
        weak: '0–2',
        evidenceRef: { category: 'characters', slug: 'styles' },
      },
      {
        label: 'Ethnicities',
        good: '11+',
        typical: '6–10',
        weak: '0–5',
        evidenceRef: { category: 'characters', slug: 'ethnicities' },
      },
      {
        label: 'Personalities',
        good: '11+',
        typical: '6–10',
        weak: '0–5',
        evidenceRef: { category: 'characters', slug: 'personalities' },
      },
    ],
    minimums: [
      { label: 'Female characters', value: '81+', evidenceRef: { category: 'characters', slug: 'female-count' } },
      { label: 'Scenarios', value: '11+', evidenceRef: { category: 'characters', slug: 'scenarios' } },
      { label: 'Gender groups', value: '3+', evidenceRef: { category: 'characters', slug: 'male-count' } },
    ],
    redFlags: [
      'A large library that repeats the same personalities and scenarios',
      'Only one visual style across the whole catalog',
      'Gender or ethnicity labels missing even when the library looks diverse',
    ],
    footer: 'testing',
  },

  'characters/discovery': {
    categoryKey: 'characters-discovery',
    title: 'What good Discovery looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Useful filters',
        good: '7+',
        typical: '4–6',
        weak: '0–3',
        evidenceRef: { category: 'characters', slug: 'filters' },
      },
      {
        label: 'Useful categories',
        good: '7+',
        typical: '4–6',
        weak: '0–3',
        evidenceRef: { category: 'characters', slug: 'categories' },
      },
      {
        label: 'Search',
        good: 'Names and keywords work',
        typical: 'Some searches fail',
        weak: 'No useful search',
      },
    ],
    minimums: [
      { label: 'Filters', value: 'Actually narrow the results' },
      { label: 'Categories', value: 'Lead to different groups of characters' },
      { label: 'Search', value: 'Finds existing names and general keywords' },
      { label: 'Browsing', value: 'Most tasks can be completed smoothly' },
    ],
    redFlags: [
      'Search only works when you enter an exact character name',
      'Filters are available but barely change the results',
      'Several categories show almost the same characters',
      'A huge library with no useful way to narrow it down',
    ],
    footer: 'testing',
  },

  'characters/quality': {
    categoryKey: 'characters-quality',
    title: 'What good Quality looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Duplicate rate',
        good: '20% or less',
        typical: '21–40%',
        weak: 'Over 40%',
        evidenceRef: { category: 'characters', slug: 'duplicates' },
      },
      {
        label: 'Original characters',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'characters', slug: 'originality' },
      },
      {
        label: 'Profile Quality',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'characters', slug: 'profile-quality' },
      },
      {
        label: 'Visual Quality',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'characters', slug: 'visual-quality' },
      },
    ],
    minimums: [
      { label: 'Duplicates', value: 'Most profiles are clearly different' },
      { label: 'Originality', value: 'Characters differ in more than their name or picture' },
      { label: 'Profile Quality', value: 'Profiles explain who the character is' },
      { label: 'Visual Quality', value: 'Main images are clear and free from major problems' },
    ],
    redFlags: [
      'Several profiles using almost the same image and description',
      'Different characters that all have the same personality or scenario',
      'Profiles with little more than a name and picture',
      'Broken faces, bodies, or heavily damaged profile images',
    ],
    footer: 'testing',
  },

  'customization/appearance': {
    categoryKey: 'customization-appearance',
    title: 'What good Appearance looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Body types',
        good: '6+',
        typical: '3–5',
        weak: '0–2',
        evidenceRef: { category: 'customization', slug: 'body-type' },
      },
      {
        label: 'Hairstyles',
        good: '13+',
        typical: '4–12',
        weak: '0–3',
        evidenceRef: { category: 'customization', slug: 'hair-style' },
      },
      {
        label: 'Outfits',
        good: '26+',
        typical: '6–25',
        weak: '0–5',
        evidenceRef: { category: 'customization', slug: 'outfits' },
      },
    ],
    minimums: [
      { label: 'Age', value: 'At least 3 useful options', evidenceRef: { category: 'customization', slug: 'age' } },
      { label: 'Ethnicity', value: 'At least 6 options', evidenceRef: { category: 'customization', slug: 'ethnicity' } },
      { label: 'Eye Color', value: 'At least 4 options', evidenceRef: { category: 'customization', slug: 'eye-color' } },
      { label: 'Hair Color', value: 'More than a few basic colors', evidenceRef: { category: 'customization', slug: 'hair-color' } },
      {
        label: 'Personality Presets',
        value: 'Enough choice to create different character types',
        evidenceRef: { category: 'customization', slug: 'creator-personalities' },
      },
    ],
    redFlags: [
      'Only two or three choices for most settings',
      'Hairstyles and body types that barely look different',
      'Lots of color choices but very few real appearance options',
      'No clothing choice beyond one default outfit',
      'Most created characters end up looking almost identical',
    ],
    footer: 'testing',
  },

  'customization/personality': {
    categoryKey: 'customization-personality',
    title: 'What good Personality looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Traits',
        good: '21+',
        typical: '6–20',
        weak: '0–5',
        evidenceRef: { category: 'customization', slug: 'traits' },
      },
      {
        label: 'Interests',
        good: '21+',
        typical: '6–20',
        weak: '0–5',
        evidenceRef: { category: 'customization', slug: 'interests' },
      },
      {
        label: 'Relationship types',
        good: '13+',
        typical: '5–12',
        weak: '0–4',
        evidenceRef: { category: 'customization', slug: 'relationship' },
      },
    ],
    minimums: [
      { label: 'Custom interest', value: 'You can add your own interest' },
      { label: 'Custom role', value: 'You can write your own role or occupation' },
      { label: 'Voice', value: 'The available voices sound clearly different' },
      {
        label: 'Relationship',
        value: 'More than one basic relationship type',
        evidenceRef: { category: 'customization', slug: 'relationship' },
      },
      {
        label: 'Kink Options',
        value: 'Useful choices when this feature is offered',
        evidenceRef: { category: 'customization', slug: 'kink-options' },
      },
    ],
    redFlags: [
      'Lots of personality labels that mean almost the same thing',
      'No way to add your own interests or role',
      'Every character uses a very similar relationship style',
      'Several voice options that all sound almost identical',
      'Important choices only available through a custom prompt',
    ],
    footer: 'testing',
  },

  'customization/control': {
    categoryKey: 'customization-control',
    title: 'What good Control looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Custom Prompts',
        good: 'Fully available',
        typical: 'Available with limits',
        weak: 'Not available',
      },
      {
        label: 'Editing',
        good: '4–5 areas editable',
        typical: '2–3 areas editable',
        weak: '0–1 area editable',
      },
      {
        label: 'Preview',
        good: 'Full preview',
        typical: 'Limited preview',
        weak: 'No preview',
      },
    ],
    minimums: [
      { label: 'Custom Prompts', value: 'You can enter your own written instructions' },
      { label: 'Editing', value: 'Appearance and personality can be changed later' },
      { label: 'Preview', value: 'You can see a picture or description before confirming' },
    ],
    redFlags: [
      'The creator only offers presets',
      'Custom instructions are heavily restricted',
      'The character cannot be changed after creation',
      'You must spend credits before seeing the result',
      'The preview shows almost no useful information',
    ],
    footer: 'testing',
  },

  'chat/understanding': {
    categoryKey: 'chat-understanding',
    title: 'What good Understanding looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Facts remembered',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'chat', slug: 'memory' },
      },
      {
        label: 'Questions answered directly',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'chat', slug: 'relevance' },
      },
      {
        label: 'Roleplay checks passed',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'chat', slug: 'roleplay-accuracy' },
      },
    ],
    minimums: [
      { label: 'Context', value: 'Correctly uses earlier messages in most chats' },
      {
        label: 'Instructions',
        value: 'Follows at least 80% of the rules',
        evidenceRef: { category: 'chat', slug: 'instructions' },
      },
      {
        label: 'Memory',
        value: 'Remembers important facts later in the conversation',
        evidenceRef: { category: 'chat', slug: 'memory' },
      },
      {
        label: 'Relevance',
        value: 'Answers the question instead of changing the subject',
        evidenceRef: { category: 'chat', slug: 'relevance' },
      },
      {
        label: 'Roleplay Accuracy',
        value: 'Keeps the role, setting, and situation clear',
        evidenceRef: { category: 'chat', slug: 'roleplay-accuracy' },
      },
    ],
    redFlags: [
      'Forgets your name or other basic details almost immediately',
      'Avoids direct questions or changes the subject',
      'Only reacts to the latest message and ignores earlier context',
      'Repeatedly breaks simple rules',
      'Loses track of who is playing which role',
    ],
    footer: 'testing',
  },

  'chat/realism': {
    categoryKey: 'chat-realism',
    title: 'What good Realism looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Natural replies',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'chat', slug: 'naturalness' },
      },
      {
        label: 'Roleplay checks passed',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'chat', slug: 'roleplay' },
      },
      {
        label: 'Replies matching the selected style',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'chat', slug: 'style' },
      },
    ],
    minimums: [
      {
        label: 'Personality',
        value: 'Character stays consistent in at least 4 of 5 chats',
        evidenceRef: { category: 'chat', slug: 'personality' },
      },
      {
        label: 'Initiative',
        value: 'Moves the conversation forward in most tested moments',
        evidenceRef: { category: 'chat', slug: 'initiative' },
      },
      {
        label: 'Emotion',
        value: 'Responds properly to happy, sad, angry, nervous, and romantic messages',
        evidenceRef: { category: 'chat', slug: 'emotion' },
      },
      {
        label: 'Roleplay',
        value: 'Adds details instead of only reacting with short answers',
        evidenceRef: { category: 'chat', slug: 'roleplay' },
      },
      {
        label: 'Style',
        value: 'The selected communication style is easy to notice',
        evidenceRef: { category: 'chat', slug: 'style' },
      },
    ],
    redFlags: [
      'Replies sound copied, robotic, or overly formal',
      'The character loses her personality after a few messages',
      'Roleplay feels flat and gives you nothing to respond to',
      'You need to ask every question and move every conversation forward',
      'Emotional messages receive generic or inappropriate replies',
      'The selected chat style barely changes how the character talks',
    ],
    footer: 'testing',
  },

  'chat/reliability': {
    categoryKey: 'chat-reliability',
    title: 'What good Reliability looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Repetition problems',
        good: '0–2 per 50 replies',
        typical: '3–4',
        weak: '5+',
        evidenceRef: { category: 'chat', slug: 'repetition' },
      },
      {
        label: 'Unnecessary refusals',
        good: '0–2 per 50 prompts',
        typical: '3–4',
        weak: '5+',
        evidenceRef: { category: 'chat', slug: 'refusals' },
      },
      {
        label: 'Median reply speed',
        good: '4 seconds or less',
        typical: '5–6 seconds',
        weak: 'Over 6 seconds',
        evidenceRef: { category: 'chat', slug: 'reply-speed' },
      },
    ],
    minimums: [
      { label: 'Errors', value: '2 or fewer per 50 replies', evidenceRef: { category: 'chat', slug: 'errors' } },
      {
        label: 'Consistency',
        value: 'Contradicts fewer than 20% of tested facts',
        evidenceRef: { category: 'chat', slug: 'consistency' },
      },
      {
        label: 'Recovery',
        value: 'Fixes at least 4 of 5 misunderstandings',
        evidenceRef: { category: 'chat', slug: 'recovery' },
      },
      { label: 'Repetition', value: 'Does not keep recycling the same answer' },
      { label: 'Reply Speed', value: 'Conversation does not feel slow or interrupted' },
    ],
    redFlags: [
      'Repeats the same phrases or ideas several times',
      'Refuses harmless messages that follow the platform\u2019s rules',
      'Regularly sends empty, broken, or unrelated replies',
      'Contradicts facts established earlier in the conversation',
      'Ignores corrections and keeps making the same mistake',
      'Long reply times that make the chat feel unresponsive',
    ],
    footer: 'testing',
  },

  'chat-features/media': {
    categoryKey: 'chat-features-media',
    title: 'What good Media looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Images Received',
        good: 'Worked in all 3 chats',
        typical: 'Only some attempts worked',
        weak: 'No images received',
        evidenceRef: { category: 'chat-features', slug: 'images-received' },
      },
      {
        label: 'Voice Received',
        good: 'Worked in all 3 chats',
        typical: 'Restrictions or failures',
        weak: 'No voice replies',
        evidenceRef: { category: 'chat-features', slug: 'voice-received' },
      },
      {
        label: 'Chat Video',
        good: 'Worked in all 3 chats',
        typical: 'Only some attempts worked',
        weak: 'No chat video',
        evidenceRef: { category: 'chat-features', slug: 'chat-video' },
      },
    ],
    minimums: [
      {
        label: 'Images Sent',
        value: 'Normal image files can be uploaded',
        evidenceRef: { category: 'chat-features', slug: 'images-sent' },
      },
      {
        label: 'Images Received',
        value: 'The character can send an image inside chat',
        evidenceRef: { category: 'chat-features', slug: 'images-received' },
      },
      {
        label: 'Voice Sent',
        value: 'The user can record or upload a voice message',
        evidenceRef: { category: 'chat-features', slug: 'voice-sent' },
      },
      {
        label: 'Voice Received',
        value: 'The character can reply with voice',
        evidenceRef: { category: 'chat-features', slug: 'voice-received' },
      },
      {
        label: 'Reactions',
        value: 'Users can react to normal chat messages',
        evidenceRef: { category: 'chat-features', slug: 'reactions' },
      },
    ],
    redFlags: [
      'Media features are advertised but unavailable after signing up',
      'Images or voice replies only work with a small number of characters',
      'Requests fail regularly but still use credits',
      'Videos open outside the chat instead of appearing in the conversation',
      'Voice messages exist but every character uses the same generic voice',
      'Reactions or GIFs are shown in the interface but do not work properly',
    ],
    footer: 'testing',
  },

  'chat-features/interaction': {
    categoryKey: 'chat-features-interaction',
    title: 'What good Interaction looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Voice calls',
        good: 'All 3 calls connect',
        typical: 'Some calls or important limits',
        weak: 'Calls unavailable',
        evidenceRef: { category: 'chat-features', slug: 'voice-calls' },
      },
      {
        label: 'Chat modes',
        good: '7+',
        typical: '3–6',
        weak: '0–2',
        evidenceRef: { category: 'chat-features', slug: 'chat-modes' },
      },
      {
        label: 'Double texts',
        good: '16+ per 100 messages',
        typical: '1–15',
        weak: 'None',
        evidenceRef: { category: 'chat-features', slug: 'double-texting' },
      },
    ],
    minimums: [
      {
        label: 'Voice Calls',
        value: 'Calls connect and stay stable',
        evidenceRef: { category: 'chat-features', slug: 'voice-calls' },
      },
      {
        label: 'Chat Modes',
        value: 'Modes clearly change how the chat works',
        evidenceRef: { category: 'chat-features', slug: 'chat-modes' },
      },
      {
        label: 'Mode Types',
        value: 'Tested modes work across several messages',
        evidenceRef: { category: 'chat-features', slug: 'mode-types' },
      },
      {
        label: 'Group Chat',
        value: 'More than one character can join a conversation',
        evidenceRef: { category: 'chat-features', slug: 'group-chat' },
      },
      {
        label: 'Proactive Messages',
        value: 'The character can message first',
        evidenceRef: { category: 'chat-features', slug: 'proactive-messages' },
      },
    ],
    redFlags: [
      'Voice calls are advertised but rarely connect',
      'Chat modes have different names but barely change the conversation',
      'Group chats become confusing because characters speak as each other',
      'Every reply appears as one large message',
      'The character never contacts you first',
      'Features only work with a small number of characters',
    ],
    footer: 'testing',
  },

  'chat-features/controls': {
    categoryKey: 'chat-features-controls',
    title: 'What good Controls looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Message controls',
        good: 'Edit, delete, and regenerate work',
        typical: 'Only some controls work',
        weak: 'No useful message controls',
      },
      {
        label: 'Memory controls',
        good: 'Save, view, edit, and delete memories',
        typical: 'Only basic memory controls',
        weak: 'No memory controls',
      },
      {
        label: 'Chat management',
        good: 'Reset and export both work',
        typical: 'Only one is available',
        weak: 'Neither is available',
      },
    ],
    minimums: [
      {
        label: 'Edit Messages',
        value: 'Previously sent messages can be corrected',
        evidenceRef: { category: 'chat-features', slug: 'edit-messages' },
      },
      {
        label: 'Delete Messages',
        value: 'Individual messages can be removed',
        evidenceRef: { category: 'chat-features', slug: 'delete-messages' },
      },
      {
        label: 'Regenerate Replies',
        value: 'A bad AI reply can be retried',
        evidenceRef: { category: 'chat-features', slug: 'regenerate-replies' },
      },
      {
        label: 'Save Memories',
        value: 'Important information can be saved manually',
        evidenceRef: { category: 'chat-features', slug: 'save-memories' },
      },
      {
        label: 'Edit Memories',
        value: 'Saved memories can be viewed and corrected',
        evidenceRef: { category: 'chat-features', slug: 'edit-memories' },
      },
      {
        label: 'Reset Chat',
        value: 'A conversation can be restarted',
        evidenceRef: { category: 'chat-features', slug: 'reset-chat' },
      },
      {
        label: 'Export Chat',
        value: 'A copy of the conversation can be downloaded',
        evidenceRef: { category: 'chat-features', slug: 'export-chat' },
      },
    ],
    redFlags: [
      'You need to delete the full chat to fix one message',
      'Regenerated replies are almost identical',
      'Memories are saved automatically but cannot be viewed or corrected',
      'Resetting a chat does not fully clear the old conversation',
      'Export is advertised but the downloaded file is empty or incomplete',
      'Important controls only work on certain devices',
    ],
    footer: 'testing',
  },

  'chat-features/platform-extras': {
    categoryKey: 'chat-features-platform-extras',
    title: 'What good Platform Extras look like',
    intro: '',
    mainSectionTitle: 'Main benchmark',
    tierLabels: {
      good: 'Yes',
      typical: 'Limited',
      weak: 'Not offered',
    },
    mainRows: [
      {
        label: 'Live Cam',
        good: 'The experience is available and works normally',
        typical: 'It works, but important restrictions hold it back',
        weak: 'Neutral — the app is not punished',
        evidenceRef: { category: 'chat-features', slug: 'live-cam' },
      },
    ],
    minimums: [
      { label: 'Access', value: 'Normal paying users can open the feature' },
      { label: 'Experience', value: 'It feels like a webcam-style character experience' },
      { label: 'Supported characters', value: 'The app clearly shows which characters work' },
      { label: 'Restrictions', value: 'Important limits are explained' },
      { label: 'Proof', value: 'We can record screenshots, notes, or other evidence' },
    ],
    redFlags: [
      'Live Cam is advertised but cannot be opened',
      'The “live” experience is only a pre-recorded clip',
      'The feature works with almost no characters',
      'Sessions repeatedly fail after spending credits',
      'Bonus features disappear or move behind another payment',
      'The app lists many extras that barely work',
    ],
    footer: 'testing',
  },

  'images/quality': {
    categoryKey: 'images-quality',
    title: 'What good Quality looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Realism',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'images', slug: 'realism' },
      },
      {
        label: 'Images with major errors',
        good: '20% or less',
        typical: '21–40%',
        weak: 'Over 40%',
        evidenceRef: { category: 'images', slug: 'visual-errors' },
      },
      {
        label: 'Composition',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'images', slug: 'composition' },
      },
    ],
    minimums: [
      {
        label: 'Realism',
        value: 'Faces, bodies, hands, lighting, and backgrounds look believable',
        evidenceRef: { category: 'images', slug: 'realism' },
      },
      {
        label: 'Visual Errors',
        value: 'Most images have no major defects',
        evidenceRef: { category: 'images', slug: 'visual-errors' },
      },
      {
        label: 'Composition',
        value: 'The subject is visible and framed properly',
        evidenceRef: { category: 'images', slug: 'composition' },
      },
      {
        label: 'Resolution',
        value: '1080p or higher',
        evidenceRef: { category: 'images', slug: 'resolution' },
      },
    ],
    redFlags: [
      'Broken hands, faces, or limbs appear regularly',
      'Subjects are accidentally cropped out of the image',
      'The background looks damaged or objects merge together',
      'One good image hides a batch of weak results',
      'The highest-quality download is still very small',
      'Images look unfinished even when the generation technically succeeds',
    ],
    footer: 'testing',
  },

  'images/accuracy': {
    categoryKey: 'images-accuracy',
    title: 'What good Accuracy looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Prompt Accuracy',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'images', slug: 'prompt-accuracy' },
      },
      {
        label: 'Face Consistency',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'images', slug: 'face-consistency' },
      },
      {
        label: 'Editing Accuracy',
        good: '80%+',
        typical: '60–79%',
        weak: 'Under 60%',
        evidenceRef: { category: 'images', slug: 'editing-accuracy' },
      },
    ],
    minimums: [
      {
        label: 'Character Consistency',
        value: 'The character still looks like the same person',
        evidenceRef: { category: 'images', slug: 'character-consistency' },
      },
      {
        label: 'Face Consistency',
        value: 'The face remains recognizable',
        evidenceRef: { category: 'images', slug: 'face-consistency' },
      },
      {
        label: 'Body Consistency',
        value: 'Height, body type, and proportions remain similar',
        evidenceRef: { category: 'images', slug: 'body-consistency' },
      },
      {
        label: 'Style Consistency',
        value: 'The requested art style stays clear',
        evidenceRef: { category: 'images', slug: 'style-consistency' },
      },
      {
        label: 'Editing Accuracy',
        value: 'Only the requested part changes',
        evidenceRef: { category: 'images', slug: 'editing-accuracy' },
      },
    ],
    redFlags: [
      'Important prompt details are regularly ignored',
      'The character gets a different face in every image',
      'Body type or proportions change without being requested',
      'Realistic images suddenly turn into a different art style',
      'A simple clothing edit changes the full image',
      'You need several paid attempts to get the requested result',
    ],
    footer: 'testing',
  },

  'images/experience': {
    categoryKey: 'images-experience',
    title: 'What good Experience looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Generation speed',
        good: '20 seconds or less',
        typical: '21–40 seconds',
        weak: 'Over 40 seconds',
        evidenceRef: { category: 'images', slug: 'speed' },
      },
      {
        label: 'Failed attempts',
        good: '20% or less',
        typical: '21–40%',
        weak: 'Over 40%',
        evidenceRef: { category: 'images', slug: 'failures' },
      },
      {
        label: 'Custom Prompts',
        good: 'Fully available',
        typical: 'Heavily limited',
        weak: 'Not available',
        evidenceRef: { category: 'images', slug: 'custom-prompts' },
      },
    ],
    minimums: [
      {
        label: 'Chat Generation',
        value: 'Images can be requested inside the chat',
        evidenceRef: { category: 'images', slug: 'chat-generation' },
      },
      {
        label: 'Separate Generator',
        value: 'A dedicated image tool is available',
        evidenceRef: { category: 'images', slug: 'separate-generator' },
      },
      {
        label: 'Custom Prompts',
        value: 'Users can enter their own instructions',
        evidenceRef: { category: 'images', slug: 'custom-prompts' },
      },
      {
        label: 'Image Editing',
        value: 'Clothing, background, or pose can be changed',
        evidenceRef: { category: 'images', slug: 'image-editing' },
      },
      {
        label: 'Failures',
        value: 'Most attempts produce a usable image',
        evidenceRef: { category: 'images', slug: 'failures' },
      },
    ],
    redFlags: [
      'Generations regularly get stuck or produce nothing',
      'Failed attempts still use credits',
      'You can only choose from preset prompts',
      'Images can only be created through one limited part of the app',
      'Editing simply creates a completely different image',
      'Adult image support is advertised but repeatedly blocked',
    ],
    footer: 'testing',
  },

  'video/capabilities': {
    categoryKey: 'video-capabilities',
    title: 'What good Capabilities looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Creation options',
        good: 'Text, image, and chat video',
        typical: 'One or two options',
        weak: 'Basic animation only',
        evidenceRef: { category: 'video', slug: 'text-to-video' },
      },
      {
        label: 'Maximum length',
        good: '16+ seconds',
        typical: '6–15 seconds',
        weak: '5 seconds or less',
        evidenceRef: { category: 'video', slug: 'maximum-length' },
      },
      {
        label: 'Maximum resolution',
        good: '1080p or higher',
        typical: '720p',
        weak: '480p',
        evidenceRef: { category: 'video', slug: 'maximum-resolution' },
      },
    ],
    minimums: [
      {
        label: 'Image-to-Video',
        value: 'Three different source images can be animated',
        evidenceRef: { category: 'video', slug: 'image-to-video' },
      },
      {
        label: 'Text-to-Video',
        value: 'Users can describe the video with their own prompt',
        evidenceRef: { category: 'video', slug: 'text-to-video' },
      },
      {
        label: 'Chat Video',
        value: 'A video can be requested inside the conversation',
        evidenceRef: { category: 'video', slug: 'chat-video' },
      },
      {
        label: 'Audio',
        value: 'At least one useful audio type is supported',
        evidenceRef: { category: 'video', slug: 'audio' },
      },
      {
        label: 'Maximum Length',
        value: 'Longer than a basic five-second clip',
        evidenceRef: { category: 'video', slug: 'maximum-length' },
      },
      {
        label: 'Maximum Resolution',
        value: 'At least 720p',
        evidenceRef: { category: 'video', slug: 'maximum-resolution' },
      },
    ],
    redFlags: [
      'Video is only a simple Turn into video button',
      'There is no way to explain what should happen',
      'Videos are limited to five seconds',
      'Audio is advertised but never appears',
      'Chat video requests repeatedly fail',
      'The highest-quality download is still low resolution',
    ],
    footer: 'testing',
  },

  'video/quality': {
    categoryKey: 'video-quality',
    title: 'What good Quality looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Motion',
        good: 'Average 4/5+',
        typical: 'Average 3–3.9/5',
        weak: 'Under 3/5',
        evidenceRef: { category: 'video', slug: 'motion' },
      },
      {
        label: 'Prompt Accuracy',
        good: 'Average 4/5+',
        typical: 'Average 3–3.9/5',
        weak: 'Under 3/5',
        evidenceRef: { category: 'video', slug: 'accuracy' },
      },
      {
        label: 'Character Consistency',
        good: 'Average 4/5+',
        typical: 'Average 3–3.9/5',
        weak: 'Under 3/5',
        evidenceRef: { category: 'video', slug: 'character-consistency' },
      },
    ],
    minimums: [
      {
        label: 'Motion',
        value: 'Body, face, hands, and camera movement look natural',
        evidenceRef: { category: 'video', slug: 'motion' },
      },
      {
        label: 'Prompt Accuracy',
        value: 'Most important instructions are followed',
        evidenceRef: { category: 'video', slug: 'accuracy' },
      },
      {
        label: 'Character Consistency',
        value: 'The same person remains recognizable',
        evidenceRef: { category: 'video', slug: 'character-consistency' },
      },
      {
        label: 'Visual Errors',
        value: 'No major errors in most videos',
        evidenceRef: { category: 'video', slug: 'visual-errors' },
      },
      {
        label: 'Frame Consistency',
        value: 'The video stays stable from beginning to end',
        evidenceRef: { category: 'video', slug: 'frame-consistency' },
      },
    ],
    redFlags: [
      'The face changes halfway through the video',
      'The body or clothing suddenly warps',
      'Movement looks stiff or physically impossible',
      'Important parts of the prompt are ignored',
      'Objects appear, disappear, or merge together',
      'The background flickers throughout the clip',
    ],
    footer: 'testing',
  },

  'video/experience': {
    categoryKey: 'video-experience',
    title: 'What good Experience looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: standardTiers,
    mainRows: [
      {
        label: 'Generation speed',
        good: '2 minutes or less',
        typical: '2–5 minutes',
        weak: 'Over 5 minutes',
        evidenceRef: { category: 'video', slug: 'speed' },
      },
      {
        label: 'Failed attempts',
        good: '20% or less',
        typical: '21–40%',
        weak: 'Over 40%',
        evidenceRef: { category: 'video', slug: 'failures' },
      },
      {
        label: 'Steps to start',
        good: '5 or fewer',
        typical: '6–8',
        weak: '9 or more',
        evidenceRef: { category: 'video', slug: 'ease-of-use' },
      },
    ],
    minimums: [
      {
        label: 'Speed',
        value: 'Most videos finish within a reasonable time',
        evidenceRef: { category: 'video', slug: 'speed' },
      },
      {
        label: 'Failures',
        value: 'Most attempts produce a usable video',
        evidenceRef: { category: 'video', slug: 'failures' },
      },
      {
        label: 'Ease of Use',
        value: 'The generator is easy to find and understand',
        evidenceRef: { category: 'video', slug: 'ease-of-use' },
      },
      {
        label: 'Regeneration',
        value: 'Finished videos can be retried without starting over',
        evidenceRef: { category: 'video', slug: 'regeneration' },
      },
    ],
    redFlags: [
      'Video generation regularly takes more than ten minutes',
      'Failed attempts still use credits',
      'Videos remain stuck without showing a clear error',
      'Important controls are hidden or difficult to understand',
      'Creating one video requires too many unnecessary steps',
      'There is no quick way to retry a bad result',
    ],
    footer: 'testing',
  },

  'privacy/data-use': {
    categoryKey: 'privacy-data-use',
    title: 'What good Data Use looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Caution',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'AI training',
        good: 'Chats are not used',
        typical: 'Limited use or unclear',
        weak: 'Chats are used',
        evidenceRef: { category: 'privacy', slug: 'training' },
      },
      {
        label: 'Human review',
        good: 'No routine human review',
        typical: 'Limited or unclear',
        weak: 'People may review chats',
        evidenceRef: { category: 'privacy', slug: 'human-review' },
      },
      {
        label: 'Policy Clarity',
        good: '5–6 answers clear',
        typical: '3–4 clear',
        weak: '0–2 clear',
        evidenceRef: { category: 'privacy', slug: 'policy-clarity' },
      },
    ],
    minimums: [
      {
        label: 'Training',
        value: 'The company clearly says whether chats or photos are used',
        evidenceRef: { category: 'privacy', slug: 'training' },
      },
      {
        label: 'Human Review',
        value: 'Human access is clearly explained',
        evidenceRef: { category: 'privacy', slug: 'human-review' },
      },
      {
        label: 'Data Sharing',
        value: 'The types of companies receiving data are listed',
        evidenceRef: { category: 'privacy', slug: 'data-sharing' },
      },
      {
        label: 'Advertising',
        value: 'The company explains whether personal data is used for ads',
        evidenceRef: { category: 'privacy', slug: 'advertising' },
      },
      {
        label: 'Retention',
        value: 'Storage periods are given for important types of data',
        evidenceRef: { category: 'privacy', slug: 'retention' },
      },
      {
        label: 'Policy Clarity',
        value: 'Most important privacy questions receive clear answers',
        evidenceRef: { category: 'privacy', slug: 'policy-clarity' },
      },
    ],
    redFlags: [
      'The company says it may use chats for almost any business purpose',
      'Employees or contractors may read conversations without clear limits',
      'Data is shared with unnamed or very broad groups of companies',
      'The policy does not say how long chats or deleted data are kept',
      'Important answers are hidden behind vague wording',
      'Different pages give conflicting privacy information',
    ],
    footer: 'testing',
  },

  'privacy/user-control': {
    categoryKey: 'privacy-user-control',
    title: 'What good User Control looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Chat deletion',
        good: 'All 3 chats can be deleted',
        typical: 'Only some can be deleted',
        weak: 'No chat deletion',
        evidenceRef: { category: 'privacy', slug: 'delete-chats' },
      },
      {
        label: 'Account deletion',
        good: 'Available directly in settings',
        typical: 'Requires extra steps or support',
        weak: 'No clear option',
        evidenceRef: { category: 'privacy', slug: 'delete-account' },
      },
      {
        label: 'Data rights',
        good: 'Deletion, opt-out, and export available',
        typical: 'Only some rights supported',
        weak: 'Few or no useful controls',
        evidenceRef: { category: 'privacy', slug: 'export-data' },
      },
    ],
    minimums: [
      {
        label: 'Delete Chats',
        value: 'Individual conversations can be removed',
        evidenceRef: { category: 'privacy', slug: 'delete-chats' },
      },
      {
        label: 'Delete Account',
        value: 'Account deletion can be requested from account settings',
        evidenceRef: { category: 'privacy', slug: 'delete-account' },
      },
      {
        label: 'Delete Personal Data',
        value: 'Users can request deletion beyond visible account content',
        evidenceRef: { category: 'privacy', slug: 'delete-personal-data' },
      },
      {
        label: 'Training Opt-Out',
        value: 'A clear opt-out exists when data is used for training',
        evidenceRef: { category: 'privacy', slug: 'training-opt-out' },
      },
      {
        label: 'Export Data',
        value: 'Account data can be requested and received',
        evidenceRef: { category: 'privacy', slug: 'export-data' },
      },
    ],
    redFlags: [
      'Deleting a chat only hides it temporarily',
      'Account deletion requires several emails to support',
      'The company does not explain how to delete stored personal data',
      'Training is enabled automatically with no opt-out',
      'The export contains only basic profile information',
      'A data export request receives no result within 30 days',
      'Important privacy controls are spread across several confusing pages',
    ],
    footer: 'testing',
  },

  'privacy/security': {
    categoryKey: 'privacy-security',
    title: 'What good Security looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Encryption',
        good: 'Strong protections clearly documented',
        typical: 'Only some protections documented',
        weak: 'No clear protection documented',
        evidenceRef: { category: 'privacy', slug: 'encryption' },
      },
      {
        label: 'Two-factor authentication',
        good: 'Available and works',
        typical: 'Important restrictions apply',
        weak: 'Not available',
        evidenceRef: { category: 'privacy', slug: 'two-factor-authentication' },
      },
      {
        label: 'Security incidents',
        good: '0 confirmed in 5 years',
        typical: '1 confirmed',
        weak: '2 or more confirmed',
        evidenceRef: { category: 'privacy', slug: 'security-incidents' },
      },
    ],
    minimums: [
      {
        label: 'Encryption',
        value: 'The company clearly explains at least how data is protected in transit and at rest',
        evidenceRef: { category: 'privacy', slug: 'encryption' },
      },
      {
        label: 'Two-Factor Authentication',
        value: 'Users can protect their account with an additional login step',
        evidenceRef: { category: 'privacy', slug: 'two-factor-authentication' },
      },
      {
        label: 'Billing Descriptor',
        value: 'The billing name is shown before payment',
        evidenceRef: { category: 'privacy', slug: 'billing-descriptor' },
      },
      {
        label: 'Security Incidents',
        value: 'Confirmed incidents and their sources are recorded accurately',
        evidenceRef: { category: 'privacy', slug: 'security-incidents' },
      },
    ],
    redFlags: [
      'The company makes general security claims without explaining the protections used',
      'The privacy policy does not mention encryption',
      'Two-factor authentication is unavailable',
      'The billing descriptor is hidden until after purchase',
      'Several confirmed breaches or leaks occurred recently',
      'The company does not explain what happened after a known incident',
      'Marketing uses “secure” or “private” without supporting information',
    ],
    footer: 'testing',
  },

  'privacy/support': {
    categoryKey: 'privacy-support',
    title: 'What good Support looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Ease of Contact',
        good: 'Easy to find and works without confusion',
        typical: 'Available but hidden or awkward',
        weak: 'Hidden, broken, or too many steps',
        evidenceRef: { category: 'privacy', slug: 'support-reach' },
      },
      {
        label: 'Response Speed',
        good: 'A real agent replies quickly',
        typical: 'Reply arrives but feels slow',
        weak: 'No meaningful reply',
        evidenceRef: { category: 'privacy', slug: 'support-speed' },
      },
      {
        label: 'Helpfulness',
        good: 'Clear solution or next step',
        typical: 'Partially useful answer',
        weak: 'Generic, wrong, or no solution',
        evidenceRef: { category: 'privacy', slug: 'support-helpfulness' },
      },
    ],
    minimums: [
      {
        label: 'Ease of Contact',
        value: 'The support link is easy to find and the request sends successfully',
        evidenceRef: { category: 'privacy', slug: 'support-reach' },
      },
      {
        label: 'Response Speed',
        value: 'A real support agent replies within a reasonable time',
        evidenceRef: { category: 'privacy', slug: 'support-speed' },
      },
      {
        label: 'Helpfulness',
        value: 'The answer solves the issue or gives a clear next step',
        evidenceRef: { category: 'privacy', slug: 'support-helpfulness' },
      },
    ],
    redFlags: [
      'No contact option can be found',
      'The contact form does not work',
      'The only option is an unofficial community',
      'The company sends only an automatic reply',
      'Support ignores the question',
      'The answer gives instructions that do not work',
      'The user is passed between several agents',
      'No clear solution is provided',
    ],
    footer: 'testing',
  },

  'pricing/plan-value': {
    categoryKey: 'pricing-plan-value',
    title: 'What good Plan Value looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Monthly Price',
        good: 'Reasonable monthly cost',
        typical: 'Higher than comparable plans',
        weak: 'Expensive for what is included',
        evidenceRef: { category: 'pricing', slug: 'monthly-price' },
      },
      {
        label: 'Included Features',
        good: 'Most core features included',
        typical: 'Several features missing or paywalled',
        weak: 'Basic features require extra payment',
        evidenceRef: { category: 'pricing', slug: 'included-features' },
      },
      {
        label: 'Included Credits',
        good: 'Enough credits for normal use',
        typical: 'Credits run out quickly',
        weak: 'Very few credits included',
        evidenceRef: { category: 'pricing', slug: 'included-credits' },
      },
      {
        label: 'Annual Discount',
        good: 'Meaningful yearly savings',
        typical: 'Small annual discount',
        weak: 'Little or no annual savings',
        evidenceRef: { category: 'pricing', slug: 'annual-discount' },
      },
    ],
    minimums: [
      {
        label: 'Monthly Price',
        value: 'The normal one-month subscription price is clearly recorded',
        evidenceRef: { category: 'pricing', slug: 'monthly-price' },
      },
      {
        label: 'Annual Price',
        value: 'Both the full annual payment and effective monthly price are shown',
        evidenceRef: { category: 'pricing', slug: 'annual-price' },
      },
      {
        label: 'Included Features',
        value: 'Core features are included without buying a higher plan',
        evidenceRef: { category: 'pricing', slug: 'included-features' },
      },
      {
        label: 'Plan Limits',
        value: 'Usage limits are clearly explained',
        evidenceRef: { category: 'pricing', slug: 'plan-limits' },
      },
    ],
    redFlags: [
      'The cheapest price is only available with annual payment',
      'Important features require separate credits',
      'Included credits run out very quickly',
      'The plan has hidden daily or monthly limits',
      'The annual discount is smaller than advertised',
      'The website shows the monthly average but hides the full yearly charge',
      'Users need a more expensive plan to access basic features',
    ],
    footer: 'testing',
  },

  'pricing/usage-costs': {
    categoryKey: 'pricing-usage-costs',
    title: 'What good Usage Costs looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Image Cost',
        good: 'Affordable per-image cost',
        typical: 'Noticeable cost per image',
        weak: 'Expensive per-image cost',
        evidenceRef: { category: 'pricing', slug: 'image-cost' },
      },
      {
        label: 'Video Cost',
        good: 'Reasonable cost per 10 seconds',
        typical: 'Videos use many credits',
        weak: 'Very expensive video generation',
        evidenceRef: { category: 'pricing', slug: 'video-cost' },
      },
      {
        label: 'Monthly Spend',
        good: 'Total monthly cost stays manageable',
        typical: 'Regular use needs extra top-ups',
        weak: 'Real monthly cost far above the plan price',
        evidenceRef: { category: 'pricing', slug: 'monthly-spend' },
      },
      {
        label: 'Top-Up Value',
        good: 'Credit packages offer fair value',
        typical: 'Small packages are poor value',
        weak: 'Top-ups are very expensive',
        evidenceRef: { category: 'pricing', slug: 'top-up-value' },
      },
    ],
    minimums: [
      {
        label: 'Image Cost',
        value: 'The exact dollar cost per image is shown',
        evidenceRef: { category: 'pricing', slug: 'image-cost' },
      },
      {
        label: 'Video Cost',
        value: 'The cost is normalized to dollars per 10 seconds',
        evidenceRef: { category: 'pricing', slug: 'video-cost' },
      },
      {
        label: 'Monthly Spend',
        value: 'The regular-use monthly estimate is shown with its calculation',
        evidenceRef: { category: 'pricing', slug: 'monthly-spend' },
      },
      {
        label: 'Top-Up Value',
        value: 'Smallest and largest credit packages are recorded',
        evidenceRef: { category: 'pricing', slug: 'top-up-value' },
      },
    ],
    redFlags: [
      'A cheap subscription includes very few credits',
      'Videos use most of the monthly credit balance',
      'Failed generations still use credits',
      'Small credit packages have a very high cost per credit',
      'Users need several top-ups every month',
      'The app does not clearly explain how many credits each feature costs',
      'The real monthly cost is much higher than the advertised plan price',
    ],
    footer: 'testing',
  },

  'pricing/free-access': {
    categoryKey: 'pricing-free-access',
    title: 'What good Free Access looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Free Chat',
        good: 'Enough messages for a real conversation',
        typical: 'Only a short chat before payment',
        weak: 'Payment required after very few messages',
        evidenceRef: { category: 'pricing', slug: 'free-chat' },
      },
      {
        label: 'Free Images',
        good: 'Several free images or regular resets',
        typical: 'Only a small one-time allowance',
        weak: 'No free image generation',
        evidenceRef: { category: 'pricing', slug: 'free-images' },
      },
      {
        label: 'Free Value',
        good: 'Useful access with no credit card',
        typical: 'Important restrictions or card required',
        weak: 'Payment required to try the app',
        evidenceRef: { category: 'pricing', slug: 'free-value' },
      },
      {
        label: 'Restrictions',
        good: 'Clear rules and useful reset periods',
        typical: 'Some confusing or tight limits',
        weak: 'Harsh or quickly expiring allowances',
        evidenceRef: { category: 'pricing', slug: 'restrictions' },
      },
    ],
    minimums: [
      {
        label: 'Free Chat',
        value: 'The exact free message allowance and reset period are shown',
        evidenceRef: { category: 'pricing', slug: 'free-chat' },
      },
      {
        label: 'Free Images',
        value: 'The number of free images and whether they reset are recorded',
        evidenceRef: { category: 'pricing', slug: 'free-images' },
      },
      {
        label: 'Free Value',
        value: 'Whether a credit card is required is clearly recorded',
        evidenceRef: { category: 'pricing', slug: 'free-value' },
      },
      {
        label: 'Restrictions',
        value: 'Reset, expiry, and trial rules are explained',
        evidenceRef: { category: 'pricing', slug: 'restrictions' },
      },
    ],
    redFlags: [
      'Payment is required after only a few messages',
      'The free plan does not include media features',
      'A credit card is required to start the trial',
      'The trial automatically becomes a paid subscription',
      'Free credits expire very quickly',
      'The app does not explain when allowances reset',
      'Free users can only speak to one character',
      'The homepage says free, but most features are locked',
    ],
    footer: 'testing',
  },

  'pricing/billing': {
    categoryKey: 'pricing-billing',
    title: 'What good Billing looks like',
    intro: '',
    mainSectionTitle: 'Main benchmarks',
    tierLabels: {
      good: 'Good',
      typical: 'Limited',
      weak: 'Weak',
    },
    mainRows: [
      {
        label: 'Pricing Clarity',
        good: 'Most key details shown before checkout',
        typical: 'Some important costs are unclear',
        weak: 'Important pricing details are hidden',
        evidenceRef: { category: 'pricing', slug: 'pricing-clarity' },
      },
      {
        label: 'Paywalls',
        good: 'Few features require another payment',
        typical: 'Several features need extra payment',
        weak: 'Most core features are paywalled',
        evidenceRef: { category: 'pricing', slug: 'paywalls' },
      },
      {
        label: 'Credit Expiry',
        good: 'Purchased credits do not expire',
        typical: 'Only some credits expire',
        weak: 'Purchased credits expire without clear warning',
        evidenceRef: { category: 'pricing', slug: 'credit-expiry' },
      },
      {
        label: 'Cancellation',
        good: 'Clear self-service cancellation',
        typical: 'Cancellation exists but is awkward',
        weak: 'Users must contact support to cancel',
        evidenceRef: { category: 'pricing', slug: 'cancellation' },
      },
    ],
    minimums: [
      {
        label: 'Pricing Clarity',
        value: 'Key pricing details are checked before payment',
        evidenceRef: { category: 'pricing', slug: 'pricing-clarity' },
      },
      {
        label: 'Refunds',
        value: 'The refund policy is reviewed and recorded clearly',
        evidenceRef: { category: 'pricing', slug: 'refunds' },
      },
      {
        label: 'Payment Privacy',
        value: 'The expected statement name and discretion are recorded',
        evidenceRef: { category: 'pricing', slug: 'payment-privacy' },
      },
    ],
    redFlags: [
      'The annual price is shown as a monthly price',
      'Extra credit costs are hidden',
      'Important features require a higher plan',
      'Purchased credits expire without a clear warning',
      'The refund policy is difficult to find',
      'Users must email support to cancel',
      'The statement name reveals the type of service',
      'The billing name is only shown after payment',
    ],
    footer: 'testing',
  },
};

export function getCategoryBenchmarkConfig(categoryKey: string): CategoryBenchmarkPanelConfig | undefined {
  return categoryBenchmarkConfigs[categoryKey];
}

export function getSubscoreBenchmarkConfig(
  categoryKey: string,
  subscoreSlug: string,
): CategoryBenchmarkPanelConfig | undefined {
  return subscoreBenchmarkConfigs[`${categoryKey}/${subscoreSlug}`];
}
