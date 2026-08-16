// Qualitative / approximate answers for huge community character libraries.

export const LIBRARY_VARIETY_QUALITATIVE_SLUGS = [
  'ethnicities',
  'personalities',
  'scenarios',
] as const;

export type LibraryVarietyQualitativeSlug =
  (typeof LIBRARY_VARIETY_QUALITATIVE_SLUGS)[number];

export const LIBRARY_AMOUNT_SLUG = 'amount';

export const GENDER_COUNT_ANSWER_SLUGS = [
  'female-count',
  'male-count',
  'anime-female-count',
  'anime-male-count',
  'transgender-count',
  'non-binary-count',
  'other-count',
] as const;

export type GenderCountSlug = (typeof GENDER_COUNT_ANSWER_SLUGS)[number];

export type LibraryVarietyLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high'
  | 'not_countable'
  | 'not_disclosed';

export type LibraryAmountPreset = '100k+' | '500k+' | '1M+' | 'not_disclosed';

export type GenderCountPreset =
  | '10k+'
  | '100k+'
  | '500k+'
  | 'not_countable'
  | 'not_disclosed';

/** Band-mapped stand-in counts. not_countable → top band (full points). */
const QUALITATIVE_COUNTS: Record<
  LibraryVarietyQualitativeSlug,
  Record<'low' | 'medium' | 'high' | 'very_high' | 'not_countable', number>
> = {
  // ethnicities bands: ≤3→1 … ≤15→7, else→10
  ethnicities: { low: 3, medium: 10, high: 15, very_high: 16, not_countable: 16 },
  // personalities/scenarios: ≤2→2 … ≤20→8, else→10
  personalities: { low: 2, medium: 10, high: 20, very_high: 21, not_countable: 21 },
  scenarios: { low: 2, medium: 10, high: 20, very_high: 21, not_countable: 21 },
};

export const LIBRARY_VARIETY_LEVEL_OPTIONS: {
  value: LibraryVarietyLevel;
  label: string;
}[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very high' },
  { value: 'not_countable', label: 'Not countable / community-generated' },
  { value: 'not_disclosed', label: 'Not disclosed' },
];

export const LIBRARY_AMOUNT_PRESET_OPTIONS: {
  value: LibraryAmountPreset;
  label: string;
  count?: number;
}[] = [
  { value: '100k+', label: '100k+', count: 100_000 },
  { value: '500k+', label: '500k+', count: 500_000 },
  { value: '1M+', label: '1M+', count: 1_000_000 },
  { value: 'not_disclosed', label: 'Not disclosed' },
];

export const GENDER_COUNT_PRESET_OPTIONS: {
  value: GenderCountPreset;
  label: string;
  count?: number;
}[] = [
  { value: '10k+', label: '10k+', count: 10_000 },
  { value: '100k+', label: '100k+', count: 100_000 },
  { value: '500k+', label: '500k+', count: 500_000 },
  { value: 'not_countable', label: 'Not countable / community-generated' },
  { value: 'not_disclosed', label: 'Not disclosed' },
];

export function isLibraryVarietyQualitativeSlug(
  slug: string,
): slug is LibraryVarietyQualitativeSlug {
  return (LIBRARY_VARIETY_QUALITATIVE_SLUGS as readonly string[]).includes(slug);
}

export function isLibraryAmountSlug(slug: string): boolean {
  return slug === LIBRARY_AMOUNT_SLUG;
}

export function isGenderCountAnswerSlug(slug: string): slug is GenderCountSlug {
  return (GENDER_COUNT_ANSWER_SLUGS as readonly string[]).includes(slug);
}

type RawLike =
  | { value: number; detail?: Record<string, unknown> }
  | { status: string; detail?: Record<string, unknown> }
  | { text: string; detail?: Record<string, unknown> }
  | { structured: Record<string, unknown> }
  | Record<string, unknown>;

function asRaw(raw: unknown): RawLike | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as RawLike;
}

export function parseLibraryVarietyLevel(raw: unknown): LibraryVarietyLevel | '' {
  const r = asRaw(raw);
  if (!r) return '';
  const detail =
    'detail' in r && r.detail && typeof r.detail === 'object'
      ? (r.detail as Record<string, unknown>)
      : undefined;
  const level = typeof detail?.qualitative === 'string' ? detail.qualitative : '';
  if (LIBRARY_VARIETY_LEVEL_OPTIONS.some((o) => o.value === level)) {
    return level as LibraryVarietyLevel;
  }
  if ('status' in r && r.status === 'unknown') return 'not_disclosed';
  if ('value' in r && typeof r.value === 'number' && Number.isFinite(r.value)) {
    return inferLibraryVarietyLevelFromCount('personalities', r.value);
  }
  return '';
}

export function inferLibraryVarietyLevelFromCount(
  slug: LibraryVarietyQualitativeSlug,
  count: number,
): LibraryVarietyLevel {
  const c = QUALITATIVE_COUNTS[slug];
  const entries: Array<['low' | 'medium' | 'high' | 'very_high', number]> = [
    ['low', c.low],
    ['medium', c.medium],
    ['high', c.high],
    ['very_high', c.very_high],
  ];
  let best: LibraryVarietyLevel = 'low';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const [level, standIn] of entries) {
    const dist = Math.abs(standIn - count);
    if (dist < bestDist) {
      best = level;
      bestDist = dist;
    }
  }
  return best;
}

export function parseLibraryVarietyLevelForSlug(
  slug: LibraryVarietyQualitativeSlug,
  raw: unknown,
): LibraryVarietyLevel | '' {
  const r = asRaw(raw);
  if (!r) return '';
  const detail =
    'detail' in r && r.detail && typeof r.detail === 'object'
      ? (r.detail as Record<string, unknown>)
      : undefined;
  const level = typeof detail?.qualitative === 'string' ? detail.qualitative : '';
  if (LIBRARY_VARIETY_LEVEL_OPTIONS.some((o) => o.value === level)) {
    return level as LibraryVarietyLevel;
  }
  if ('status' in r && r.status === 'unknown') return 'not_disclosed';
  if ('value' in r && typeof r.value === 'number' && Number.isFinite(r.value)) {
    return inferLibraryVarietyLevelFromCount(slug, r.value);
  }
  return '';
}

export function parseLibrarySampleNote(raw: unknown): string {
  const r = asRaw(raw);
  if (!r || !('detail' in r) || !r.detail || typeof r.detail !== 'object') return '';
  const note = (r.detail as Record<string, unknown>).sampleNote;
  return typeof note === 'string' ? note : '';
}

export function buildLibraryVarietyRaw(
  slug: LibraryVarietyQualitativeSlug,
  level: LibraryVarietyLevel | '',
  sampleNote: string,
): RawLike | undefined {
  if (!level) return undefined;
  const note = sampleNote.trim();
  const detailBase: Record<string, unknown> = {
    qualitative: level,
    ...(note ? { sampleNote: note } : {}),
  };

  // Not disclosed → excluded from score. Not countable → full points (top band).
  if (level === 'not_disclosed') {
    return {
      status: 'unknown',
      detail: { ...detailBase, excludeFromScore: true },
    };
  }

  if (level === 'not_countable') {
    return {
      value: QUALITATIVE_COUNTS[slug].not_countable,
      detail: {
        ...detailBase,
        fullPoints: true,
        rubric: 'Not countable / community-generated',
      },
    };
  }

  const value = QUALITATIVE_COUNTS[slug][level];
  return {
    value,
    detail: {
      ...detailBase,
      rubric: LIBRARY_VARIETY_LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? level,
    },
  };
}

export function parseLibraryAmountPreset(raw: unknown): LibraryAmountPreset | '' {
  const r = asRaw(raw);
  if (!r) return '';
  const detail =
    'detail' in r && r.detail && typeof r.detail === 'object'
      ? (r.detail as Record<string, unknown>)
      : undefined;
  const preset = typeof detail?.amountPreset === 'string' ? detail.amountPreset : '';
  if (LIBRARY_AMOUNT_PRESET_OPTIONS.some((o) => o.value === preset)) {
    return preset as LibraryAmountPreset;
  }
  if ('status' in r && r.status === 'unknown') return 'not_disclosed';
  return '';
}

export function buildLibraryAmountFromPreset(
  preset: LibraryAmountPreset | '',
): RawLike | undefined {
  if (!preset) return undefined;
  if (preset === 'not_disclosed') {
    return {
      status: 'unknown',
      detail: { amountPreset: preset, excludeFromScore: true },
    };
  }
  const opt = LIBRARY_AMOUNT_PRESET_OPTIONS.find((o) => o.value === preset);
  if (!opt?.count) return undefined;
  return {
    value: opt.count,
    detail: { amountPreset: preset, rubric: opt.label, fullPoints: true },
  };
}

export function buildLibraryAmountFromNumber(n: number | undefined): RawLike | undefined {
  if (n === undefined) return undefined;
  return { value: n };
}

export function parseGenderCountPreset(raw: unknown): GenderCountPreset | '' {
  const r = asRaw(raw);
  if (!r) return '';
  const detail =
    'detail' in r && r.detail && typeof r.detail === 'object'
      ? (r.detail as Record<string, unknown>)
      : undefined;
  const preset = typeof detail?.genderPreset === 'string' ? detail.genderPreset : '';
  if (GENDER_COUNT_PRESET_OPTIONS.some((o) => o.value === preset)) {
    return preset as GenderCountPreset;
  }
  if ('status' in r && r.status === 'unknown') {
    return detail?.qualitative === 'not_countable' ? 'not_countable' : 'not_disclosed';
  }
  return '';
}

export function buildGenderCountFromPreset(preset: GenderCountPreset | ''): RawLike | undefined {
  if (!preset) return undefined;
  if (preset === 'not_disclosed') {
    return {
      status: 'unknown',
      detail: { genderPreset: preset, excludeFromScore: true },
    };
  }
  if (preset === 'not_countable') {
    // Legitimate complete answer — full points, not N/A.
    return {
      value: 500_000,
      detail: {
        genderPreset: preset,
        qualitative: 'not_countable',
        fullPoints: true,
        rubric: 'Not countable / community-generated',
      },
    };
  }
  const opt = GENDER_COUNT_PRESET_OPTIONS.find((o) => o.value === preset);
  if (!opt?.count) return undefined;
  return {
    value: opt.count,
    detail: { genderPreset: preset, rubric: opt.label, fullPoints: true },
  };
}

export function buildGenderCountFromNumber(n: number | undefined): RawLike | undefined {
  if (n === undefined) return undefined;
  return { value: n };
}

export function formatLibraryVarietySummary(raw: unknown, slug?: string): string | null {
  const r = asRaw(raw);
  if (!r) return null;
  const level =
    slug && isLibraryVarietyQualitativeSlug(slug)
      ? parseLibraryVarietyLevelForSlug(slug, r)
      : parseLibraryVarietyLevel(r);
  if (!level) return null;
  const label =
    LIBRARY_VARIETY_LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? level;
  const note = parseLibrarySampleNote(r).trim();
  const detail =
    'detail' in r && r.detail && typeof r.detail === 'object'
      ? (r.detail as Record<string, unknown>)
      : undefined;
  if (!detail?.qualitative && 'value' in r && typeof r.value === 'number' && !note) {
    return `${r.value} (${label})`;
  }
  return note ? `${label} — ${note}` : label;
}

export function formatLibraryAmountSummary(raw: unknown): string | null {
  const r = asRaw(raw);
  if (!r) return null;
  const preset = parseLibraryAmountPreset(r);
  if (preset) {
    return LIBRARY_AMOUNT_PRESET_OPTIONS.find((o) => o.value === preset)?.label ?? preset;
  }
  if ('value' in r && typeof r.value === 'number') return String(r.value);
  return null;
}

export function formatGenderCountSummary(raw: unknown): string | null {
  const r = asRaw(raw);
  if (!r) return null;
  const preset = parseGenderCountPreset(r);
  if (preset) {
    return GENDER_COUNT_PRESET_OPTIONS.find((o) => o.value === preset)?.label ?? preset;
  }
  if ('value' in r && typeof r.value === 'number') return String(r.value);
  return null;
}
