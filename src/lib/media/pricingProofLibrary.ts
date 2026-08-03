import { isPricingProofMedia, type MediaRowLike } from './catalog';

/** Pricing proof appears in the media library only after a snapshot verify covers the upload time. */
export function pricingProofVisibleInLibrary(
  row: MediaRowLike,
  snapshots: Array<{ verifiedAt?: unknown }>,
): boolean {
  if (!isPricingProofMedia(row)) return true;
  const created = Number(row.createdAt ?? 0);
  if (!created) return false;
  return snapshots.some((s) => {
    const verifiedAt = Number(s.verifiedAt ?? 0);
    return verifiedAt > 0 && verifiedAt >= created;
  });
}

export function countUnverifiedPricingProof(
  mediaRows: MediaRowLike[],
  snapshots: Array<{ verifiedAt?: unknown }>,
): number {
  return mediaRows.filter((row) => isPricingProofMedia(row) && !pricingProofVisibleInLibrary(row, snapshots))
    .length;
}
