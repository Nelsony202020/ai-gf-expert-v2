/** Local draft cache for the review editor — survives tab crashes / backend blips. */

import type { JSONDoc } from '../../components/admin/review/blockConversion';

const PREFIX = 'aigf:review-draft:v1:';

export interface ReviewDraftPayload {
  productId: string;
  savedAt: number;
  doc: JSONDoc;
}

function key(productId: string): string {
  return `${PREFIX}${productId}`;
}

export function readReviewDraft(productId: string): ReviewDraftPayload | null {
  if (typeof window === 'undefined' || !productId) return null;
  try {
    const raw = localStorage.getItem(key(productId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReviewDraftPayload;
    if (!parsed?.doc || parsed.productId !== productId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeReviewDraft(productId: string, doc: JSONDoc): void {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const payload: ReviewDraftPayload = { productId, savedAt: Date.now(), doc };
    localStorage.setItem(key(productId), JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore; server save remains the source of truth.
  }
}

export function clearReviewDraft(productId: string): void {
  if (typeof window === 'undefined' || !productId) return;
  try {
    localStorage.removeItem(key(productId));
  } catch {
    /* ignore */
  }
}

/** True when the draft has real content and differs from the last server-saved doc. */
export function draftIsNewerThanSaved(
  draft: ReviewDraftPayload | null,
  savedDocJson: string,
  lastServerEditAt: number | null | undefined,
): boolean {
  if (!draft) return false;
  const draftJson = JSON.stringify(draft.doc);
  if (draftJson === savedDocJson) return false;
  // Empty-ish docs aren't worth recovering.
  const content = draft.doc.content ?? [];
  if (content.length === 0) return false;
  if (lastServerEditAt != null && draft.savedAt < lastServerEditAt) return false;
  return true;
}
