/** Free access details (restrictions slug) — four simple reviewer questions. */

import type { RawValue } from '../scoring/engine';

export type AllowanceReset =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'no_reset'
  | 'not_stated'
  | '';

export type CreditsExpire = 'yes' | 'no' | 'not_stated' | 'na' | '';

export type TrialStated = 'yes' | 'no' | 'no_timed_trial' | '';

export type CreditCardRequired = 'no' | 'required' | 'not_stated' | '';

export interface FreeAccessDetails {
  allowanceReset: AllowanceReset;
  creditsExpire: CreditsExpire;
  trialStated: TrialStated;
  trialLength: string;
  creditCardRequired: CreditCardRequired;
}

const RESET_LABELS: Record<string, string> = {
  daily: 'Yes, daily',
  weekly: 'Yes, weekly',
  monthly: 'Yes, monthly',
  no_reset: 'No reset',
  not_stated: 'Not stated',
};

const EXPIRE_LABELS: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  not_stated: 'Not stated',
  na: 'Not applicable',
};

const TRIAL_LABELS: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  no_timed_trial: 'No timed trial',
};

const CARD_LABELS: Record<string, string> = {
  no: 'No credit card required',
  required: 'Credit card required',
  not_stated: 'Not stated',
};

export function parseFreeAccessDetails(raw: RawValue | undefined): FreeAccessDetails {
  const structured =
    raw && 'structured' in raw ? (raw.structured as Record<string, unknown> | undefined) : undefined;
  return {
    allowanceReset: (structured?.allowanceReset as AllowanceReset) ?? '',
    creditsExpire: (structured?.creditsExpire as CreditsExpire) ?? '',
    trialStated: (structured?.trialStated as TrialStated) ?? '',
    trialLength: typeof structured?.trialLength === 'string' ? structured.trialLength : '',
    creditCardRequired: (structured?.creditCardRequired as CreditCardRequired) ?? '',
  };
}

export function freeAccessDetailsToRaw(details: FreeAccessDetails): RawValue | undefined {
  const trimmed: FreeAccessDetails = {
    allowanceReset: details.allowanceReset,
    creditsExpire: details.creditsExpire,
    trialStated: details.trialStated,
    trialLength: details.trialLength.trim(),
    creditCardRequired: details.creditCardRequired,
  };
  const any = Object.values(trimmed).some((v) => v !== '');
  if (!any) return undefined;
  const pct = scoreFreeAccessDetailsPct(trimmed);
  return {
    value: pct,
    structured: trimmed,
  };
}

/** 0–100 for linear scoring rule on restrictions evidence. */
export function scoreFreeAccessDetailsPct(details: FreeAccessDetails): number {
  let total = 0;
  let parts = 0;

  const resetPts: Record<string, number> = {
    daily: 25,
    weekly: 20,
    monthly: 15,
    no_reset: 10,
    not_stated: 5,
  };
  if (details.allowanceReset) {
    total += resetPts[details.allowanceReset] ?? 0;
    parts++;
  }

  const expirePts: Record<string, number> = {
    no: 25,
    na: 20,
    not_stated: 10,
    yes: 5,
  };
  if (details.creditsExpire) {
    total += expirePts[details.creditsExpire] ?? 0;
    parts++;
  }

  if (details.trialStated) {
    if (details.trialStated === 'no_timed_trial') total += 25;
    else if (details.trialStated === 'yes') {
      total += details.trialLength.trim() ? 25 : 15;
    } else total += 5;
    parts++;
  }

  const cardPts: Record<string, number> = {
    no: 25,
    not_stated: 10,
    required: 0,
  };
  if (details.creditCardRequired) {
    total += cardPts[details.creditCardRequired] ?? 0;
    parts++;
  }

  if (parts === 0) return 0;
  return Math.round((total / parts) * 4 * 10) / 10;
}

export function isFreeAccessDetailsComplete(details: FreeAccessDetails): boolean {
  if (!details.allowanceReset || !details.creditsExpire || !details.trialStated || !details.creditCardRequired) {
    return false;
  }
  if (details.trialStated === 'yes' && !details.trialLength.trim()) return false;
  return true;
}

export function formatFreeAccessDetailsSummary(details: FreeAccessDetails): string {
  const bits: string[] = [];
  if (details.allowanceReset) bits.push(`Reset: ${RESET_LABELS[details.allowanceReset] ?? details.allowanceReset}`);
  if (details.creditsExpire) bits.push(`Expire: ${EXPIRE_LABELS[details.creditsExpire] ?? details.creditsExpire}`);
  if (details.trialStated) {
    let trial = TRIAL_LABELS[details.trialStated] ?? details.trialStated;
    if (details.trialStated === 'yes' && details.trialLength.trim()) {
      trial += ` (${details.trialLength.trim()})`;
    }
    bits.push(`Trial: ${trial}`);
  }
  if (details.creditCardRequired) {
    bits.push(CARD_LABELS[details.creditCardRequired] ?? details.creditCardRequired);
  }
  return bits.length > 0 ? bits.join(' · ') : '—';
}

export const FREE_ACCESS_FIELD_HINTS = {
  allowanceReset:
    'Check whether free messages, credits, images, or other allowances return after a set period.',
  creditsExpire:
    'Check whether unused free credits, messages, or other free allowances disappear after a certain time.',
  trialStated: 'Check whether the app clearly states how long a free trial lasts, if one exists.',
  trialLength: 'Examples: 3 days, 7 days, 14 days.',
  creditCardRequired:
    'Create a free account and check whether payment details are required before using any free features.',
} as const;

export { RESET_LABELS, EXPIRE_LABELS, TRIAL_LABELS, CARD_LABELS };
