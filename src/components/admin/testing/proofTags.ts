// Caption tags group proof files under one evidence result (bonus rows, live cam, etc.).

const AUTO_ALT_PREFIX = /^(Evidence|Proof):\s/i;

export function bonusExtraCaption(rowId: string): string {
  return `bonus-extra:${rowId}`;
}

export const LIVE_CAM_PROOF_TAG = 'live-cam-proof';

export function proofTagCaption(tag: string, userCaption?: string): string {
  const cap = userCaption?.trim();
  return cap ? `${tag}|${cap}` : tag;
}

export function parseProofCaption(caption: string | undefined | null): { tag: string; userCaption: string } {
  const raw = String(caption ?? '');
  const pipe = raw.indexOf('|');
  if (pipe === -1) return { tag: raw, userCaption: '' };
  return { tag: raw.slice(0, pipe), userCaption: raw.slice(pipe + 1) };
}

export function mediaMatchesProofTag(caption: string | undefined | null, tag: string): boolean {
  if (!caption || !tag) return false;
  const { tag: stored } = parseProofCaption(caption);
  return stored === tag;
}

/** User-entered caption only — never falls back to auto alt text or evidence names. */
export function proofMediaLabel(caption: string | undefined | null): string {
  const { userCaption, tag } = parseProofCaption(caption);
  if (userCaption.trim()) return userCaption.trim();
  const raw = String(caption ?? '').trim();
  if (!raw || raw.includes('|')) return '';
  if (raw.startsWith('bonus-extra:')) return '';
  if (raw === LIVE_CAM_PROOF_TAG) return '';
  return raw;
}

export function displayCaption(caption: string | undefined | null, altText?: string | null): string {
  const fromCaption = proofMediaLabel(caption);
  if (fromCaption) return fromCaption;
  const alt = String(altText ?? '').trim();
  if (alt && !AUTO_ALT_PREFIX.test(alt)) return alt;
  return '';
}
