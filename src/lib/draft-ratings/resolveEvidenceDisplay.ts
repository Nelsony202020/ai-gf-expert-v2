import { formatEvidenceAnswer } from '../testing/evidenceExport';
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

function formatPlatformExtrasDisplay(listRaw: unknown, liveRaw?: unknown): string {
  const structured =
    listRaw && typeof listRaw === 'object' && 'structured' in listRaw
      ? (listRaw as { structured?: Record<string, unknown> }).structured
      : undefined;

  let hasBonus: 'yes' | 'no' | '' = '';
  if (structured?.hasBonus === 'yes' || structured?.hasBonus === 'no') {
    hasBonus = structured.hasBonus;
  }

  if (hasBonus === 'no') return 'No bonus features found';
  if (hasBonus !== 'yes') return '';

  const extras = parseBonusExtrasRaw(listRaw);
  const cam =
    yesNoFromRaw(liveRaw) === 'yes'
      ? 'AI cam available'
      : yesNoFromRaw(liveRaw) === 'no'
        ? 'No AI cam'
        : '';

  const parts: string[] = [];
  if (cam) parts.push(cam);
  if (extras.length > 0) {
    parts.push(
      extras
        .slice(0, 6)
        .map((e) => (e.note ? `${e.name} (${e.note})` : e.name))
        .join('; '),
    );
  }
  if (parts.length === 0) return 'Bonus features available';
  return parts.join(' · ');
}

/** Public-facing display string — prefers saved publicResult, falls back to rawValue formatting. */
export function resolveEvidenceDisplayValue(def: EvidenceDef, row: EvidenceRow): string {
  const published = row.publicResult?.trim();
  if (published && !published.startsWith('{')) return published;

  if (row.notApplicable) return 'Not applicable';
  if (row.isUnknown || row.unableToVerify) return 'Could not verify';

  const raw = row.rawValue;
  if (def.slug === 'platform-extras-list' && raw) {
    const formatted = formatPlatformExtrasDisplay(raw);
    if (formatted) return formatted;
  }

  if (!raw) return published ?? '';

  if (typeof raw === 'object' && raw !== null) {
    if ('value' in raw && typeof (raw as { value: unknown }).value === 'number') {
      const templated = renderPublicResult(def as Parameters<typeof renderPublicResult>[0], (raw as { value: number }).value);
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
