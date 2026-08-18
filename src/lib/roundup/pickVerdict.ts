import { splitVerdict, truncateWords } from './compareTable';

export interface PickVerdictDisplay {
  lead: string;
  rest: string;
  full: string;
}

/** Format roundup-card Our Take copy with a strong opening line and word cap. */
export function formatPickVerdict(text: string, maxWords = 120): PickVerdictDisplay {
  const full = truncateWords(text, maxWords);
  const { lead, rest } = splitVerdict(full);
  return { lead, rest, full };
}
