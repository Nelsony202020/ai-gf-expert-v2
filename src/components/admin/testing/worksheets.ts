// Worksheet grids: fill one table → several scores are calculated automatically.

import { SAMPLE } from './sampleSizes';

export interface WorksheetColumn {
  defSlug: string;
  label: string;
  hint?: string;
  kind: 'count' | 'pass' | 'tri' | 'avg_tri' | 'reference';
  max?: number;
  /** Lower cell values are better (footer score is inverted). */
  invert?: boolean;
  /** Footer summary format for this column. */
  footer?: 'pct' | 'seconds';
  /** For avg_tri — slugs averaged per row before aggregation. */
  avgOf?: string[];
}

export interface WorksheetConfig {
  rowLabel: string;
  rowCount: number;
  title: string;
  /** Short instruction shown at top (replaces long step lists when set). */
  instruction?: string;
  steps: string[];
  columns: WorksheetColumn[];
  /** Show batch summary stats after all rows filled. */
  showBatchSummary?: boolean;
}

const CHATS = SAMPLE.chatConversations;
const RELIABILITY_ROWS = 6;
const RELIABILITY_CELL_MAX = 20;

/** Candy AI image batch tests use 15 rows (legacy runs had up to 20 — trim above 15). */
export const CANDY_AI_SLUG = 'candy-ai';
export const CANDY_AI_IMAGE_BATCH_ROWS = 15;

export function imageBatchRowCount(productSlug?: string): number {
  return productSlug === CANDY_AI_SLUG ? CANDY_AI_IMAGE_BATCH_ROWS : SAMPLE.imageBatch;
}

export const WORKSHEETS: Record<string, WorksheetConfig> = {
  'chat-understanding': {
    title: 'Chat understanding',
    instruction:
      'Open 5 new chats with 5 different characters. Use the same script in every chat. Record one row per chat.',
    rowLabel: 'Chat',
    rowCount: CHATS,
    steps: [],
    columns: [
      {
        defSlug: 'memory',
        label: 'Facts remembered',
        hint: 'How many of the 5 facts did the AI remember in this chat? (0–5)',
        kind: 'count',
        max: 5,
      },
      {
        defSlug: 'relevance',
        label: 'Direct answers',
        hint: 'How many of the 5 direct questions got a straight, on-topic answer? (0–5)',
        kind: 'count',
        max: 5,
      },
      {
        defSlug: 'context',
        label: 'Used earlier context',
        hint: 'Did the AI correctly use earlier messages in this chat when it mattered?',
        kind: 'pass',
      },
      {
        defSlug: 'instructions',
        label: 'Rules followed',
        hint: 'How many of the 3 rules did it follow? (0–3)',
        kind: 'count',
        max: 3,
      },
      {
        defSlug: 'roleplay-accuracy',
        label: 'Roleplay checks passed',
        hint: 'How many of the 5 roleplay checks passed? (0–5)',
        kind: 'count',
        max: 5,
      },
    ],
  },

  'chat-reliability': {
    title: 'Chat problems & speed',
    instruction:
      'Use the same chats from earlier tests. Fill one row per check. Lower is better for problem counts; enter reply time in seconds.',
    rowLabel: 'Check',
    rowCount: RELIABILITY_ROWS,
    steps: [],
    columns: [
      {
        defSlug: 'repetition',
        label: 'Repetition /20',
        hint: 'Count repetition problems in this check (0–20). Lower is better.',
        kind: 'count',
        max: RELIABILITY_CELL_MAX,
        invert: true,
      },
      {
        defSlug: 'refusals',
        label: 'Refusal /20',
        hint: 'Unnecessary refusals in this check (0–20). Lower is better.',
        kind: 'count',
        max: RELIABILITY_CELL_MAX,
        invert: true,
      },
      {
        defSlug: 'reply-speed',
        label: 'Reply speed',
        hint: 'Time one reply in this check — enter seconds from send to full reply.',
        kind: 'count',
        max: 120,
        footer: 'seconds',
      },
      {
        defSlug: 'errors',
        label: 'Errors /20',
        hint: 'Broken, cut-off, empty, or unrelated replies (0–20). Lower is better.',
        kind: 'count',
        max: RELIABILITY_CELL_MAX,
        invert: true,
      },
      {
        defSlug: 'consistency',
        label: 'Contradicts /20',
        hint: 'Times it contradicted earlier facts in this check (0–20). Lower is better.',
        kind: 'count',
        max: RELIABILITY_CELL_MAX,
        invert: true,
      },
      {
        defSlug: 'recovery',
        label: 'Recovery /20',
        hint: 'Successful recoveries after you corrected a mistake (0–20). Higher is better.',
        kind: 'count',
        max: RELIABILITY_CELL_MAX,
      },
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
    ],
    columns: [
      { defSlug: 'naturalness', label: `Natural /${SAMPLE.chatRepliesPerChat}`, hint: `Replies that sound human.`, kind: 'count', max: SAMPLE.chatRepliesPerChat },
      { defSlug: 'personality', label: 'Kept traits', hint: 'Character stayed in character.', kind: 'pass' },
      { defSlug: 'roleplay', label: 'Roleplay /5', hint: 'Roleplay checks passed.', kind: 'count', max: 5 },
      { defSlug: 'initiative', label: 'Initiative /10', hint: 'Times it moved the conversation forward.', kind: 'count', max: 10 },
      { defSlug: 'emotion', label: 'Emotion /5', hint: 'Emotional moments handled well.', kind: 'count', max: 5 },
      { defSlug: 'style', label: `On-style /${SAMPLE.chatRepliesPerChat}`, hint: `Replies matched character style.`, kind: 'count', max: SAMPLE.chatRepliesPerChat },
    ],
  },

  'image-batch-review': {
    title: `${SAMPLE.imageBatch} images`,
    instruction: `Generate ${SAMPLE.imageBatch} test images with the same prompt. Upload and rate each one of them.`,
    rowLabel: 'Image',
    rowCount: SAMPLE.imageBatch,
    steps: [],
    showBatchSummary: true,
    columns: [
      { defSlug: 'realism', label: 'Visual quality', hint: '5 = highly realistic, no defects; 1 = broken/unusable.', kind: 'count', max: 5 },
      { defSlug: 'prompt-accuracy', label: 'Prompt accuracy', hint: '5 = followed nearly everything; 1 = barely followed.', kind: 'count', max: 5 },
      { defSlug: 'composition', label: 'Composition', hint: '5 = excellent framing; 1 = unusable composition.', kind: 'count', max: 5 },
      { defSlug: 'visual-errors', label: 'Defects', hint: 'Auto-calculated from ratings + defect checklist.', kind: 'pass' },
    ],
  },

  'image-consistency': {
    title: 'Character consistency',
    instruction:
      'Upload a reference portrait first, then upload each variation. Rate face, body, and style consistency against the reference.',
    rowLabel: 'Image',
    rowCount: SAMPLE.imageConsistency,
    steps: [],
    showBatchSummary: false,
    columns: [
      { defSlug: 'face-consistency', label: 'Face', hint: 'Does the face match the reference?', kind: 'tri' },
      { defSlug: 'body-consistency', label: 'Body', hint: 'Does the body match the reference?', kind: 'tri' },
      { defSlug: 'style-consistency', label: 'Style', hint: 'Does the art style match the reference?', kind: 'tri' },
      {
        defSlug: 'character-consistency',
        label: 'Overall',
        hint: 'Auto-calculated from face, body, and style.',
        kind: 'avg_tri',
        max: 5,
        avgOf: ['face-consistency', 'body-consistency', 'style-consistency'],
      },
    ],
  },

  'video-batch-review': {
    title: `${SAMPLE.videoBatch} videos`,
    instruction: `Generate ${SAMPLE.videoBatch} test videos — one prompt per video. Upload and rate each one.`,
    rowLabel: 'Video',
    rowCount: SAMPLE.videoBatch,
    steps: [],
    showBatchSummary: true,
    columns: [
      { defSlug: 'motion', label: 'Motion quality', hint: '5 = natural and smooth; 1 = broken.', kind: 'count', max: 5 },
      { defSlug: 'accuracy', label: 'Prompt accuracy', hint: '5 = followed nearly everything; 1 = barely followed.', kind: 'count', max: 5 },
      { defSlug: 'character-consistency', label: 'Character consistency', hint: '5 = identity stayed consistent; 1 = unrecognizable.', kind: 'count', max: 5 },
      { defSlug: 'frame-consistency', label: 'Visual stability', hint: '5 = stable throughout; 1 = severely broken.', kind: 'count', max: 5 },
      { defSlug: 'visual-errors', label: 'Usable', hint: 'Auto-calculated from ratings + defects.', kind: 'pass' },
    ],
  },
};

export type WorksheetRow = Record<string, number | boolean | string | string[] | undefined>;

/** Resolve row count for a worksheet (product-specific caps, legacy trim). */
export function resolveWorksheetConfig(
  sessionId: string,
  config: WorksheetConfig,
  initialRows?: WorksheetRow[],
  productSlug?: string,
): WorksheetConfig {
  let rowCount = config.rowCount;
  if (sessionId === 'image-batch-review') {
    rowCount = imageBatchRowCount(productSlug);
  }
  return {
    ...config,
    rowCount,
    title: config.title.replace(/\d+/, String(rowCount)),
    instruction: config.instruction?.replace(/\d+/, String(rowCount)),
  };
}

/** Trim worksheet rows to the resolved row cap (drops legacy rows 16–20 on Candy AI). */
export function capWorksheetRows(
  sessionId: string,
  config: WorksheetConfig,
  rows: WorksheetRow[] | undefined,
  productSlug?: string,
): WorksheetRow[] | undefined {
  if (!rows?.length) return rows;
  const resolved = resolveWorksheetConfig(sessionId, config, rows, productSlug);
  return rows.slice(0, resolved.rowCount);
}

export interface DerivedColumn {
  defSlug: string;
  numerator: number;
  denominator: number;
  pct: number;
  filledRows: number;
}

/** @deprecated Use deriveWorksheetExtended from worksheetScoring.ts */
export function deriveWorksheet(config: WorksheetConfig, rows: WorksheetRow[]): DerivedColumn[] {
  return config.columns.map((col) => {
    let numerator = 0;
    let filledRows = 0;
    for (const row of rows) {
      const cell = row?.[col.defSlug];
      if (cell === undefined) continue;
      filledRows++;
      if (col.kind === 'pass') numerator += cell ? 1 : 0;
      else if (col.kind === 'tri') {
        const v = cell === 'yes' ? 1 : cell === 'mostly' ? 0.5 : cell === 'no' ? 0 : 0;
        numerator += v;
      } else numerator += Number(cell) || 0;
    }
    const denominator = col.kind === 'pass' || col.kind === 'tri' ? config.rowCount : config.rowCount * (col.max ?? 1);
    const pct = denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
    return { defSlug: col.defSlug, numerator, denominator, pct, filledRows };
  });
}
