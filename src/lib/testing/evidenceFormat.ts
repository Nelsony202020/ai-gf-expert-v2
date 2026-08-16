// Client-safe evidence answer formatting — no DB or Node built-ins.
// Used by the admin UI; server export code lives in evidenceExport.ts.

import {
  formatLibraryAmountSummary,
  formatLibraryVarietySummary,
  formatGenderCountSummary,
  isGenderCountAnswerSlug,
  isLibraryAmountSlug,
  isLibraryVarietyQualitativeSlug,
} from './libraryVariety';
import { formatCustomPromptPresetSummary, isCustomPromptPresetSlug } from './customPromptPreset';
import { formatSupportChannelsSummary } from './supportChannelsDisplay';

type RawValue =
  | { value: number; detail?: Record<string, unknown> }
  | { status: string; detail?: Record<string, unknown> }
  | { text: string; detail?: Record<string, unknown> }
  | { structured: Record<string, unknown> };

function joinList(values: unknown): string {
  if (!Array.isArray(values)) return '';
  return values.map((v) => String(v)).filter(Boolean).join(', ');
}

function parseOtherEntries(detail: Record<string, unknown> | null): string[] {
  if (!detail) return [];
  if (Array.isArray(detail.otherEntries)) {
    return (detail.otherEntries as unknown[])
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);
  }
  const legacy = typeof detail.other === 'string' ? detail.other : '';
  return legacy
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinMultiSelectLabels(detail: Record<string, unknown> | null): string {
  if (!detail) return '';
  const selected = joinList(detail.selected);
  const other = joinList(parseOtherEntries(detail));
  return [selected, other].filter(Boolean).join(', ');
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
  if (detail.none === true) return 'None';
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
  if (!raw || typeof raw !== 'object') {
    if (isUnknown) return 'Unknown';
    return '';
  }
  const rv = raw as RawValue;

  // Prefer qualitative library-variety labels (including unknown / not countable).
  if (def.slug && isLibraryVarietyQualitativeSlug(def.slug)) {
    const summary = formatLibraryVarietySummary(rv, def.slug);
    if (summary) return summary;
  }
  if (def.slug && isLibraryAmountSlug(def.slug)) {
    const summary = formatLibraryAmountSummary(rv);
    if (summary) return summary;
  }
  if (def.slug && isGenderCountAnswerSlug(def.slug)) {
    const summary = formatGenderCountSummary(rv);
    if (summary) return summary;
  }
  if (def.slug && isCustomPromptPresetSlug(def.slug)) {
    const summary = formatCustomPromptPresetSummary(rv);
    if (summary) return summary;
  }
  if (def.slug === 'support-channels') {
    const summary = formatSupportChannelsSummary(rv);
    if (summary) return summary;
  }

  if (isUnknown) return 'Unknown';

  const checklistLabel =
    def.slug === 'included-features' || def.slug === 'pricing-clarity' ? 'features' : 'items';
  const checklistText = formatChecklistAnswer(raw, { itemLabel: checklistLabel });
  if (checklistText) return checklistText;

  // Lazy import avoided — keep period display inlined for free-access counts.
  if (
    def.slug &&
    ['free-chat', 'free-characters', 'free-images', 'free-video', 'free-voice'].includes(def.slug) &&
    'value' in rv &&
    typeof rv.value === 'number'
  ) {
    const detail =
      'detail' in rv && rv.detail && typeof rv.detail === 'object'
        ? (rv.detail as Record<string, unknown>)
        : null;
    const period = detail?.period;
    const unitMap: Record<string, string> = {
      'free-chat': 'messages',
      'free-characters': 'characters',
      'free-images': 'images',
      'free-video': 'videos',
      'free-voice': 'sec voice',
    };
    const unit = unitMap[def.slug] ?? def.unit ?? '';
    const suffix = period === 'day' ? ' / day' : period === 'month' ? ' / month' : '';
    return `${rv.value} ${unit}${suffix}`.trim();
  }

  if ('status' in rv) {
    const map: Record<string, string> = {
      na: 'N/A',
      yes: 'Yes',
      no: 'No',
      limited: 'Limited',
      optional: 'Optional',
      unknown: 'Unknown',
      not_stated: 'Not stated',
    };
    return map[String(rv.status)] ?? String(rv.status);
  }
  if ('value' in rv && typeof rv.value === 'number') {
    const unit = def.unit ? ` ${def.unit}` : '';
    let base: string;
    if (def.slug === 'ease-of-use' || (def.measurementType === 'scale' && def.unit === 'score')) {
      base = `${rv.value}/10`;
    } else if (def.measurementType === 'percentage') base = `${rv.value}%`;
    else base = `${rv.value}${unit}`;

    const detail =
      'detail' in rv && rv.detail && typeof rv.detail === 'object'
        ? (rv.detail as Record<string, unknown>)
        : null;
    const labels = joinMultiSelectLabels(detail);
    if (labels) return `${base} (${labels})`;
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
    const selected = joinMultiSelectLabels(detail);
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
