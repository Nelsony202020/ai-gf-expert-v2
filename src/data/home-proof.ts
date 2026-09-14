/**
 * Single site-wide proof facts (Figma homepage notes 06–07).
 * These five numbers live only in the homepage proof bar — do not repeat them
 * in other homepage sections.
 */
export const homeProofFacts = [
  { value: '24+', label: 'Apps tested' },
  { value: '8', label: 'Rating categories' },
  { value: '100%', label: 'Paid accounts' },
  { value: '30+ days', label: 'Hands-on per finalist' },
  { value: 'Weekly', label: 'Score updates' },
] as const;

/** Tester profile metrics — distinct from the proof bar (note 07). */
export const homeTesterFacts = [
  { value: '100+', label: 'Apps tested' },
  { value: '50+', label: 'Full reviews' },
  { value: '0', label: 'Free press accounts' },
] as const;
