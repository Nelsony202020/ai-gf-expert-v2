/** Split a backend join string on " + " without breaking labels like "2D / cartoon". */
export function splitJoinedValues(raw: string): string[] {
  return raw
    .split(/\s+\+\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export interface MultiValueSegments {
  /** Values shown inline before an optional overflow trigger. */
  visible: string[];
  /** Values hidden behind +N. */
  overflow: string[];
  /** Count for +N label (overflow.length). */
  overflowCount: number;
}

/** First `maxVisible` inline; rest behind +N when there are more values. */
export function segmentMultiValues(values: string[], maxVisible = 2): MultiValueSegments {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  const limit = Math.max(1, maxVisible);
  if (cleaned.length <= limit) {
    return { visible: cleaned, overflow: [], overflowCount: 0 };
  }
  return {
    visible: cleaned.slice(0, limit),
    overflow: cleaned.slice(limit),
    overflowCount: cleaned.length - limit,
  };
}

/** Inline cap for compare-table feature rows (video shows one mode + +N). */
export function compareFeatureMaxVisible(featureId: string): number {
  if (featureId === 'video-generator') return 1;
  return 2;
}

function escapeMultiValueHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Server/client HTML for inline value + optional +N popover (matches MultiValueDisplay.astro). */
export function multiValueDisplayHtml(
  values: string[],
  uid: string,
  maxVisible = 2,
  muted = false,
): string {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  if (cleaned.length === 0) return '—';
  if (cleaned.length === 1) {
    const cls = muted ? 'multi-value multi-value--muted' : 'multi-value';
    return `<span class="${cls}">${escapeMultiValueHtml(cleaned[0])}</span>`;
  }

  const { visible, overflow, overflowCount } = segmentMultiValues(cleaned, maxVisible);
  const popoverId = `mv-popover-${uid}`;
  const backdropId = `mv-backdrop-${uid}`;
  const mutedClass = muted ? ' multi-value--muted' : '';
  const inline = joinMultiValueParts(visible);

  if (overflowCount === 0) {
    return `<span class="multi-value${mutedClass}"><span class="multi-value__inline">${escapeMultiValueHtml(inline)}</span></span>`;
  }

  const overflowText = escapeMultiValueHtml(joinMultiValueParts(overflow));
  return (
    `<span class="multi-value${mutedClass}" data-multi-value-root="${escapeMultiValueHtml(uid)}">` +
    `<span class="multi-value__inline">${escapeMultiValueHtml(inline)}</span>` +
    `<span class="multi-value__sep" aria-hidden="true"> · </span>` +
    `<button type="button" class="multi-value__more" data-multi-value-trigger="${escapeMultiValueHtml(uid)}" aria-expanded="false" aria-controls="${popoverId}">+${overflowCount}</button>` +
    `<span id="${backdropId}" class="multi-value__backdrop" hidden data-multi-value-backdrop="${escapeMultiValueHtml(uid)}" aria-hidden="true"></span>` +
    `<span id="${popoverId}" class="multi-value__popover" role="dialog" aria-modal="true" hidden data-multi-value-popover="${escapeMultiValueHtml(uid)}">` +
    `<button type="button" class="multi-value__close" data-multi-value-close="${escapeMultiValueHtml(uid)}" aria-label="Close">` +
    `<span class="material-symbols-outlined" aria-hidden="true">close</span></button>` +
    `<span class="multi-value__popover-body">${overflowText}</span></span></span>`
  );
}

/** Join visible segments with middle dot separator. */
export function joinMultiValueParts(parts: string[]): string {
  return parts.join(' · ');
}
