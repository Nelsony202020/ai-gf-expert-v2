import {
  creditsPerDisplayUse,
  featureCostRange,
  fmtMoney,
  formatUseCount,
  type FeatureCostLike,
} from '../pricing/calc';
import type { PricingCreditMixer, PricingCreditMixerChannel, PricingCreditMixerPreset } from './types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function findCost(costs: FeatureCostLike[], ...types: string[]) {
  return costs.find((c) => types.includes(String(c.featureType ?? '')) && c.active !== false) ?? null;
}

function maxUnits(credits: number, creditsPerUnit: number): number {
  if (creditsPerUnit <= 0) return 0;
  return Math.floor((credits / creditsPerUnit) * 1000) / 1000;
}

function formatMaxCount(n: number, noun: string, plural?: string): string {
  const whole = Math.max(0, Math.floor(n));
  if (whole <= 0) return '—';
  const label = whole === 1 ? noun : (plural ?? `${noun}s`);
  return `≈${whole} ${label}`;
}

function moneyLabel(rate: number | null | undefined, creditsPerUnit: number, suffix: string, currency: string): string | null {
  if (rate == null || rate <= 0 || creditsPerUnit <= 0) return null;
  return `${fmtMoney(round2(creditsPerUnit * rate), currency)}${suffix}`;
}

function buildChannel(input: {
  key: PricingCreditMixerChannel['key'];
  label: string;
  icon: string;
  credits: number;
  creditsPerUnit: number;
  step: number;
  unitLabel: string;
  format: PricingCreditMixerChannel['format'];
  sublabel?: string | null;
  unitMoneyLabel?: string | null;
  maxLabel: string;
}): PricingCreditMixerChannel | null {
  if (input.creditsPerUnit <= 0) return null;
  const max = maxUnits(input.credits, input.creditsPerUnit);
  if (max <= 0) return null;
  return {
    key: input.key,
    label: input.label,
    icon: input.icon,
    creditsPerUnit: round2(input.creditsPerUnit),
    step: input.step,
    unitLabel: input.unitLabel,
    format: input.format,
    sublabel: input.sublabel ?? null,
    unitMoneyLabel: input.unitMoneyLabel ?? null,
    maxUnits: max,
    maxLabel: input.maxLabel,
  };
}

function channelQtyCredits(channel: PricingCreditMixerChannel, qty: number): number {
  return round2(qty * channel.creditsPerUnit);
}

/** Scale a preset down so it never exceeds the included pool. */
function fitPreset(
  channels: PricingCreditMixerChannel[],
  quantities: Record<string, number>,
  credits: number,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const ch of channels) next[ch.key] = 0;

  const byKey = Object.fromEntries(channels.map((c) => [c.key, c]));
  let remaining = credits;

  // Honor quantity object key order so the primary feature is spent first.
  const orderedKeys = [
    ...Object.keys(quantities).filter((k) => (quantities[k] ?? 0) > 0 && byKey[k]),
    ...channels.map((c) => c.key),
  ];
  const seen = new Set<string>();

  for (const key of orderedKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    const ch = byKey[key];
    if (!ch) continue;
    const wanted = quantities[key] ?? 0;
    if (wanted <= 0) continue;
    const maxAffordable = Math.floor(remaining / ch.creditsPerUnit / ch.step) * ch.step;
    const qty = Math.min(wanted, maxAffordable, Math.floor(ch.maxUnits / ch.step) * ch.step);
    const snapped = Math.max(0, round2(qty));
    next[ch.key] = snapped;
    remaining = round2(remaining - channelQtyCredits(ch, snapped));
  }
  return next;
}

export type BuildCreditMixerOptions = {
  ratePerCredit?: number | null;
  currency?: string;
  /** When set, only these mixer channels are built (plan-specific shared-credit features). */
  includeChannelKeys?: Array<PricingCreditMixerChannel['key']> | null;
};

export function buildCreditMixer(
  includedCredits: number,
  costs: FeatureCostLike[],
  opts: BuildCreditMixerOptions = {},
): PricingCreditMixer | null {
  if (!Number.isFinite(includedCredits) || includedCredits <= 0) return null;

  const rate = opts.ratePerCredit ?? null;
  const currency = opts.currency ?? 'USD';
  const channels: PricingCreditMixerChannel[] = [];

  const image = findCost(costs, 'standard_image', 'premium_image');
  if (image) {
    const per = creditsPerDisplayUse(image)?.max ?? 0;
    const max = maxUnits(includedCredits, per);
    const ch = buildChannel({
      key: 'images',
      label: 'Images',
      icon: 'image',
      credits: includedCredits,
      creditsPerUnit: per,
      step: 1,
      unitLabel: 'images',
      format: 'count',
      unitMoneyLabel: moneyLabel(rate, per, '/ea', currency),
      maxLabel: formatMaxCount(max, 'image'),
    });
    if (ch) channels.push(ch);
  }

  const video = findCost(costs, 'standard_video', 'text_to_video', 'image_to_video');
  if (video) {
    const per = creditsPerDisplayUse(video)?.max ?? 0;
    const seconds =
      video.durationProduced != null && Number(video.durationProduced) > 0
        ? Number(video.durationProduced)
        : 10;
    const max = maxUnits(includedCredits, per);
    const ch = buildChannel({
      key: 'videos',
      label: 'Videos',
      icon: 'videocam',
      credits: includedCredits,
      creditsPerUnit: per,
      step: 1,
      unitLabel: 'videos',
      format: 'count',
      sublabel: `${seconds} sec each`,
      unitMoneyLabel: moneyLabel(rate, per, `/${seconds} sec`, currency),
      maxLabel: formatMaxCount(max, 'video'),
    });
    if (ch) channels.push(ch);
  }

  const voiceMsg = findCost(costs, 'voice_message');
  if (voiceMsg) {
    const range = featureCostRange(voiceMsg);
    const unit = String(voiceMsg.unit ?? '');
    if (range && (unit === 'per_minute' || unit === 'per_second')) {
      const creditsPerMinute = unit === 'per_second' ? range.max * 60 : range.max;
      const maxMin = maxUnits(includedCredits, creditsPerMinute);
      const ch = buildChannel({
        key: 'voice_messages',
        label: 'Voice messages',
        icon: 'graphic_eq',
        credits: includedCredits,
        creditsPerUnit: creditsPerMinute,
        step: 5,
        unitLabel: 'min',
        format: 'minutes',
        unitMoneyLabel: moneyLabel(rate, creditsPerMinute, '/min', currency),
        maxLabel: `≈${formatUseCount(maxMin)} min voice`,
      });
      if (ch) channels.push(ch);
    }
  }

  const voiceCall = findCost(costs, 'voice_call');
  if (voiceCall) {
    const range = featureCostRange(voiceCall);
    if (range) {
      const perMin = range.max;
      const maxMin = maxUnits(includedCredits, perMin);
      const ch = buildChannel({
        key: 'voice_calls',
        label: 'Voice calls',
        icon: 'call',
        credits: includedCredits,
        creditsPerUnit: perMin,
        step: 5,
        unitLabel: 'min',
        format: 'minutes',
        unitMoneyLabel: moneyLabel(rate, perMin, '/min', currency),
        maxLabel: `≈${formatUseCount(maxMin)} min calls`,
      });
      if (ch) channels.push(ch);
    }
  }

  const character = findCost(costs, 'character_creation', 'custom_character');
  if (character) {
    const per = creditsPerDisplayUse(character)?.max ?? 0;
    const max = maxUnits(includedCredits, per);
    const ch = buildChannel({
      key: 'custom_character',
      label: 'Custom character',
      icon: 'person_edit',
      credits: includedCredits,
      creditsPerUnit: per,
      step: 1,
      unitLabel: 'characters',
      format: 'count',
      unitMoneyLabel: moneyLabel(rate, per, '/ea', currency),
      maxLabel: formatMaxCount(max, 'character'),
    });
    if (ch) channels.push(ch);
  }

  if (channels.length === 0) return null;

  const include = opts.includeChannelKeys;
  const filtered = include != null ? channels.filter((ch) => include.includes(ch.key)) : channels;
  if (filtered.length === 0) return null;

  const byKey = Object.fromEntries(filtered.map((c) => [c.key, c])) as Record<
    string,
    PricingCreditMixerChannel
  >;

  const snap = (key: string, wanted: number) => {
    const ch = byKey[key];
    if (!ch) return 0;
    return Math.min(wanted, Math.floor(ch.maxUnits / ch.step) * ch.step);
  };

  const rawPresets: Array<{ id: string; label: string; quantities: Record<string, number> }> = [
    {
      id: 'image-heavy',
      label: 'Image-heavy',
      quantities: {
        images: snap('images', Math.floor((byKey.images?.maxUnits ?? 0) * 0.7)),
        videos: snap('videos', 1),
        voice_calls: snap('voice_calls', 5),
      },
    },
    {
      id: 'balanced',
      label: 'Balanced',
      quantities: {
        images: snap('images', 10),
        videos: snap('videos', 2),
        voice_messages: snap('voice_messages', 30),
        voice_calls: snap('voice_calls', 10),
      },
    },
    {
      id: 'video-heavy',
      label: 'Video-heavy',
      quantities: {
        videos: snap('videos', Math.floor(byKey.videos?.maxUnits ?? 0)),
        images: snap('images', 3),
        voice_calls: snap('voice_calls', 5),
      },
    },
    {
      id: 'voice-heavy',
      label: 'Voice-heavy',
      quantities: {
        voice_messages: snap(
          'voice_messages',
          Math.floor((byKey.voice_messages?.maxUnits ?? 0) * 0.55),
        ),
        voice_calls: snap('voice_calls', Math.floor((byKey.voice_calls?.maxUnits ?? 0) * 0.4)),
        images: snap('images', 3),
      },
    },
  ];

  const presets: PricingCreditMixerPreset[] = rawPresets.map((p) => ({
    id: p.id,
    label: p.label,
    quantities: fitPreset(filtered, p.quantities, includedCredits),
  }));

  return {
    credits: includedCredits,
    heading: 'Build your credit mix',
    lead: 'Credits are shared across features. Use them all on one feature, or split them across images, video, voice messages, and calls.',
    channels: filtered,
    presets,
    footnote: `Prices reflect credit costs only. ${includedCredits} credits are included in the monthly plan.`,
  };
}
