/** Hide or trim evidence tests when the product lacks the related capability. */

import type { EntityRow } from '../api';
import {
  FEATURE_ITEM_CAP,
  filterApplicableItems,
  isEvidenceApplicable,
} from '../../../lib/testing/capabilityGating';

export { FEATURE_ITEM_CAP, filterApplicableItems, isEvidenceApplicable };

/** Privacy policy questions where the middle option is Optional (opt-out available). */
export const PRIVACY_OPTIONAL_SLUGS = new Set(['data-sharing', 'advertising', 'retention']);

/** Privacy policy questions where Unknown excludes the answer from scoring. */
export const PRIVACY_UNKNOWN_SLUGS = new Set([
  'training',
  'human-review',
  'data-sharing',
  'advertising',
  'retention',
  'policy-clarity',
  'delete-chats',
  'delete-account',
  'delete-personal-data',
  'training-opt-out',
  'export-data',
  'encryption',
  'two-factor-authentication',
  'billing-descriptor',
  'security-incidents',
]);

/** Privacy/data-use questions that support Unknown (excluded from score). */
export function privacyAllowsUnknown(categorySlug: string | undefined, slug: string): boolean {
  return categorySlug === 'privacy' && PRIVACY_UNKNOWN_SLUGS.has(slug);
}

export function readYnlAnswer(
  resultByDef: Map<string, EntityRow>,
  defs: EntityRow[],
  slug: string,
): string | null {
  const def = defs.find((d) => String(d.slug) === slug);
  if (!def) return null;
  const r = resultByDef.get(def.id);
  const raw = r?.rawValue as { status?: string } | undefined;
  if (raw && 'status' in raw && raw.status) return raw.status;
  if (r?.notApplicable) return 'na';
  return null;
}

/** When image editing is unavailable, editing-accuracy must not affect the score. */
export function isEditingAccuracyScored(
  categorySlug: string,
  resultBySlug: Map<string, EntityRow>,
): boolean {
  if (categorySlug !== 'images') return true;
  const imageEdit = resultBySlug.get('image-editing');
  const raw = imageEdit?.rawValue as { status?: string } | undefined;
  if (imageEdit?.notApplicable || raw?.status === 'na') return false;
  if (raw?.status === 'no') return false;
  return true;
}

export function readImageEditingStatus(resultBySlug: Map<string, EntityRow>): 'yes' | 'no' | 'limited' | null {
  const row = resultBySlug.get('image-editing');
  const raw = row?.rawValue as { status?: string } | undefined;
  if (row?.notApplicable || raw?.status === 'na') return null;
  const s = raw?.status;
  if (s === 'yes' || s === 'no' || s === 'limited') return s;
  return null;
}

/** Hide the editing worksheet when neither chat nor dedicated editing exists. */
export function isSessionApplicable(
  categorySlug: string,
  sessionId: string,
  resultByDef: Map<string, EntityRow>,
  categoryDefs: EntityRow[],
): boolean {
  if (categorySlug === 'images' && sessionId === 'image-editing-test') {
    const chatGen = readYnlAnswer(resultByDef, categoryDefs, 'chat-generation');
    const imageEdit = readYnlAnswer(resultByDef, categoryDefs, 'image-editing');
    if (chatGen === 'no' && imageEdit === 'no') return false;
  }
  return true;
}

/** Filter checklist / multi-select options for pricing feature lists. */
export function filterFeatureChecklistItems(
  items: string[],
  productFields: Record<string, unknown>,
): string[] {
  return items.filter((item) => {
    const cap = FEATURE_ITEM_CAP[item];
    if (!cap) return true;
    return productFields[cap] !== false;
  });
}

/** Sessions that default to step-by-step layout in guided mode. */
export const STEP_DEFAULT_SESSIONS = new Set([
  'chat-understanding',
  'image-batch-review',
  'image-consistency',
  'video-batch-review',
]);
