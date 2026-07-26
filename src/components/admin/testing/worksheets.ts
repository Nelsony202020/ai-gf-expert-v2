// Worksheet grids: fill one table → several scores are calculated automatically.

import { SAMPLE } from './sampleSizes';

export interface WorksheetColumn {
  defSlug: string;
  label: string;
  hint?: string;
  kind: 'count' | 'pass';
  max?: number;
}

export interface WorksheetConfig {
  rowLabel: string;
  rowCount: number;
  title: string;
  steps: string[];
  columns: WorksheetColumn[];
}

const CHATS = SAMPLE.chatConversations;
const REPLIES = SAMPLE.chatRepliesPerChat;

export const WORKSHEETS: Record<string, WorksheetConfig> = {
  'chat-understanding': {
    title: 'How to run the chat test',
    rowLabel: 'Chat',
    rowCount: CHATS,
    steps: [
      `Open ${CHATS} new chats with ${CHATS} different characters.`,
      `In each chat, keep talking until the AI has sent about ${REPLIES} replies total.`,
      `Use the same ${CHATS} chats for every row in the table below.`,
      'Chat 1 = row 1, chat 2 = row 2, and so on.',
      'Tick the checkbox when something passed. Enter a number when you counted something.',
      'Press Save — the five scores are calculated for you.',
    ],
    columns: [
      { defSlug: 'memory', label: 'Facts /5', hint: 'How many of 5 test facts did it remember?', kind: 'count', max: 5 },
      { defSlug: 'relevance', label: 'Answers /5', hint: 'How many of 5 questions got a straight answer?', kind: 'count', max: 5 },
      { defSlug: 'context', label: 'Got context', hint: 'Tick if it used earlier messages correctly.', kind: 'pass' },
      { defSlug: 'instructions', label: 'Rules /3', hint: 'How many of 3 rules did it follow?', kind: 'count', max: 3 },
      { defSlug: 'roleplay-accuracy', label: 'Roleplay /5', hint: 'How many of 5 roleplay checks passed?', kind: 'count', max: 5 },
    ],
  },

  'chat-realism': {
    title: 'How to score chat quality',
    rowLabel: 'Chat',
    rowCount: CHATS,
    steps: [
      `Use the same ${CHATS} chats from the understanding test.`,
      'Read through the AI replies in each chat again.',
      'Fill one row per chat — same order as before.',
      'Count or tick each column for that chat only.',
      'Press Save — six scores are calculated for you.',
    ],
    columns: [
      { defSlug: 'naturalness', label: `Natural /${REPLIES}`, hint: `Replies that sound human, out of ${REPLIES}.`, kind: 'count', max: REPLIES },
      { defSlug: 'personality', label: 'Kept traits', hint: 'Tick if the character stayed in character.', kind: 'pass' },
      { defSlug: 'roleplay', label: 'Roleplay /5', hint: 'Roleplay checks passed, out of 5.', kind: 'count', max: 5 },
      { defSlug: 'initiative', label: 'Initiative /10', hint: 'Times it asked a question or moved things forward.', kind: 'count', max: 10 },
      { defSlug: 'emotion', label: 'Emotion /5', hint: 'Emotional moments handled well, out of 5.', kind: 'count', max: 5 },
      { defSlug: 'style', label: `On-style /${REPLIES}`, hint: `Replies that matched the character style.`, kind: 'count', max: REPLIES },
    ],
  },

  'image-batch-review': {
    title: `How to review ${SAMPLE.imageBatch} images`,
    rowLabel: 'Image',
    rowCount: SAMPLE.imageBatch,
    steps: [
      `Generate ${SAMPLE.imageBatch} test images using the app’s normal image tool.`,
      'Look at each image and fill one row per image.',
      'Tick “Bad image” if there is a major visual problem.',
      'Press Save — five scores are calculated for you.',
    ],
    columns: [
      { defSlug: 'realism', label: 'Realism /5', hint: 'Looks real — out of 5 checks.', kind: 'count', max: 5 },
      { defSlug: 'visual-errors', label: 'Bad image', hint: 'Tick if broken hands, faces, etc.', kind: 'pass' },
      { defSlug: 'detail', label: 'Detail /5', hint: 'Sharp, clear details — out of 5.', kind: 'count', max: 5 },
      { defSlug: 'composition', label: 'Layout /5', hint: 'Good framing — out of 5.', kind: 'count', max: 5 },
      { defSlug: 'prompt-accuracy', label: 'Match /5', hint: 'Matches your prompt — out of 5.', kind: 'count', max: 5 },
    ],
  },

  'image-consistency': {
    title: 'Same-character image test',
    rowLabel: 'Image',
    rowCount: SAMPLE.imageConsistency,
    steps: [
      `Pick one character and generate ${SAMPLE.imageConsistency} images of that same character.`,
      'Fill one row per image.',
      'Tick when the face, body, or style stayed the same.',
      'Press Save — four scores are calculated for you.',
    ],
    columns: [
      { defSlug: 'character-consistency', label: 'Match /5', hint: 'Same person — out of 5 checks.', kind: 'count', max: 5 },
      { defSlug: 'face-consistency', label: 'Same face', hint: 'Face matches previous images.', kind: 'pass' },
      { defSlug: 'body-consistency', label: 'Same body', hint: 'Body type matches.', kind: 'pass' },
      { defSlug: 'style-consistency', label: 'Same style', hint: 'Art style matches.', kind: 'pass' },
    ],
  },

  'video-batch-review': {
    title: `How to review ${SAMPLE.videoBatch} videos`,
    rowLabel: 'Video',
    rowCount: SAMPLE.videoBatch,
    steps: [
      `Generate ${SAMPLE.videoBatch} test videos with the app’s normal video tool.`,
      'Watch each video and fill one row per video.',
      'Tick “Bad video” if there is a major glitch or error.',
      'Press Save — six scores are calculated for you.',
    ],
    columns: [
      { defSlug: 'realism', label: 'Realism /5', hint: 'Looks believable — out of 5.', kind: 'count', max: 5 },
      { defSlug: 'motion', label: 'Motion /5', hint: 'Smooth movement — out of 5.', kind: 'count', max: 5 },
      { defSlug: 'accuracy', label: 'Match /5', hint: 'Matches your prompt — out of 5.', kind: 'count', max: 5 },
      { defSlug: 'character-consistency', label: 'Character /5', hint: 'Same character — out of 5.', kind: 'count', max: 5 },
      { defSlug: 'visual-errors', label: 'Bad video', hint: 'Major visual glitch.', kind: 'pass' },
      { defSlug: 'frame-consistency', label: 'Stable /5', hint: 'No flicker/jumps — out of 5.', kind: 'count', max: 5 },
    ],
  },
};

export type WorksheetRow = Record<string, number | boolean | undefined>;

export interface DerivedColumn {
  defSlug: string;
  numerator: number;
  denominator: number;
  pct: number;
  filledRows: number;
}

export function deriveWorksheet(config: WorksheetConfig, rows: WorksheetRow[]): DerivedColumn[] {
  return config.columns.map((col) => {
    let numerator = 0;
    let filledRows = 0;
    for (const row of rows) {
      const cell = row?.[col.defSlug];
      if (cell === undefined) continue;
      filledRows++;
      if (col.kind === 'pass') numerator += cell ? 1 : 0;
      else numerator += Number(cell) || 0;
    }
    const denominator = col.kind === 'pass' ? config.rowCount : config.rowCount * (col.max ?? 1);
    const pct = denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
    return { defSlug: col.defSlug, numerator, denominator, pct, filledRows };
  });
}
