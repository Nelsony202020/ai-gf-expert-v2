// Caption tags group proof files under one evidence result (bonus rows, live cam, etc.).

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

export function displayCaption(caption: string | undefined | null, altText?: string | null): string {
  const { userCaption, tag } = parseProofCaption(caption);
  if (userCaption) return userCaption;
  if (altText) return String(altText);
  if (tag) return tag;
  return '';
}
