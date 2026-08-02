// Client-safe evidence answer formatting — no DB or Node built-ins.
// Used by the admin UI; server export code lives in evidenceExport.ts.

type RawValue =
  | { value: number; detail?: Record<string, unknown> }
  | { status: string; detail?: Record<string, unknown> }
  | { text: string; detail?: Record<string, unknown> }
  | { structured: Record<string, unknown> };

function joinList(values: unknown): string {
  if (!Array.isArray(values)) return '';
  return values.map((v) => String(v)).filter(Boolean).join(', ');
}

/** Checklist answers stored as percentage + detail.checked — show "N of M" per methodology. */
export function formatChecklistAnswer(
  raw: unknown,
  opts?: { itemLabel?: string },
): string | null {
  if (!raw || typeof raw !== 'object' || !('value' in raw)) return null;
  const detail =
    'detail' in raw && raw.detail && typeof raw.detail === 'object'
      ? (raw.detail as Record<string, unknown>)
      : null;
  if (!detail) return null;
  const checked = Array.isArray(detail.checked) ? detail.checked : null;
  const total = typeof detail.total === 'number' ? detail.total : null;
  if (!checked || !total || total <= 0) return null;
  const n = checked.length;
  const label = opts?.itemLabel ?? 'items';
  return `${n} of ${total} ${label}`;
}

/** Human-readable primary answer from rawValue + flags. */
export function formatEvidenceAnswer(
  def: { unit?: string; measurementType?: string; slug?: string },
  raw: unknown,
  notApplicable: boolean,
  isUnknown: boolean,
): string {
  if (notApplicable) return 'N/A';
  if (isUnknown) return 'Unknown';
  if (!raw || typeof raw !== 'object') return '';
  const rv = raw as RawValue;

  const checklistLabel =
    def.slug === 'included-features' || def.slug === 'pricing-clarity' ? 'features' : 'items';
  const checklistText = formatChecklistAnswer(raw, { itemLabel: checklistLabel });
  if (checklistText) return checklistText;

  if ('status' in rv) {
    const map: Record<string, string> = {
      na: 'N/A',
      yes: 'Yes',
      no: 'No',
      limited: 'Limited',
      optional: 'Optional',
      unknown: 'Unknown',
    };
    return map[String(rv.status)] ?? String(rv.status);
  }
  if ('value' in rv && typeof rv.value === 'number') {
    const unit = def.unit ? ` ${def.unit}` : '';
    let base: string;
    if (def.measurementType === 'percentage') base = `${rv.value}%`;
    else base = `${rv.value}${unit}`;

    const detail =
      'detail' in rv && rv.detail && typeof rv.detail === 'object'
        ? (rv.detail as Record<string, unknown>)
        : null;
    const selected = detail && Array.isArray(detail.selected) ? joinList(detail.selected) : '';
    if (selected) return `${base} (${selected})`;
    return base;
  }
  if ('text' in rv && typeof rv.text === 'string') return rv.text.trim();
  if ('structured' in rv && rv.structured) {
    try {
      return JSON.stringify(rv.structured);
    } catch {
      return '[structured]';
    }
  }
  return '';
}

/** Full structured detail (JSON) for complex answers — used in CSV. */
export function formatEvidenceAnswerDetail(raw: unknown): string {
  if (raw == null) return '';
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

/** Plain-English detail for PDF / readable exports. */
export function formatEvidenceDetailReadable(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw !== 'object') return String(raw);

  const rv = raw as Record<string, unknown>;
  const parts: string[] = [];
  const detail =
    rv.detail && typeof rv.detail === 'object' ? (rv.detail as Record<string, unknown>) : null;

  if (detail) {
    const selected = joinList(detail.selected);
    if (selected) parts.push(`Selected: ${selected}`);
    const checked = joinList(detail.checked);
    if (checked) parts.push(`Checked: ${checked}`);
    const options = joinList(detail.options);
    if (options) parts.push(`Options: ${options}`);
    if (typeof detail.numerator === 'number' && typeof detail.denominator === 'number') {
      parts.push(`Ratio: ${detail.numerator}/${detail.denominator}`);
    }
    if (typeof detail.notes === 'string' && detail.notes.trim()) {
      parts.push(`Notes: ${detail.notes.trim()}`);
    }
  }

  if ('text' in rv && typeof rv.text === 'string' && rv.text.trim()) {
    parts.push(rv.text.trim());
  }

  if (parts.length > 0) return parts.join(' | ');

  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

export function formatExportDate(ts: number | string | undefined | null): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return String(ts);
  }
}

export function truncateForPdf(text: string, maxLen = 72): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 3)}...`;
}

export function slugifyFilename(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
