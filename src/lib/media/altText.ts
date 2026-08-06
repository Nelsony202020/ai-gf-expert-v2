// Alt text helpers — detect placeholder/garbage alts and normalize saves.

/** Browser / paste defaults and filename-style labels that are not real descriptions. */
const PLACEHOLDER_ALT =
  /^(?:pasted[\s_-]*image|pasted-image-\d+)(?:[\s_,.-]*(?:pasted|image|zero|\d+))*$/i;

export function isPlaceholderAltText(alt: unknown): boolean {
  const t = String(alt ?? '').trim();
  if (!t) return false;
  if (PLACEHOLDER_ALT.test(t)) return true;
  if (/^pasted[\s_-]*image\b/i.test(t) && t.length < 120) return true;
  if (/^image\s*\d*$/i.test(t)) return true;
  return false;
}

/** True when an image still needs a human- or AI-written description. */
export function isMissingAltText(alt: unknown): boolean {
  const t = String(alt ?? '').trim();
  if (!t) return true;
  return isPlaceholderAltText(t);
}

/** Value shown in editors — hide placeholder junk so fields look empty. */
export function displayAltText(alt: unknown): string {
  const t = String(alt ?? '').trim();
  if (!t || isPlaceholderAltText(t)) return '';
  return t;
}

/** Always persist trimmed alt text, including empty string to clear a bad value. */
export function altTextForUpdate(value: string): string {
  return value.trim();
}

/** Reject low-quality AI / auto labels before saving. */
export function isUsableAltSuggestion(alt: unknown): boolean {
  const t = String(alt ?? '').trim();
  if (!t) return false;
  return !isPlaceholderAltText(t);
}
