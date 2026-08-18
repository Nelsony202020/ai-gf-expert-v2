/** Append product referral suffix to a character destination URL. */
export function appendReferralSuffix(url: string, suffix: string | undefined | null): string {
  const base = url.trim();
  const suf = suffix?.trim();
  if (!base || !suf) return base;
  if (suf.startsWith('?') || suf.startsWith('&')) {
    return base.includes('?') ? base + (suf.startsWith('?') ? suf.slice(1).replace(/^/, '&') : suf) : base + suf;
  }
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${suf}`;
}

/**
 * Full tracked destination shown in admin and used for outbound CTAs.
 * When `skipReferralSuffix` is true, the destination URL is used as-is
 * (needed when networks assign a unique UID / tracking URL per page).
 */
export function resolveCharacterDestination(
  destinationUrl: string | undefined | null,
  referralSuffix: string | undefined | null,
  skipReferralSuffix?: boolean | null,
): string {
  if (!destinationUrl?.trim()) return '';
  if (skipReferralSuffix) return destinationUrl.trim();
  return appendReferralSuffix(destinationUrl.trim(), referralSuffix);
}
