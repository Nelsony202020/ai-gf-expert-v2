// Coerce loose OpenAI JSON into shapes our Zod schemas accept.

import { AI_PRIVACY_SLUGS, type AiPrivacySlug, type PrivacyAnswerProposal } from './types';

const FILL_STATUSES = new Set<PrivacyAnswerProposal['status']>([
  'filled',
  'needs_review',
  'not_found',
  'conflicting',
  'not_applicable',
]);

const RAW_STATUSES = new Set(['yes', 'limited', 'optional', 'no', 'unknown']);

const SLUG_ALIASES: Record<string, AiPrivacySlug> = {
  'human-review': 'human-review',
  human_review: 'human-review',
  humanreview: 'human-review',
  'data-sharing': 'data-sharing',
  data_sharing: 'data-sharing',
  advertising: 'advertising',
  retention: 'retention',
  'policy-clarity': 'policy-clarity',
  policy_clarity: 'policy-clarity',
  training: 'training',
  'training-opt-out': 'training-opt-out',
  training_opt_out: 'training-opt-out',
  'delete-account': 'delete-account',
  delete_account: 'delete-account',
  'delete-personal-data': 'delete-personal-data',
  delete_personal_data: 'delete-personal-data',
  refunds: 'refunds',
  refund: 'refunds',
};

function normalizeFillStatus(value: unknown, raw: unknown): PrivacyAnswerProposal['status'] {
  if (typeof value !== 'string') return 'needs_review';
  const key = value.toLowerCase().trim().replace(/\s+/g, '_');
  if (FILL_STATUSES.has(key as PrivacyAnswerProposal['status'])) {
    return key as PrivacyAnswerProposal['status'];
  }
  const spaced = value.toLowerCase().trim();
  if (spaced === 'needs review') return 'needs_review';
  if (spaced === 'not found') return 'not_found';
  if (spaced === 'not applicable') return 'not_applicable';
  if (spaced === 'partial' || spaced === 'ambiguous' || spaced === 'unclear') return 'needs_review';
  if (spaced === 'found' || spaced === 'complete') return 'filled';
  // Model often puts yes/no/unknown in status instead of raw.
  if (RAW_STATUSES.has(key)) {
    return key === 'unknown' ? 'not_found' : 'filled';
  }
  if (raw && typeof raw === 'object') return 'filled';
  return 'needs_review';
}

function normalizeConfidence(value: unknown): PrivacyAnswerProposal['confidence'] {
  if (typeof value !== 'string') return 'medium';
  const key = value.toLowerCase().trim();
  if (key === 'high' || key === 'medium' || key === 'low') return key;
  return 'medium';
}

function normalizeSlug(value: unknown): AiPrivacySlug | null {
  if (typeof value !== 'string') return null;
  const key = value.toLowerCase().trim();
  if (SLUG_ALIASES[key]) return SLUG_ALIASES[key];
  if ((AI_PRIVACY_SLUGS as readonly string[]).includes(key)) return key as AiPrivacySlug;
  return null;
}

function wordsFromText(text: string, count: number): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, count)
    .join(' ');
}

function normalizeEvidence(raw: unknown): PrivacyAnswerProposal['evidence'] {
  if (!Array.isArray(raw)) return [];
  const out: PrivacyAnswerProposal['evidence'] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const excerpt = String(row.excerpt ?? row.quote ?? row.text ?? '').trim();
    if (!excerpt) continue;
    const findText = String(row.findText ?? row.find_text ?? wordsFromText(excerpt, 10)).trim();
    if (!findText) continue;
    out.push({
      sourceDocumentId: String(row.sourceDocumentId ?? row.documentId ?? row.id ?? 'unknown'),
      sourceLabel: String(row.sourceLabel ?? row.label ?? row.source ?? 'Policy document').slice(0, 120),
      sourceUrl: row.sourceUrl ? String(row.sourceUrl).slice(0, 500) : undefined,
      section: String(row.section ?? 'Section not identified').slice(0, 200),
      excerpt: excerpt.slice(0, 400),
      findText: findText.slice(0, 120),
      ...(typeof row.characterStart === 'number' ? { characterStart: row.characterStart } : {}),
      ...(typeof row.characterEnd === 'number' ? { characterEnd: row.characterEnd } : {}),
    });
  }
  return out;
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
}

function coerceChoiceStatus(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.toLowerCase().trim().replace(/\s+/g, '_');
  if (RAW_STATUSES.has(key)) return key;
  if (key === 'partial' || key === 'sometimes' || key === 'restricted') return 'limited';
  if (key === 'opt_out' || key === 'opt-out' || key === 'optout') return 'optional';
  return null;
}

const CHOICE_OPTIONAL_SLUGS = new Set<AiPrivacySlug>(['data-sharing', 'advertising']);

function recordValueIgnoreCase(rec: Record<string, unknown>, keys: string[]): unknown {
  const lower = new Map(Object.keys(rec).map((k) => [k.toLowerCase(), rec[k]]));
  for (const key of keys) {
    if (lower.has(key)) return lower.get(key);
  }
  return undefined;
}

function coerceChoiceRaw(raw: unknown, statusWasAnswer: boolean, statusToken: string): unknown {
  if (typeof raw === 'string') {
    const status = coerceChoiceStatus(raw);
    return status ? { status } : undefined;
  }
  const rec = asRecord(raw);
  if (rec) {
    const status = coerceChoiceStatus(recordValueIgnoreCase(rec, ['status', 'value', 'answer']));
    if (status) return { status };
  }
  if (statusWasAnswer && RAW_STATUSES.has(statusToken)) {
    return { status: statusToken };
  }
  return undefined;
}

function normalizeRawForSlug(
  slug: AiPrivacySlug,
  status: PrivacyAnswerProposal['status'],
  raw: unknown,
  statusWasAnswer: boolean,
  statusToken: string,
): unknown {
  if (status === 'not_found' || status === 'not_applicable') return undefined;
  if (slug === 'retention' || slug === 'policy-clarity') {
    if (raw && typeof raw === 'object') return raw;
    return raw;
  }
  const coerced = coerceChoiceRaw(raw, statusWasAnswer, statusToken);
  if (coerced) {
    const rec = asRecord(coerced);
    const choice = typeof rec?.status === 'string' ? rec.status : '';
    if (choice === 'optional' && !CHOICE_OPTIONAL_SLUGS.has(slug)) {
      return { status: 'limited' };
    }
    return coerced;
  }
  return raw && typeof raw === 'object' ? raw : undefined;
}

function normalizeRetentionRaw(raw: unknown): { value: number; detail: { unit: 'weeks' | 'months' | 'years' } } | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  let value = typeof rec.value === 'number' ? rec.value : Number(rec.value);
  const detail = asRecord(rec.detail);
  let unit = typeof detail?.unit === 'string' ? detail.unit.toLowerCase().trim() : '';
  if (unit === 'week') unit = 'weeks';
  if (unit === 'month') unit = 'months';
  if (unit === 'year') unit = 'years';
  if (unit === 'days' || unit === 'day') {
    if (!Number.isFinite(value) || value <= 0) return null;
    if (value % 30 === 0) {
      value = value / 30;
      unit = 'months';
    } else if (value % 7 === 0) {
      value = value / 7;
      unit = 'weeks';
    } else if (value >= 365) {
      value = Math.round(value / 365);
      unit = 'years';
    } else if (value >= 28) {
      value = Math.round(value / 30);
      unit = 'months';
    } else {
      value = Math.max(1, Math.round(value / 7));
      unit = 'weeks';
    }
  }
  if (!Number.isFinite(value) || value <= 0) return null;
  if (unit !== 'weeks' && unit !== 'months' && unit !== 'years') return null;
  return { value, detail: { unit } };
}

function normalizePolicyClarityRaw(
  raw: unknown,
): { value: 0 | 50 | 100; detail: { rubric: 'Unclear' | 'Neutral' | 'Very clear' } } | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const rubricRaw = String(asRecord(rec.detail)?.rubric ?? rec.rubric ?? '').toLowerCase().trim();
  if (rubricRaw.includes('very clear') || rubricRaw === 'clear') {
    return { value: 100, detail: { rubric: 'Very clear' } };
  }
  if (rubricRaw.includes('neutral') || rubricRaw.includes('mixed') || rubricRaw.includes('partial')) {
    return { value: 50, detail: { rubric: 'Neutral' } };
  }
  if (rubricRaw.includes('unclear') || rubricRaw.includes('poor') || rubricRaw.includes('vague')) {
    return { value: 0, detail: { rubric: 'Unclear' } };
  }
  let value = typeof rec.value === 'number' ? rec.value : Number(rec.value);
  if (!Number.isFinite(value)) return null;
  if (value !== 0 && value !== 50 && value !== 100) {
    const candidates = [0, 50, 100] as const;
    value = candidates.reduce((best, cur) =>
      Math.abs(cur - value) < Math.abs(best - value) ? cur : best,
    );
  }
  const rubric = value === 100 ? 'Very clear' : value === 50 ? 'Neutral' : 'Unclear';
  return { value: value as 0 | 50 | 100, detail: { rubric } };
}

/**
 * Final pass after Zod: coerce each answer's raw into the shape EvidenceInput expects,
 * and keep best-guess raws for needs_review instead of wiping them to empty dropdowns.
 */
export function normalizePrivacyAnswerRaws(
  answers: PrivacyAnswerProposal[],
): PrivacyAnswerProposal[] {
  return answers.map((a) => {
    if (a.status === 'not_found' || a.status === 'not_applicable') {
      return { ...a, raw: undefined };
    }

    if (a.status === 'conflicting') {
      return {
        ...a,
        status: 'needs_review',
        raw: { status: 'unknown' as const },
        confidence: a.confidence === 'high' ? 'medium' : a.confidence,
      };
    }

    if (a.slug === 'retention') {
      const retention = normalizeRetentionRaw(a.raw);
      if (!retention) {
        return { ...a, status: 'not_found', raw: undefined, confidence: 'low' };
      }
      return { ...a, raw: retention };
    }

    if (a.slug === 'policy-clarity') {
      const clarity = normalizePolicyClarityRaw(a.raw);
      if (!clarity) {
        // Uncertain but still prefill a mid option so the dropdown isn't blank.
        if (a.status === 'filled' || a.status === 'needs_review') {
          return {
            ...a,
            status: 'needs_review',
            confidence: 'low',
            raw: { value: 50, detail: { rubric: 'Neutral' as const } },
          };
        }
        return { ...a, status: 'not_found', raw: undefined, confidence: 'low' };
      }
      return { ...a, raw: clarity };
    }

    const coerced = coerceChoiceRaw(a.raw, false, '');
    const rec = asRecord(coerced);
    let status = typeof rec?.status === 'string' ? rec.status : '';
    if (!RAW_STATUSES.has(status)) {
      // Model claimed an answer but gave a bad/missing raw — keep Unknown + needs review.
      return {
        ...a,
        status: 'needs_review',
        confidence: 'low',
        raw: { status: 'unknown' as const },
      };
    }
    if (status === 'optional' && !CHOICE_OPTIONAL_SLUGS.has(a.slug)) {
      status = 'limited';
    }
    return { ...a, raw: { status } };
  });
}

/** Best-effort repair of model JSON before Zod validation. */
export function coercePrivacyModelOutput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const root = raw as Record<string, unknown>;
  if (!Array.isArray(root.answers)) return raw;

  const answers = root.answers
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const slug = normalizeSlug(row.slug);
      if (!slug) return null;

      const statusToken =
        typeof row.status === 'string' ? row.status.toLowerCase().trim().replace(/\s+/g, '_') : '';
      const statusWasAnswer = RAW_STATUSES.has(statusToken);
      const status = normalizeFillStatus(row.status, row.raw);
      const evidence = normalizeEvidence(row.evidence);
      const rationale = String(row.rationale ?? row.explanation ?? row.summary ?? '').trim().slice(0, 500);

      return {
        slug,
        status,
        confidence: normalizeConfidence(row.confidence),
        raw: normalizeRawForSlug(slug, status, row.raw, statusWasAnswer, statusToken),
        ...(rationale ? { rationale } : {}),
        evidence,
      };
    })
    .filter(Boolean);

  return { ...root, answers };
}

/** Build a plain-language rationale when the model omitted one. */
export function buildAiFindingRationale(answer: PrivacyAnswerProposal): string {
  const parts: string[] = [];

  if (answer.status === 'not_found') {
    parts.push('No clear policy language for this question in the uploaded documents.');
  } else if (answer.status === 'not_applicable') {
    parts.push('Not applicable based on the uploaded policy documents.');
  } else if (answer.slug === 'delete-account' || answer.slug === 'delete-personal-data') {
    parts.push('Based on policy text only — still verify by testing delete controls in the app.');
  } else if (answer.evidence.length > 0) {
    const ev = answer.evidence[0];
    parts.push(
      `Policy states (${ev.sourceLabel}${ev.section ? `, ${ev.section}` : ''}): “${ev.excerpt.slice(0, 180)}${ev.excerpt.length > 180 ? '…' : ''}”`,
    );
  }

  if (answer.status === 'needs_review' || answer.status === 'conflicting') {
    parts.push('Review recommended — wording is ambiguous or documents disagree.');
  }

  if (answer.confidence === 'low' && answer.status === 'filled') {
    parts.push('Confidence is low; verify against the source before accepting.');
  }

  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  return sentences.slice(0, 4).join(' ').trim().slice(0, 500);
}

/** Ensure filled answers always carry an explanation when possible. */
export function enrichPrivacyAnswerRationale(answer: PrivacyAnswerProposal): PrivacyAnswerProposal {
  if (answer.rationale?.trim()) return answer;
  const built = buildAiFindingRationale(answer);
  return built ? { ...answer, rationale: built } : answer;
}

/** Downgrade weak filled answers that lack supporting material. */
export function validatePrivacyAnswer(answer: PrivacyAnswerProposal): PrivacyAnswerProposal {
  const enriched = enrichPrivacyAnswerRationale(answer);
  if (enriched.status !== 'filled') return enriched;

  const hasRationale = Boolean(enriched.rationale?.trim());
  const hasEvidence = enriched.evidence.length > 0;
  if (hasRationale || hasEvidence) return enriched;

  return {
    ...enriched,
    status: 'needs_review',
    confidence: enriched.confidence === 'high' ? 'medium' : enriched.confidence,
    rationale:
      enriched.rationale?.trim() ||
      'AI proposed an answer but did not provide supporting policy text. Please review manually.',
  };
}

/** @deprecated AI findings no longer use internalNotes. Use buildAiFindingRationale instead. */
export function buildPrivacyInternalNote(answer: PrivacyAnswerProposal): string {
  return buildAiFindingRationale(answer);
}
