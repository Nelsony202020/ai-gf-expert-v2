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

/** First 2 inline; rest behind +N when 3 or more values. */
export function segmentMultiValues(values: string[]): MultiValueSegments {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  if (cleaned.length <= 2) {
    return { visible: cleaned, overflow: [], overflowCount: 0 };
  }
  return {
    visible: cleaned.slice(0, 2),
    overflow: cleaned.slice(2),
    overflowCount: cleaned.length - 2,
  };
}

/** Join visible segments with middle dot separator. */
export function joinMultiValueParts(parts: string[]): string {
  return parts.join(' · ');
}
