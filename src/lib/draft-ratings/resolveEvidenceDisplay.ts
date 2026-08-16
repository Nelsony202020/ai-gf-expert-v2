import { formatEvidenceAnswer, formatChecklistAnswer } from '../testing/evidenceFormat';
import { formatRetentionPeriodSummary } from '../testing/retentionPeriod';
import type { RawValue } from '../scoring/engine';
import { formatFreeAccessDetailsSummary, parseFreeAccessDetails } from '../testing/freeAccessDetails';
import {
  formatFreeAccessAllowanceSummary,
  isFreeAccessAllowanceSlug,
} from '../testing/freeAccessAllowance';
import { formatSupportChannelsSummary } from '../testing/supportChannelsDisplay';
import { formatCustomPromptPresetSummary, isCustomPromptPresetSlug } from '../testing/customPromptPreset';
import { fmtMoney } from '../pricing/calc';
import { renderPublicResult } from '../../components/admin/testing/presentation';

type EvidenceDef = {
  slug?: string;
  unit?: string;
  measurementType?: string;
  publicResultTemplate?: string;
  name?: string;
};

type EvidenceRow = {
  publicResult?: string | null;
  rawValue?: unknown;
  notApplicable?: boolean;
  isUnknown?: boolean;
  unableToVerify?: boolean;
};

type BonusExtraRow = { name: string; note?: string };

const PRICING_CURRENCY_SUFFIX: Record<string, string> = {
  'image-cost': '/ image',
  'video-cost': '/ 10 sec',
  'voice-cost': '/ 10 sec',
  'call-cost': '/ min',
  'monthly-spend': '/ month',
};

const FREE_VALUE_LABELS: Record<string, string> = {
  yes: 'No card needed',
  limited: 'Limited free access',
  no: 'No free access',
};

function parseBonusExtrasRaw(raw: unknown): BonusExtraRow[] {
  if (!raw || typeof raw !== 'object') return [];
  const structured =
    'structured' in raw ? (raw as { structured?: Record<string, unknown> }).structured : undefined;
  if (!structured || structured.hasBonus !== 'yes') return [];
  const extras = Array.isArray(structured.extras)
    ? (structured.extras as Array<{ name?: string; note?: string }>)
    : [];
  return extras
    .map((row) => ({
      name: row.name?.trim() ?? '',
      note: row.note?.trim() || undefined,
    }))
    .filter((row) => row.name);
}

export function parseBonusExtrasFromRaw(raw: unknown): BonusExtraRow[] {
  return parseBonusExtrasRaw(raw);
}

function yesNoFromRaw(raw: unknown): 'yes' | 'no' | '' {
  if (!raw || typeof raw !== 'object' || !('status' in raw)) return '';
  const status = String((raw as { status: unknown }).status);
  if (status === 'yes') return 'yes';
  if (status === 'no') return 'no';
  return '';
}

function formatPricingCurrency(slug: string, value: number): string {
  const suffix = PRICING_CURRENCY_SUFFIX[slug];
  const money = fmtMoney(value);
  return suffix ? `${money} ${suffix}` : money;
}

function formatFreeAccessValue(slug: string | undefined, raw: unknown): string | null {
  if (!slug || !raw || typeof raw !== 'object') return null;

  if (isFreeAccessAllowanceSlug(slug)) {
    const formatted = formatFreeAccessAllowanceSummary(slug, raw as RawValue);
    if (formatted !== '—') return formatted;
  }

  if (slug === 'free-value' && 'status' in raw) {
    const status = String((raw as { status: unknown }).status);
    const detail =
      'detail' in raw && raw.detail && typeof raw.detail === 'object'
        ? (raw.detail as Record<string, unknown>)
        : undefined;
    if (typeof detail?.label === 'string' && detail.label.trim()) return detail.label.trim();
    if (FREE_VALUE_LABELS[status]) return FREE_VALUE_LABELS[status];
    if ('text' in raw && typeof (raw as { text: unknown }).text === 'string') {
      return (raw as { text: string }).text.trim();
    }
  }

  if (slug === 'restrictions') {
    if ('text' in raw && typeof (raw as { text: unknown }).text === 'string') {
      const text = (raw as { text: string }).text.trim();
      if (text) return text;
    }
    if ('structured' in raw) {
      return formatFreeAccessDetailsSummary(parseFreeAccessDetails(raw as { structured?: Record<string, unknown> }));
    }
  }

  if (slug === 'security-incidents' && 'value' in raw) {
    const detail =
      'detail' in raw && raw.detail && typeof raw.detail === 'object'
        ? (raw.detail as Record<string, unknown>)
        : undefined;
    const count = Number((raw as { value: unknown }).value);
    if (count === 0 && detail?.foundIncidents === false) return '0 confirmed incidents';
    if (Number.isFinite(count) && count >= 0 && detail?.foundIncidents === true) {
      const incidents = Array.isArray(detail.incidents) ? detail.incidents : [];
      const excluded = incidents.filter(
        (row) =>
          row &&
          typeof row === 'object' &&
          typeof (row as { url?: unknown }).url === 'string' &&
          (row as { url: string }).url.trim() &&
          Boolean((row as { excludeFromRating?: unknown }).excludeFromRating),
      ).length;
      if (count > 0) {
        const base = `${count} confirmed incident${count === 1 ? '' : 's'}`;
        return excluded > 0 ? `${base} (${excluded} excluded)` : base;
      }
    }
    if (Number.isFinite(count) && count > 0) {
      return `${count} confirmed incident${count === 1 ? '' : 's'}`;
    }
  }

  if (slug === 'retention' && 'value' in raw) {
    const formatted = formatRetentionPeriodSummary(raw as RawValue);
    if (formatted !== '—') return formatted;
  }

  return null;
}

export function formatPlatformExtrasDisplay(listRaw: unknown, liveRaw?: unknown): string {
  const structured =
    listRaw && typeof listRaw === 'object' && 'structured' in listRaw
      ? (listRaw as { structured?: Record<string, unknown> }).structured
      : undefined;

  let hasBonus: 'yes' | 'no' | '' = '';
  if (structured?.hasBonus === 'yes' || structured?.hasBonus === 'no') {
    hasBonus = structured.hasBonus;
  }

  if (hasBonus === 'no') return 'None';
  if (hasBonus !== 'yes') return '';

  const names: string[] = [];
  if (yesNoFromRaw(liveRaw) === 'yes') names.push('Live cam');
  for (const extra of parseBonusExtrasRaw(listRaw)) {
    if (extra.name.trim()) names.push(extra.name.trim());
  }
  if (names.length === 0) return '—';
  return names.slice(0, 8).join(', ');
}

export function formatBonusFeaturesSummaryLine(listRaw: unknown, liveRaw?: unknown): string {
  return formatPlatformExtrasDisplay(listRaw, liveRaw);
}

/** Public-facing display string — prefers saved publicResult, falls back to rawValue formatting. */
export function resolveEvidenceDisplayValue(def: EvidenceDef, row: EvidenceRow): string {
  const raw = row.rawValue;
  const checklistFromRaw = formatChecklistAnswer(raw, {
    itemLabel: def.slug === 'included-features' ? 'features included' : 'items',
  });

  const published = row.publicResult?.trim();
  if (published && !published.startsWith('{')) {
    // Stale "90%" public lines — prefer checklist count when raw has detail.
    if (checklistFromRaw && /^\d+(\.\d+)?%$/.test(published)) return checklistFromRaw;
    return published;
  }

  if (row.notApplicable) return 'Not applicable';
  if (row.isUnknown || row.unableToVerify) return 'Could not verify';

  if (def.slug === 'platform-extras-list' && raw) {
    const formatted = formatPlatformExtrasDisplay(raw);
    if (formatted) return formatted;
  }

  if (def.slug === 'support-channels' && raw) {
    const summary = formatSupportChannelsSummary(raw);
    if (summary) return summary;
  }

  if (def.slug && isCustomPromptPresetSlug(def.slug) && raw) {
    const summary = formatCustomPromptPresetSummary(raw);
    if (summary) return summary;
  }

  if (!raw) return published ?? '';

  if (typeof raw === 'object' && raw !== null) {
    const freeAccess = formatFreeAccessValue(def.slug, raw);
    if (freeAccess) return freeAccess;

    if (def.slug === 'annual-price' && 'value' in raw && typeof (raw as { value: unknown }).value === 'number') {
      const effective = (raw as { value: number }).value;
      const detail =
        'detail' in raw ? (raw as { detail?: { annualTotal?: number } }).detail : undefined;
      const annualTotal = detail?.annualTotal;
      if (annualTotal != null) {
        return `${fmtMoney(annualTotal)}/year (${fmtMoney(effective)}/month effective)`;
      }
      return `${fmtMoney(effective)}/month effective`;
    }

    if (def.slug === 'ease-of-use' && 'value' in raw && typeof (raw as { value: unknown }).value === 'number') {
      return `${(raw as { value: number }).value}/10 ease`;
    }

    if ('value' in raw && typeof (raw as { value: unknown }).value === 'number') {
      const num = (raw as { value: number }).value;
      if (def.slug && PRICING_CURRENCY_SUFFIX[def.slug]) {
        return formatPricingCurrency(def.slug, num);
      }
      const templated = renderPublicResult(def as Parameters<typeof renderPublicResult>[0], num);
      if (templated) return templated;
    }
    if ('text' in raw && typeof (raw as { text: unknown }).text === 'string') {
      const templated = renderPublicResult(def as Parameters<typeof renderPublicResult>[0], (raw as { text: string }).text);
      if (templated) return templated;
    }
  }

  let answer = formatEvidenceAnswer(
    def,
    raw,
    Boolean(row.notApplicable),
    Boolean(row.isUnknown),
  );

  if (def.unit === 'count') {
    answer = answer.replace(/\s*count\b/g, '').trim();
  }

  if (answer.startsWith('{') && def.slug === 'platform-extras-list') {
    return formatPlatformExtrasDisplay(raw) || 'Bonus features recorded';
  }

  return answer;
}

export function evidenceHasRecordedAnswer(def: EvidenceDef, row: EvidenceRow): boolean {
  return Boolean(resolveEvidenceDisplayValue(def, row).trim() || row.notApplicable || row.isUnknown || row.unableToVerify);
}
