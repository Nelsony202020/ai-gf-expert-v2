export type QuizAnswerId = 'A' | 'B' | 'C';
export type QuizUserType = 'chat-first' | 'media-first' | 'balanced';

export const BUYING_GUIDE_QUIZ_STORAGE_KEY = 'aigf-buying-guide-quiz-result';

export interface QuizAnswer {
  id: QuizAnswerId;
  label: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  icon: string;
  answers: QuizAnswer[];
}

export interface QuizResultContent {
  type: QuizUserType;
  eyebrow: string;
  title: string;
  summary: string;
  prioritize: string[];
  secondaryTitle: string;
  secondaryItems: string[];
  ctaLabel: string;
  ctaHref: string;
  directorySort: 'chat' | 'images' | 'overall';
  matchLabels: { chat: string; media: string; balanced: string };
}

export const buyingGuideQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'What would you spend most of your time doing?',
    icon: 'schedule',
    answers: [
      { id: 'A', label: 'Chatting, roleplaying, and building a connection' },
      { id: 'B', label: 'Generating images and videos' },
      { id: 'C', label: 'A mix of both' },
    ],
  },
  {
    id: 2,
    question: 'Which problem would annoy you the most?',
    icon: 'sentiment_dissatisfied',
    answers: [
      { id: 'A', label: 'The character forgets important details or gives repetitive replies' },
      { id: 'B', label: 'The generated images look inaccurate or inconsistent' },
      { id: 'C', label: 'Either problem would seriously affect the experience' },
    ],
  },
  {
    id: 3,
    question: 'How often do you expect to generate images or videos?',
    icon: 'auto_awesome',
    answers: [
      { id: 'A', label: 'Occasionally, mostly as part of a conversation' },
      { id: 'B', label: 'Very often—I would probably keep pressing generate' },
      { id: 'C', label: 'Regularly, but chatting would still be equally important' },
    ],
  },
  {
    id: 4,
    question: 'Where would you rather spend your monthly budget?',
    icon: 'account_balance_wallet',
    answers: [
      { id: 'A', label: 'On better chat, memory, roleplay, and voice features' },
      { id: 'B', label: 'On tokens for images, videos, and premium generations' },
      { id: 'C', label: 'On a subscription that gives me a good balance of everything' },
    ],
  },
  {
    id: 5,
    question: 'Which feature would make you choose one app over another?',
    icon: 'emoji_events',
    answers: [
      { id: 'A', label: 'More realistic conversations and better memory' },
      { id: 'B', label: 'Better image realism, video quality, and generation controls' },
      { id: 'C', label: 'Strong performance across both chat and media' },
    ],
  },
];

export const buyingGuideQuizResults: Record<QuizUserType, QuizResultContent> = {
  'chat-first': {
    type: 'chat-first',
    eyebrow: 'Your result',
    title: 'You are a chat-first user',
    summary:
      'You mainly care about conversation, roleplay, memory, and building a connection with one character.',
    prioritize: [
      'Chat quality',
      'Long-term memory',
      'Roleplay consistency',
      'Personality consistency',
      'Message limits',
      'Voice and chat features',
    ],
    secondaryTitle: 'You probably do not need',
    secondaryItems: [
      'The most advanced image generator',
      'Large token packages',
      'Detailed video controls',
    ],
    ctaLabel: 'See best apps for chat',
    ctaHref: '/ai-girlfriend-apps',
    directorySort: 'chat',
    matchLabels: { chat: 'Chat-first', media: 'Media-first', balanced: 'Balanced' },
  },
  'media-first': {
    type: 'media-first',
    eyebrow: 'Your result',
    title: 'You are an image and video-first user',
    summary: 'You care more about creating visual content than having long conversations.',
    prioritize: [
      'Image realism',
      'Prompt accuracy',
      'Character consistency',
      'Video quality',
      'Generation controls',
      'Token prices and generation limits',
    ],
    secondaryTitle: 'Watch out for',
    secondaryItems: [
      'Expensive token top-ups',
      'Failed generations',
      'Slow video generation',
      'Apps with strong marketing images but weak actual results',
    ],
    ctaLabel: 'See best apps for images and videos',
    ctaHref: '/ai-girlfriend-apps',
    directorySort: 'images',
    matchLabels: { chat: 'Chat-first', media: 'Media-first', balanced: 'Balanced' },
  },
  balanced: {
    type: 'balanced',
    eyebrow: 'Your result',
    title: 'You are a balanced user',
    summary:
      'You want strong conversations and good media generation without switching between several platforms.',
    prioritize: [
      'Overall performance',
      'Chat quality',
      'Image generation',
      'Pricing',
      'Character customization',
      'A reasonable token allowance',
    ],
    secondaryTitle: 'Watch out for',
    secondaryItems: [
      'Apps that are excellent in one category but weak everywhere else',
      'Low-cost subscriptions with expensive media credits',
    ],
    ctaLabel: 'See best all-round apps',
    ctaHref: '/ai-girlfriend-apps',
    directorySort: 'overall',
    matchLabels: { chat: 'Chat-first', media: 'Media-first', balanced: 'Balanced' },
  },
};

export function scoreBuyingGuideQuiz(answers: QuizAnswerId[]): QuizUserType {
  const scores = { chat: 0, media: 0, balanced: 0 };
  for (const answer of answers) {
    if (answer === 'A') scores.chat += 1;
    else if (answer === 'B') scores.media += 1;
    else scores.balanced += 1;
  }

  const max = Math.max(scores.chat, scores.media, scores.balanced);
  const winners: QuizUserType[] = [];
  if (scores.chat === max) winners.push('chat-first');
  if (scores.media === max) winners.push('media-first');
  if (scores.balanced === max) winners.push('balanced');

  if (winners.length === 1) return winners[0]!;
  if (winners.length === 3) return 'balanced';

  const first = answers[0];
  if (first === 'A') return 'chat-first';
  if (first === 'B') return 'media-first';
  return 'balanced';
}

export function previewQuizMatch(answers: QuizAnswerId[]): QuizUserType {
  if (answers.length === 0) return 'balanced';
  return scoreBuyingGuideQuiz(answers);
}
